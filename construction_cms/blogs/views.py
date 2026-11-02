from rest_framework import generics

from backend.permissions import CanEditProjectsAndBlogOrReadOnly, can_edit_projects_and_blog

from .models import Post
from .serializers import PostSerializer


def get_visible_posts(user):
    posts = Post.objects.all().order_by('-published_at', '-updated_at')

    # The public only sees published posts. Editors also see drafts.
    if not can_edit_projects_and_blog(user):
        posts = posts.filter(status='published')

    return posts


class PostListCreateView(generics.ListCreateAPIView):
    permission_classes = [CanEditProjectsAndBlogOrReadOnly]
    serializer_class = PostSerializer
    filterset_fields = ['status']
    search_fields = ['title', 'author']
    ordering_fields = ['title', 'published_at', 'updated_at']

    def get_queryset(self):
        return get_visible_posts(self.request.user)


class PostRetrieveUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [CanEditProjectsAndBlogOrReadOnly]
    serializer_class = PostSerializer

    def get_queryset(self):
        return get_visible_posts(self.request.user)


class PostBySlugView(generics.RetrieveAPIView):
    permission_classes = [CanEditProjectsAndBlogOrReadOnly]
    serializer_class = PostSerializer
    lookup_field = 'slug'

    def get_queryset(self):
        return get_visible_posts(self.request.user)
