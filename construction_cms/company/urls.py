from django.urls import path

from .views import (
    CompanyProfileView,
    ContactInquiryListCreateView,
    ContactInquiryRetrieveUpdateDeleteView,
    ServiceListCreateView,
    ServiceRetrieveUpdateDeleteView,
    TeamMemberListCreateView,
    TeamMemberRetrieveUpdateDeleteView,
    TestimonialListCreateView,
    TestimonialRetrieveUpdateDeleteView,
)


urlpatterns = [
    path('profile/', CompanyProfileView.as_view(), name='company-profile'),
    path('services/', ServiceListCreateView.as_view(), name='service-list-create'),
    path('services/<int:pk>/', ServiceRetrieveUpdateDeleteView.as_view(), name='service-detail'),
    path('team/', TeamMemberListCreateView.as_view(), name='team-member-list-create'),
    path('team/<int:pk>/', TeamMemberRetrieveUpdateDeleteView.as_view(), name='team-member-detail'),
    path('testimonials/', TestimonialListCreateView.as_view(), name='testimonial-list-create'),
    path('testimonials/<int:pk>/', TestimonialRetrieveUpdateDeleteView.as_view(), name='testimonial-detail'),
    path('contact/', ContactInquiryListCreateView.as_view(), name='contact-inquiry-list-create'),
    path('contact/<int:pk>/', ContactInquiryRetrieveUpdateDeleteView.as_view(), name='contact-inquiry-detail'),
]
