from drf_spectacular.utils import extend_schema
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from backend.permissions import (
    CanEditCompanyContentOrCreateOnly,
    CanEditCompanyContentOrReadOnly,
    CanManageUsersOrReadOnly,
    can_edit_company_content,
)
from users.throttles import ContactRateThrottle

from .models import CompanyProfile, ContactInquiry, Service, TeamMember, Testimonial
from .serializers import (
    CompanyProfileSerializer,
    ContactInquirySerializer,
    ServiceSerializer,
    TeamMemberSerializer,
    TestimonialSerializer,
)


def get_visible_services(user):
    if can_edit_company_content(user):
        return Service.objects.all()
    return Service.objects.filter(is_active=True)


def get_visible_team(user):
    if can_edit_company_content(user):
        return TeamMember.objects.all()
    return TeamMember.objects.filter(is_active=True)


def get_visible_testimonials(user):
    if can_edit_company_content(user):
        return Testimonial.objects.all()
    return Testimonial.objects.filter(is_approved=True)


class CompanyProfileView(APIView):
    permission_classes = [CanManageUsersOrReadOnly]
    serializer_class = CompanyProfileSerializer

    def get_object(self):
        return CompanyProfile.objects.order_by('id').first()

    @extend_schema(responses={200: CompanyProfileSerializer})
    def get(self, request):
        profile = self.get_object()
        if profile is None:
            return Response({}, status=status.HTTP_200_OK)

        serializer = CompanyProfileSerializer(profile, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(request=CompanyProfileSerializer, responses={201: CompanyProfileSerializer})
    def post(self, request):
        return self.upsert(request)

    @extend_schema(request=CompanyProfileSerializer, responses={200: CompanyProfileSerializer})
    def put(self, request):
        return self.upsert(request)

    @extend_schema(request=CompanyProfileSerializer, responses={200: CompanyProfileSerializer})
    def patch(self, request):
        return self.upsert(request, partial=True)

    def upsert(self, request, partial=False):
        profile = self.get_object()

        # With no profile yet, this request creates one, so the required fields must be
        # checked. Otherwise a PATCH would save a profile with a blank name.
        if profile is None:
            partial = False

        serializer = CompanyProfileSerializer(
            profile,
            data=request.data,
            partial=partial,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        response_status = status.HTTP_200_OK if profile else status.HTTP_201_CREATED
        return Response(serializer.data, status=response_status)


class ServiceListCreateView(generics.ListCreateAPIView):
    permission_classes = [CanEditCompanyContentOrReadOnly]
    serializer_class = ServiceSerializer
    filterset_fields = ['is_active']
    search_fields = ['title']

    def get_queryset(self):
        return get_visible_services(self.request.user)


class ServiceRetrieveUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [CanEditCompanyContentOrReadOnly]
    serializer_class = ServiceSerializer

    def get_queryset(self):
        return get_visible_services(self.request.user)


class TeamMemberListCreateView(generics.ListCreateAPIView):
    permission_classes = [CanEditCompanyContentOrReadOnly]
    serializer_class = TeamMemberSerializer
    filterset_fields = ['is_active']
    search_fields = ['name', 'role']

    def get_queryset(self):
        return get_visible_team(self.request.user)


class TeamMemberRetrieveUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [CanEditCompanyContentOrReadOnly]
    serializer_class = TeamMemberSerializer

    def get_queryset(self):
        return get_visible_team(self.request.user)


class TestimonialListCreateView(generics.ListCreateAPIView):
    permission_classes = [CanEditCompanyContentOrReadOnly]
    serializer_class = TestimonialSerializer
    filterset_fields = ['is_featured', 'is_approved']
    search_fields = ['client_name', 'project_name']

    def get_queryset(self):
        return get_visible_testimonials(self.request.user)


class TestimonialRetrieveUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [CanEditCompanyContentOrReadOnly]
    serializer_class = TestimonialSerializer

    def get_queryset(self):
        return get_visible_testimonials(self.request.user)


class ContactInquiryListCreateView(generics.ListCreateAPIView):
    permission_classes = [CanEditCompanyContentOrCreateOnly]
    queryset = ContactInquiry.objects.all()
    serializer_class = ContactInquirySerializer
    filterset_fields = ['status']
    search_fields = ['full_name', 'email', 'service_interest']

    def get_throttles(self):
        # Only sending an inquiry is limited, so staff can still read the list freely.
        if self.request.method == 'POST':
            return [ContactRateThrottle()]
        return super().get_throttles()


class ContactInquiryRetrieveUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [CanEditCompanyContentOrCreateOnly]
    queryset = ContactInquiry.objects.all()
    serializer_class = ContactInquirySerializer
