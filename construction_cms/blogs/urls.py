from django.urls import path
from .views import PostBySlugView, PostListCreateView, PostRetrieveUpdateDeleteView

urlpatterns = [
    path('', PostListCreateView.as_view(), name='post-list-create'),
    path('<int:pk>/', PostRetrieveUpdateDeleteView.as_view(), name='post-detail'),
    path('by-slug/<slug:slug>/', PostBySlugView.as_view(), name='post-by-slug'),
]
