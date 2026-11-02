from rest_framework import generics

from backend.permissions import CanEditProjectsAndBlogOrReadOnly, can_edit_projects_and_blog

from .models import Project
from .serializers import ProjectSerializer


def get_visible_projects(user):
    projects = Project.objects.all().order_by('-is_featured', '-start_date', 'title')

    # The public only sees published projects. Editors also see drafts.
    if not can_edit_projects_and_blog(user):
        projects = projects.filter(is_published=True)

    return projects


class ProjectListCreateView(generics.ListCreateAPIView):
    permission_classes = [CanEditProjectsAndBlogOrReadOnly]
    serializer_class = ProjectSerializer
    filterset_fields = ['status', 'location', 'discipline', 'is_published', 'is_featured']
    search_fields = ['title', 'client', 'location']
    ordering_fields = ['title', 'start_date', 'updated_at']

    def get_queryset(self):
        return get_visible_projects(self.request.user)


class ProjectRetrieveUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [CanEditProjectsAndBlogOrReadOnly]
    serializer_class = ProjectSerializer

    def get_queryset(self):
        return get_visible_projects(self.request.user)


class ProjectBySlugView(generics.RetrieveAPIView):
    permission_classes = [CanEditProjectsAndBlogOrReadOnly]
    serializer_class = ProjectSerializer
    lookup_field = 'slug'

    def get_queryset(self):
        return get_visible_projects(self.request.user)
