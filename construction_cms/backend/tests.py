from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase
from rest_framework import status
from rest_framework.test import APITestCase

from backend.pagination import StandardPagination
from backend.validators import MAX_IMAGE_SIZE_MB, check_image_size
from company.models import ContactInquiry
from projects.models import Project


User = get_user_model()


class APIDiscoveryTests(APITestCase):
    def test_api_root_lists_auth_and_content_routes(self):
        response = self.client.get('/api/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['auth']['signup'], '/api/users/signup/')
        self.assertEqual(response.data['auth']['login'], '/api/users/login/')
        self.assertEqual(response.data['company']['services'], '/api/company/services/')
        self.assertEqual(response.data['content']['projects'], '/api/projects/')

    def test_openapi_schema_is_available(self):
        response = self.client.get('/api/schema/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_swagger_docs_are_available(self):
        response = self.client.get('/api/docs/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)


class BrowserRenderingTests(APITestCase):
    def test_filtered_lists_open_in_a_browser(self):
        # These pages crashed with TemplateDoesNotExist when django_filters wasn't installed.
        for url in ['/api/projects/', '/api/company/services/', '/api/company/team/', '/api/company/testimonials/']:
            response = self.client.get(url, HTTP_ACCEPT='text/html')
            self.assertEqual(response.status_code, status.HTTP_200_OK, url)


class PageSizeTests(APITestCase):
    def test_page_size_can_be_requested_up_to_the_maximum(self):
        for number in range(12):
            Project.objects.create(title=f'Project {number}', description='Text', start_date='2026-01-01')

        default_page = self.client.get('/api/projects/')
        larger_page = self.client.get('/api/projects/?page_size=12')
        capped_page = self.client.get('/api/projects/?page_size=5000')

        self.assertEqual(len(default_page.data['results']), 10)
        self.assertEqual(len(larger_page.data['results']), 12)
        self.assertEqual(len(capped_page.data['results']), 12)
        self.assertEqual(StandardPagination.max_page_size, 100)


class DashboardSummaryTests(APITestCase):
    def setUp(self):
        Project.objects.create(title='Draft', description='Text', start_date='2026-01-01', is_published=False)
        ContactInquiry.objects.create(full_name='Client', email='client@example.com', message='Hello')

    def make_user(self, role):
        return User.objects.create_user(username=role, email=f'{role}@example.com', password='x', role=role)

    def test_public_and_clients_cannot_open_summary(self):
        self.assertEqual(self.client.get('/api/dashboard/summary/').status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(user=self.make_user('client'))
        self.assertEqual(self.client.get('/api/dashboard/summary/').status_code, status.HTTP_403_FORBIDDEN)

    def test_engineer_summary_has_no_inquiry_data(self):
        self.client.force_authenticate(user=self.make_user('engineer'))

        response = self.client.get('/api/dashboard/summary/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['projects']['drafts'], 1)
        self.assertNotIn('inquiries', response.data)

    def test_manager_summary_counts_new_inquiries(self):
        self.client.force_authenticate(user=self.make_user('manager'))

        response = self.client.get('/api/dashboard/summary/')

        self.assertEqual(response.data['inquiries']['new'], 1)
        self.assertEqual(response.data['inquiries']['latest'][0]['full_name'], 'Client')


class ImageSizeTests(SimpleTestCase):
    def test_images_over_the_limit_are_rejected(self):
        too_big = SimpleUploadedFile('big.png', b'0' * (MAX_IMAGE_SIZE_MB * 1024 * 1024 + 1))

        with self.assertRaises(ValidationError):
            check_image_size(too_big)

    def test_saved_images_are_not_measured_again(self):
        class SavedImageWithMissingFile:
            _committed = True

            @property
            def size(self):
                raise FileNotFoundError

        check_image_size(SavedImageWithMissingFile())
