from django.contrib import admin
from .models import Project


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('title', 'discipline', 'status', 'is_published', 'location', 'start_date', 'end_date')
    list_filter = ('status', 'discipline', 'is_published', 'start_date')
    prepopulated_fields = {'slug': ('title',)}
    search_fields = ('title', 'description', 'client', 'location')
