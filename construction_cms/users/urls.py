from django.urls import path
from .views import (
    SignupAPIView,
    LoginAPIView,
    LogoutAPIView,
    UserMeAPIView,
    UserListAPIView,
    UserDetailAPIView,
    PasswordChangeView
)

urlpatterns = [
    # AUTH
    path("signup/", SignupAPIView.as_view(), name="signup"),
    path("login/", LoginAPIView.as_view(), name="login"),
    path("logout/", LogoutAPIView.as_view(), name="logout"),

    # USER PROFILE
    path("me/", UserMeAPIView.as_view(), name="me"),
    path("change-password/", PasswordChangeView.as_view(), name="change-password"),

    # ADMIN / USER CRUD
    path("", UserListAPIView.as_view(), name="user-list"),
    path("<int:pk>/", UserDetailAPIView.as_view(), name="user-detail"),
]
