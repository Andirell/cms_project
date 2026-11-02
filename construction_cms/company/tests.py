from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework import status
from rest_framework.test import APITestCase

from .models import CompanyProfile, ContactInquiry, Service, TeamMember, Testimonial


User = get_user_model()


def create_user(email, username, password="BuildStrongPass123!", **extra_fields):
    user = User(email=email, username=username, **extra_fields)
    user.set_password(password)
    user.save()
    return user


class CompanyAPITests(APITestCase):
    def service_payload(self):
        return {
            "title": "Civil Construction",
            "slug": "civil-construction",
            "description": "Residential and commercial building services.",
            "display_order": 1,
            "is_active": True,
        }

    def test_public_can_read_company_profile(self):
        CompanyProfile.objects.create(
            name="BuildRight Construction",
            tagline="Strong foundations, clean finishes",
            about="A construction company focused on quality delivery.",
        )

        response = self.client.get("/api/company/profile/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "BuildRight Construction")

    def test_staff_can_create_company_profile(self):
        staff = create_user(
            "admin@example.com",
            "admin",
            is_staff=True,
            role="admin",
        )
        self.client.force_authenticate(user=staff)

        response = self.client.post(
            "/api/company/profile/",
            {
                "name": "BuildRight Construction",
                "tagline": "Built with care",
                "about": "A trusted construction partner.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(CompanyProfile.objects.count(), 1)

    def test_public_cannot_create_service(self):
        response = self.client.post(
            "/api/company/services/",
            self.service_payload(),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_staff_can_create_service(self):
        staff = create_user(
            "admin@example.com",
            "admin",
            is_staff=True,
            role="admin",
        )
        self.client.force_authenticate(user=staff)

        response = self.client.post(
            "/api/company/services/",
            self.service_payload(),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_public_only_sees_active_services(self):
        Service.objects.create(**self.service_payload())
        Service.objects.create(
            title="Hidden Draft",
            slug="hidden-draft",
            description="Not ready for public display.",
            is_active=False,
        )

        response = self.client.get("/api/company/services/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["title"], "Civil Construction")

    def test_public_only_sees_active_team_members(self):
        TeamMember.objects.create(name="Ada Stone", role="Project Manager")
        TeamMember.objects.create(
            name="Draft Member",
            role="Estimator",
            is_active=False,
        )

        response = self.client.get("/api/company/team/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["name"], "Ada Stone")

    def test_public_only_sees_approved_testimonials(self):
        Testimonial.objects.create(
            client_name="Pearl Homes",
            quote="They delivered on time.",
            rating=5,
            is_approved=True,
        )
        Testimonial.objects.create(
            client_name="Draft Client",
            quote="Waiting for approval.",
            rating=4,
            is_approved=False,
        )

        response = self.client.get("/api/company/testimonials/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["client_name"], "Pearl Homes")

    def test_public_can_submit_contact_inquiry_but_not_internal_fields(self):
        response = self.client.post(
            "/api/company/contact/",
            {
                "full_name": "Client Person",
                "email": "client@example.com",
                "phone": "555-1234",
                "service_interest": "Renovation",
                "message": "I need a quote.",
                "status": "closed",
                "internal_notes": "Should not be accepted from public.",
            },
            format="json",
        )

        inquiry = ContactInquiry.objects.get()
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(inquiry.status, "new")
        self.assertEqual(inquiry.internal_notes, "")

    def test_public_cannot_list_contact_inquiries(self):
        ContactInquiry.objects.create(
            full_name="Client Person",
            email="client@example.com",
            message="I need a quote.",
        )

        response = self.client.get("/api/company/contact/")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_staff_can_list_contact_inquiries(self):
        staff = create_user(
            "admin@example.com",
            "admin",
            is_staff=True,
            role="admin",
        )
        ContactInquiry.objects.create(
            full_name="Client Person",
            email="client@example.com",
            message="I need a quote.",
        )
        self.client.force_authenticate(user=staff)

        response = self.client.get("/api/company/contact/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)


class CompanyProfileRuleTests(APITestCase):
    def test_patch_without_a_profile_does_not_create_a_blank_one(self):
        staff = create_user("admin@example.com", "admin", role="admin")
        self.client.force_authenticate(user=staff)

        response = self.client.patch("/api/company/profile/", {"tagline": "Only a tagline"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("name", response.data)
        self.assertEqual(CompanyProfile.objects.count(), 0)

    def test_manager_cannot_edit_company_profile(self):
        manager = create_user("manager@example.com", "manager", role="manager")
        self.client.force_authenticate(user=manager)

        response = self.client.post("/api/company/profile/", {"name": "New", "about": "Text"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class CompanyRoleTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.addCleanup(cache.clear)

    def test_manager_can_create_service_with_automatic_slug(self):
        manager = create_user("manager@example.com", "manager", role="manager")
        self.client.force_authenticate(user=manager)

        response = self.client.post(
            "/api/company/services/",
            {"title": "Structural Design", "description": "Design work."},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["slug"], "structural-design")

    def test_engineer_cannot_edit_services_or_read_inquiries(self):
        engineer = create_user("engineer@example.com", "engineer", role="engineer")
        self.client.force_authenticate(user=engineer)

        create_service = self.client.post(
            "/api/company/services/",
            {"title": "Structural Design", "description": "Design work."},
            format="json",
        )
        read_inquiries = self.client.get("/api/company/contact/")

        self.assertEqual(create_service.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(read_inquiries.status_code, status.HTTP_403_FORBIDDEN)

    def test_public_cannot_set_inquiry_status_on_create(self):
        response = self.client.post(
            "/api/company/contact/",
            {"full_name": "A", "email": "a@example.com", "message": "Hi", "status": "closed"},
            format="json",
        )

        self.assertEqual(response.data["status"], "new")

    def test_contact_form_is_limited_but_staff_can_still_read(self):
        manager = create_user("manager@example.com", "manager", role="manager")
        payload = {"full_name": "A", "email": "a@example.com", "message": "Hi"}

        last_response = None
        for attempt in range(11):
            last_response = self.client.post("/api/company/contact/", payload, format="json")

        self.client.force_authenticate(user=manager)
        read_response = self.client.get("/api/company/contact/")

        self.assertEqual(last_response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertEqual(read_response.status_code, status.HTTP_200_OK)


class ServiceSlugTests(APITestCase):
    def test_long_title_can_be_saved_and_edited_again(self):
        manager = create_user("manager@example.com", "manager", role="manager")
        self.client.force_authenticate(user=manager)
        long_title = "Structural Assessment And Rehabilitation Of Existing Reinforced Concrete Bridges"

        created = self.client.post(
            "/api/company/services/",
            {"title": long_title, "description": "Text"},
            format="json",
        )
        edited = self.client.patch(
            f"/api/company/services/{created.data['id']}/",
            {"slug": created.data["slug"], "description": "New text"},
            format="json",
        )

        self.assertEqual(created.status_code, status.HTTP_201_CREATED)
        self.assertEqual(edited.status_code, status.HTTP_200_OK)
