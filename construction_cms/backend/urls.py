"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from users.views import SafeTokenRefreshView, ThrottledTokenObtainPairView

from .views import APIRootView, DashboardSummaryView

urlpatterns = [
    path('admin/', admin.site.urls),

    # API discovery
    path('api/', APIRootView.as_view(), name='api-root'),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),

    # JWT Auth
    path('api/token/', ThrottledTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', SafeTokenRefreshView.as_view(), name='token_refresh'),

    # Staff dashboard
    path('api/dashboard/summary/', DashboardSummaryView.as_view(), name='dashboard-summary'),

    # Company CMS
    path('api/company/', include('company.urls')),

    # Projects
    path('api/projects/', include('projects.urls')),
    
    # Blog
    path('api/blog/', include('blogs.urls')),

    # Users (optional, for admin dashboard or frontend)
    path('api/users/', include('users.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
