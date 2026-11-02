from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Post


User = get_user_model()


def create_user(email, username, password="BuildStrongPass123!", **extra_fields):
    user = User(email=email, username=username, **extra_fields)
    user.set_password(password)
    user.save()
    return user


class BlogAPITests(APITestCase):
    def post_payload(self):
        return {
            "title": "Completed Duplex Remodel",
            "slug": "completed-duplex-remodel",
            "content": "A short case study about a recently completed job.",
            "author": "CMS Team",
        }

    def test_public_can_view_blog_list(self):
        Post.objects.create(**self.post_payload())

        response = self.client.get("/api/blog/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)

    def test_non_staff_user_cannot_create_blog_post(self):
        user = create_user("client@example.com", "client")
        self.client.force_authenticate(user=user)

        response = self.client.post(
            "/api/blog/",
            self.post_payload(),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_staff_user_can_create_blog_post(self):
        staff = create_user(
            "admin@example.com",
            "admin",
            is_staff=True,
            role="admin",
        )
        self.client.force_authenticate(user=staff)

        response = self.client.post(
            "/api/blog/",
            self.post_payload(),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


class PostDraftTests(APITestCase):
    def test_public_cannot_see_drafts(self):
        draft = Post.objects.create(title="Draft", content="Text", author="Team", status="draft")

        list_response = self.client.get("/api/blog/")
        detail_response = self.client.get(f"/api/blog/{draft.id}/")
        slug_response = self.client.get(f"/api/blog/by-slug/{draft.slug}/")

        self.assertEqual(list_response.data["count"], 0)
        self.assertEqual(detail_response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(slug_response.status_code, status.HTTP_404_NOT_FOUND)

    def test_published_date_is_set_on_first_publish_and_kept(self):
        post = Post.objects.create(title="Draft", content="Text", author="Team", status="draft")
        self.assertIsNone(post.published_at)

        post.status = "published"
        post.save()
        first_published_at = post.published_at
        self.assertIsNotNone(first_published_at)

        post.status = "draft"
        post.save()
        post.status = "published"
        post.save()
        self.assertEqual(post.published_at, first_published_at)

    def test_engineer_can_create_draft_with_automatic_slug(self):
        self.client.force_authenticate(user=create_user("engineer@example.com", "engineer", role="engineer"))

        response = self.client.post(
            "/api/blog/",
            {"title": "Site Notes", "content": "Text", "author": "Team", "status": "draft"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["slug"], "site-notes")
        self.assertIsNone(response.data["published_at"])
