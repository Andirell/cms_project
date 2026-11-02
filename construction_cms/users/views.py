from django.contrib.auth import authenticate
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from backend.permissions import CanManageUsers

from .models import User
from .serializers import (
    EmailTokenObtainPairSerializer,
    LoginResponseSerializer,
    LoginSerializer,
    LogoutSerializer,
    PasswordChangeSerializer,
    SafeTokenRefreshSerializer,
    UserDetailSerializer,
    UserSerializer,
)
from .throttles import LoginRateThrottle, PasswordChangeRateThrottle, SignupRateThrottle


def revoke_all_refresh_tokens(user):
    for token in OutstandingToken.objects.filter(user=user):
        BlacklistedToken.objects.get_or_create(token=token)


def not_authorized_response():
    return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)


def can_change_account(request_user, target_user):
    # Only a superuser can change a superuser, so a normal admin can't take over the owner's account.
    if target_user.is_superuser and not request_user.is_superuser:
        return False

    return request_user.can_manage_users or request_user.pk == target_user.pk


class SignupAPIView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [SignupRateThrottle]
    serializer_class = UserSerializer

    @extend_schema(request=UserSerializer, responses={201: UserDetailSerializer})
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.save()

        return Response(
            UserDetailSerializer(user).data,
            status=status.HTTP_201_CREATED
        )


class LoginAPIView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [LoginRateThrottle]
    serializer_class = LoginSerializer

    @extend_schema(request=LoginSerializer, responses={200: LoginResponseSerializer})
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = authenticate(
            request,
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
        )

        if user is None:
            return Response(
                {"error": "invalid credentials"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        refresh = RefreshToken.for_user(user)

        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": UserDetailSerializer(user).data
        }, status=status.HTTP_200_OK)


class ThrottledTokenObtainPairView(TokenObtainPairView):
    # /api/token/ also accepts passwords, so it needs the same limit as the login route.
    throttle_classes = [LoginRateThrottle]
    serializer_class = EmailTokenObtainPairSerializer


class SafeTokenRefreshView(TokenRefreshView):
    serializer_class = SafeTokenRefreshSerializer


class LogoutAPIView(APIView):
    # The refresh token proves who is logging out, and the access token may already
    # have expired, so this route doesn't read the Authorization header.
    authentication_classes = []
    permission_classes = [permissions.AllowAny]
    serializer_class = LogoutSerializer

    @extend_schema(request=LogoutSerializer, responses={204: None})
    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            RefreshToken(serializer.validated_data["refresh"]).blacklist()
        except TokenError:
            # The token has already expired or been revoked, so the user is logged out anyway.
            pass

        return Response(status=status.HTTP_204_NO_CONTENT)


class UserMeAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserDetailSerializer

    @extend_schema(responses={200: UserDetailSerializer})
    def get(self, request):
        serializer = UserDetailSerializer(
            request.user,
            context={"request": request}
        )
        return Response(serializer.data, status=status.HTTP_200_OK)


class UserListAPIView(generics.ListAPIView):
    permission_classes = [CanManageUsers]
    serializer_class = UserDetailSerializer
    queryset = User.objects.all().order_by('-created_at')
    filterset_fields = ['role']
    search_fields = ['email', 'username']


class UserDetailAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserDetailSerializer

    def get_object(self, pk):
        return get_object_or_404(User, pk=pk)

    @extend_schema(responses={200: UserDetailSerializer})
    def get(self, request, pk):
        user = self.get_object(pk)

        if not can_change_account(request.user, user):
            return not_authorized_response()

        serializer = UserDetailSerializer(
            user,
            context={"request": request}
        )
        return Response(serializer.data)

    @extend_schema(request=UserDetailSerializer, responses={200: UserDetailSerializer})
    def patch(self, request, pk):
        user = self.get_object(pk)

        if not can_change_account(request.user, user):
            return not_authorized_response()

        serializer = UserDetailSerializer(
            user,
            data=request.data,
            partial=True,
            context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(responses={204: None})
    def delete(self, request, pk):
        user = self.get_object(pk)

        if not can_change_account(request.user, user):
            return not_authorized_response()

        # Stops the last admin locking everyone out. Clients can still close their own account.
        if user.pk == request.user.pk and user.can_manage_users:
            return Response(
                {"error": "Admins can't delete their own account."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)


class PasswordChangeView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [PasswordChangeRateThrottle]
    serializer_class = PasswordChangeSerializer

    @extend_schema(request=PasswordChangeSerializer)
    def post(self, request):
        serializer = PasswordChangeSerializer(
            data=request.data,
            context={"request": request}
        )
        serializer.is_valid(raise_exception=True)

        user = request.user

        old_password = serializer.validated_data["old_password"]
        new_password = serializer.validated_data["new_password"]

        if not user.check_password(old_password):
            return Response(
                {"error": "wrong old password"},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(new_password)
        user.save()

        # Log out every device, in case someone else was using the old password.
        revoke_all_refresh_tokens(user)

        return Response(
            {"message": "password updated successfully"},
            status=status.HTTP_200_OK
        )
