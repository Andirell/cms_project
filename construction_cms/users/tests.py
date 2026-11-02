from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework import status
from rest_framework.test import APITestCase


User = get_user_model()


def create_user(email, username, password="BuildStrongPass123!", **extra_fields):
    user = User(email=email, username=username, **extra_fields)
    user.set_password(password)
    user.save()
    return user


class UserAPITests(APITestCase):
    def test_signup_ignores_submitted_role(self):
        response = self.client.post(
            "/api/users/signup/",
            {
                "email": "client@example.com",
                "username": "client",
                "password": "BuildStrongPass123!",
                "confirm_password": "BuildStrongPass123!",
                "role": "admin",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["role"], "client")

    def test_empty_signup_returns_validation_error(self):
        response = self.client.post("/api/users/signup/", {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_missing_fields_returns_validation_error(self):
        response = self.client.post("/api/users/login/", {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_returns_tokens_and_user(self):
        create_user("client@example.com", "client")

        response = self.client.post(
            "/api/users/login/",
            {
                "email": "client@example.com",
                "password": "BuildStrongPass123!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(response.data["user"]["email"], "client@example.com")

    def test_user_cannot_change_own_role(self):
        user = create_user("client@example.com", "client", role="client")
        self.client.force_authenticate(user=user)

        response = self.client.patch(
            f"/api/users/{user.id}/",
            {"role": "admin"},
            format="json",
        )

        user.refresh_from_db()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(user.role, "client")

    def test_staff_can_change_user_role(self):
        staff = create_user(
            "admin@example.com",
            "admin",
            role="admin",
            is_staff=True,
        )
        user = create_user("client@example.com", "client", role="client")
        self.client.force_authenticate(user=staff)

        response = self.client.patch(
            f"/api/users/{user.id}/",
            {"role": "manager"},
            format="json",
        )

        user.refresh_from_db()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(user.role, "manager")


class EmailCaseTests(APITestCase):
    def test_login_ignores_email_case(self):
        create_user("Case@Example.com", "case_user")

        response = self.client.post(
            "/api/users/login/",
            {"email": "case@EXAMPLE.com", "password": "BuildStrongPass123!"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_token_route_ignores_email_case(self):
        create_user("case@example.com", "case_user")

        response = self.client.post(
            "/api/token/",
            {"email": "CASE@example.com", "password": "BuildStrongPass123!"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_signup_rejects_email_that_differs_only_by_case(self):
        create_user("case@example.com", "case_user")

        response = self.client.post(
            "/api/users/signup/",
            {
                "email": "CASE@example.com",
                "username": "another_user",
                "password": "BuildStrongPass123!",
                "confirm_password": "BuildStrongPass123!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)

    def test_password_spaces_survive_from_signup_to_login(self):
        password = "  BuildStrongPass123!  "
        self.client.post(
            "/api/users/signup/",
            {"email": "space@example.com", "username": "space", "password": password, "confirm_password": password},
            format="json",
        )

        response = self.client.post(
            "/api/users/login/",
            {"email": "space@example.com", "password": password},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)


class ThrottleTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.addCleanup(cache.clear)

    def test_login_is_limited(self):
        statuses = []
        for attempt in range(11):
            response = self.client.post(
                "/api/users/login/",
                {"email": "nobody@example.com", "password": "wrong"},
                format="json",
            )
            statuses.append(response.status_code)

        self.assertEqual(statuses[0], status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(statuses[-1], status.HTTP_429_TOO_MANY_REQUESTS)

    def test_token_route_shares_the_login_limit(self):
        for attempt in range(10):
            self.client.post(
                "/api/users/login/",
                {"email": "nobody@example.com", "password": "wrong"},
                format="json",
            )

        response = self.client.post(
            "/api/token/",
            {"email": "nobody@example.com", "password": "wrong"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    def test_fake_forwarded_header_does_not_avoid_the_limit(self):
        last_response = None
        for attempt in range(11):
            last_response = self.client.post(
                "/api/users/login/",
                {"email": "nobody@example.com", "password": "wrong"},
                format="json",
                HTTP_X_FORWARDED_FOR=f"10.0.0.{attempt}",
            )

        self.assertEqual(last_response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)


class TokenRevocationTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.addCleanup(cache.clear)
        self.user = create_user("client@example.com", "client")
        response = self.client.post(
            "/api/users/login/",
            {"email": "client@example.com", "password": "BuildStrongPass123!"},
            format="json",
        )
        self.access = response.data["access"]
        self.refresh = response.data["refresh"]

    def change_password(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access}")
        response = self.client.post(
            "/api/users/change-password/",
            {
                "old_password": "BuildStrongPass123!",
                "new_password": "AnotherStrongPass456!",
                "confirm_new_password": "AnotherStrongPass456!",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_password_change_revokes_refresh_token(self):
        self.change_password()

        self.client.credentials()
        response = self.client.post("/api/token/refresh/", {"refresh": self.refresh}, format="json")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_password_change_revokes_access_token(self):
        self.change_password()

        response = self.client.get("/api/users/me/")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_revokes_refresh_token(self):
        logout = self.client.post("/api/users/logout/", {"refresh": self.refresh}, format="json")
        refresh = self.client.post("/api/token/refresh/", {"refresh": self.refresh}, format="json")

        self.assertEqual(logout.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(refresh.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_old_refresh_token_stops_working_after_rotation(self):
        first = self.client.post("/api/token/refresh/", {"refresh": self.refresh}, format="json")
        second = self.client.post("/api/token/refresh/", {"refresh": self.refresh}, format="json")

        self.assertEqual(first.status_code, status.HTTP_200_OK)
        self.assertEqual(second.status_code, status.HTTP_401_UNAUTHORIZED)


class RoleRuleTests(APITestCase):
    def test_manager_cannot_change_roles_or_list_users(self):
        manager = create_user("manager@example.com", "manager", role="manager")
        client_user = create_user("client@example.com", "client")
        self.client.force_authenticate(user=manager)

        promote_self = self.client.patch(f"/api/users/{manager.id}/", {"role": "admin"}, format="json")
        change_other = self.client.patch(f"/api/users/{client_user.id}/", {"role": "manager"}, format="json")
        user_list = self.client.get("/api/users/")

        manager.refresh_from_db()
        self.assertEqual(promote_self.status_code, status.HTTP_200_OK)
        self.assertEqual(manager.role, "manager")
        self.assertEqual(change_other.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(user_list.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_cannot_change_own_role_or_delete_self(self):
        admin = create_user("admin@example.com", "admin", role="admin")
        self.client.force_authenticate(user=admin)

        change_role = self.client.patch(f"/api/users/{admin.id}/", {"role": "client"}, format="json")
        delete_self = self.client.delete(f"/api/users/{admin.id}/")

        admin.refresh_from_db()
        self.assertEqual(change_role.status_code, status.HTTP_200_OK)
        self.assertEqual(admin.role, "admin")
        self.assertEqual(delete_self.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_role_cannot_change_a_superuser(self):
        admin = create_user("admin@example.com", "admin", role="admin")
        owner = create_user("owner@example.com", "owner", is_superuser=True, is_staff=True)
        self.client.force_authenticate(user=admin)

        change_email = self.client.patch(f"/api/users/{owner.id}/", {"email": "attacker@example.com"}, format="json")
        delete_owner = self.client.delete(f"/api/users/{owner.id}/")

        owner.refresh_from_db()
        self.assertEqual(change_email.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(delete_owner.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(owner.email, "owner@example.com")

    def test_client_can_delete_own_account_with_empty_response(self):
        user = create_user("client@example.com", "client")
        self.client.force_authenticate(user=user)

        response = self.client.delete(f"/api/users/{user.id}/")

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertIsNone(response.data)

    def test_user_list_is_paginated(self):
        admin = create_user("admin@example.com", "admin", role="admin")
        self.client.force_authenticate(user=admin)

        response = self.client.get("/api/users/")

        self.assertEqual(response.data["count"], 1)


class SignupPasswordTests(APITestCase):
    def test_signup_rejects_password_that_matches_email(self):
        response = self.client.post(
            "/api/users/signup/",
            {
                "email": "johnsmith@example.com",
                "username": "johnsmith",
                "password": "johnsmith@example.com",
                "confirm_password": "johnsmith@example.com",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class DeletedUserTokenTests(APITestCase):
    def test_refreshing_a_deleted_users_token_is_not_a_server_error(self):
        cache.clear()
        self.addCleanup(cache.clear)
        user = create_user("client@example.com", "client")
        login = self.client.post(
            "/api/users/login/",
            {"email": "client@example.com", "password": "BuildStrongPass123!"},
            format="json",
        )
        user.delete()

        self.client.raise_request_exception = False
        response = self.client.post("/api/token/refresh/", {"refresh": login.data["refresh"]}, format="json")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
