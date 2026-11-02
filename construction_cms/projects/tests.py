from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Project


User = get_user_model()


def create_user(email, username, password="BuildStrongPass123!", **extra_fields):
    user = User(email=email, username=username, **extra_fields)
    user.set_password(password)
    user.save()
    return user


class ProjectAPITests(APITestCase):
    def project_payload(self):
        return {
            "title": "Warehouse Renovation",
            "description": "Structural repairs and interior finishing.",
            "status": "ongoing",
            "location": "Lagos",
            "start_date": "2026-06-01",
            "end_date": "2026-09-30",
        }

    def test_public_can_view_project_list_at_expected_route(self):
        Project.objects.create(**self.project_payload())

        response = self.client.get("/api/projects/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)

    def test_project_route_is_not_duplicated(self):
        response = self.client.get("/api/projects/projects/")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_non_staff_user_cannot_create_project(self):
        user = create_user("client@example.com", "client")
        self.client.force_authenticate(user=user)

        response = self.client.post(
            "/api/projects/",
            self.project_payload(),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_staff_user_can_create_project(self):
        staff = create_user(
            "admin@example.com",
            "admin",
            is_staff=True,
            role="admin",
        )
        self.client.force_authenticate(user=staff)

        response = self.client.post(
            "/api/projects/",
            self.project_payload(),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_project_end_date_cannot_precede_start_date(self):
        staff = create_user(
            "admin@example.com",
            "admin",
            is_staff=True,
            role="admin",
        )
        payload = self.project_payload()
        payload["end_date"] = "2026-05-01"
        self.client.force_authenticate(user=staff)

        response = self.client.post("/api/projects/", payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("end_date", response.data)


class ProjectDraftTests(APITestCase):
    def setUp(self):
        self.draft = Project.objects.create(
            title="Bridge Survey",
            description="Text",
            start_date="2026-06-01",
            is_published=False,
        )

    def test_public_cannot_see_drafts_anywhere(self):
        list_response = self.client.get("/api/projects/")
        detail_response = self.client.get(f"/api/projects/{self.draft.id}/")
        slug_response = self.client.get(f"/api/projects/by-slug/{self.draft.slug}/")
        filter_response = self.client.get("/api/projects/?is_published=false")

        self.assertEqual(list_response.data["count"], 0)
        self.assertEqual(detail_response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(slug_response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(filter_response.data["count"], 0)

    def test_client_cannot_see_drafts(self):
        self.client.force_authenticate(user=create_user("client@example.com", "client"))

        response = self.client.get("/api/projects/")

        self.assertEqual(response.data["count"], 0)

    def test_engineer_can_see_and_publish_drafts(self):
        self.client.force_authenticate(user=create_user("engineer@example.com", "engineer", role="engineer"))

        list_response = self.client.get("/api/projects/")
        publish_response = self.client.patch(
            f"/api/projects/{self.draft.id}/",
            {"is_published": True},
            format="json",
        )

        self.assertEqual(list_response.data["count"], 1)
        self.assertEqual(publish_response.status_code, status.HTTP_200_OK)

        self.client.force_authenticate(user=None)
        self.assertEqual(self.client.get("/api/projects/").data["count"], 1)


class ProjectSlugTests(APITestCase):
    def test_same_title_gets_a_different_slug(self):
        first = Project.objects.create(title="Road Upgrade", description="Text", start_date="2026-01-01")
        second = Project.objects.create(title="Road Upgrade", description="Text", start_date="2026-01-01")

        self.assertEqual(first.slug, "road-upgrade")
        self.assertEqual(second.slug, "road-upgrade-2")

    def test_saving_again_keeps_the_slug(self):
        project = Project.objects.create(title="Road Upgrade", description="Text", start_date="2026-01-01")

        project.title = "New Title"
        project.save()

        self.assertEqual(project.slug, "road-upgrade")

    def test_public_can_open_published_project_by_slug(self):
        project = Project.objects.create(title="Road Upgrade", description="Text", start_date="2026-01-01")

        response = self.client.get(f"/api/projects/by-slug/{project.slug}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "Road Upgrade")
