from django.contrib import admin

from .models import (
    CompanyProfile,
    ContactInquiry,
    Service,
    TeamMember,
    Testimonial,
)


@admin.register(CompanyProfile)
class CompanyProfileAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'phone', 'updated_at')
    search_fields = ('name', 'tagline', 'about', 'email', 'phone')

    def has_add_permission(self, request):
        # The site has one company profile, which the API always reads.
        return not CompanyProfile.objects.exists()


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ('title', 'display_order', 'is_active', 'updated_at')
    list_filter = ('is_active',)
    prepopulated_fields = {'slug': ('title',)}
    search_fields = ('title', 'description')
    ordering = ('display_order', 'title')


@admin.register(TeamMember)
class TeamMemberAdmin(admin.ModelAdmin):
    list_display = ('name', 'role', 'display_order', 'is_active')
    list_filter = ('is_active', 'role')
    search_fields = ('name', 'role', 'bio', 'email')
    ordering = ('display_order', 'name')


@admin.register(Testimonial)
class TestimonialAdmin(admin.ModelAdmin):
    list_display = ('client_name', 'project_name', 'rating', 'is_featured', 'is_approved')
    list_filter = ('rating', 'is_featured', 'is_approved')
    search_fields = ('client_name', 'project_name', 'quote')


@admin.register(ContactInquiry)
class ContactInquiryAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'email', 'service_interest', 'status', 'created_at')
    list_filter = ('status', 'service_interest')
    search_fields = ('full_name', 'email', 'phone', 'message')
    readonly_fields = ('created_at', 'updated_at')
