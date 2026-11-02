from django.urls import path
from .views import ProjectBySlugView, ProjectListCreateView, ProjectRetrieveUpdateDeleteView

urlpatterns = [
    path('', ProjectListCreateView.as_view(), name='project-list-create'),
    path('<int:pk>/', ProjectRetrieveUpdateDeleteView.as_view(), name='project-detail'),
    path('by-slug/<slug:slug>/', ProjectBySlugView.as_view(), name='project-by-slug'),
]
