from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from blogs.models import Post
from company.models import ContactInquiry, Service, TeamMember, Testimonial
from company.serializers import ContactInquirySerializer
from projects.models import Project

from .permissions import CanUseDashboard, can_edit_company_content


class APIRootView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(responses=OpenApiTypes.OBJECT)
    def get(self, request):
        return Response({
            'docs': {
                'swagger': '/api/docs/',
                'schema': '/api/schema/',
            },
            'auth': {
                'signup': '/api/users/signup/',
                'login': '/api/users/login/',
                'logout': '/api/users/logout/',
                'token': '/api/token/',
                'token_refresh': '/api/token/refresh/',
                'me': '/api/users/me/',
                'change_password': '/api/users/change-password/',
            },
            'company': {
                'profile': '/api/company/profile/',
                'services': '/api/company/services/',
                'team': '/api/company/team/',
                'testimonials': '/api/company/testimonials/',
                'contact': '/api/company/contact/',
            },
            'content': {
                'projects': '/api/projects/',
                'blog': '/api/blog/',
            },
            'dashboard': '/api/dashboard/summary/',
            'admin': '/admin/',
        })


class DashboardSummaryView(APIView):
    permission_classes = [CanUseDashboard]

    @extend_schema(responses=OpenApiTypes.OBJECT)
    def get(self, request):
        summary = {
            'projects': {
                'total': Project.objects.count(),
                'drafts': Project.objects.filter(is_published=False).count(),
                'ongoing': Project.objects.filter(status='ongoing').count(),
            },
            'posts': {
                'total': Post.objects.count(),
                'drafts': Post.objects.filter(status='draft').count(),
            },
        }

        # Engineers can't open inquiries, so they don't get that data here either.
        if can_edit_company_content(request.user):
            new_inquiries = ContactInquiry.objects.filter(status='new')
            summary['services'] = {'total': Service.objects.count()}
            summary['team'] = {'total': TeamMember.objects.count()}
            summary['testimonials'] = {
                'total': Testimonial.objects.count(),
                'waiting_for_approval': Testimonial.objects.filter(is_approved=False).count(),
            }
            summary['inquiries'] = {
                'new': new_inquiries.count(),
                'latest': ContactInquirySerializer(
                    new_inquiries[:5],
                    many=True,
                    context={'request': request},
                ).data,
            }

        return Response(summary)
