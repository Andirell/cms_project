from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.exceptions import InvalidToken
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer

from backend.permissions import can_manage_users

from .models import User


def clean_email(email):
    return email.strip().lower()


def check_email_is_free(email, current_user=None):
    matching_users = User.objects.filter(email__iexact=email)
    if current_user:
        matching_users = matching_users.exclude(pk=current_user.pk)
    if matching_users.exists():
        raise serializers.ValidationError('A user with this email already exists.')


class UserSerializer(serializers.ModelSerializer):
    # Passwords are never trimmed: login keeps spaces, so signup has to match it.
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    confirm_password = serializers.CharField(write_only=True, trim_whitespace=False)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username',
            'profile_image',
            'password', 'confirm_password'
        ]
        read_only_fields = ['id']

    def validate_email(self, value):
        email = clean_email(value)
        check_email_is_free(email)
        return email

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({
                "password": "Passwords do not match"
            })

        # An unsaved user lets the validator reject passwords that match the name or email.
        new_user = User(username=attrs['username'], email=attrs['email'])
        validate_password(attrs['password'], user=new_user)

        return attrs

    def create(self, validated_data):
        validated_data.pop("confirm_password")
        password = validated_data.pop("password")

        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserDetailSerializer(serializers.ModelSerializer):
    """Serializer for reading/updating user without requiring password fields."""

    # The frontend reads these to decide which screens to show. The API still
    # checks permissions on every request.
    can_manage_users = serializers.BooleanField(read_only=True)
    can_edit_company_content = serializers.BooleanField(read_only=True)
    can_edit_projects_and_blog = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'role', 'profile_image', 'created_at',
            'is_staff', 'is_superuser',
            'can_manage_users', 'can_edit_company_content', 'can_edit_projects_and_blog',
        ]
        read_only_fields = ['id', 'created_at', 'is_staff', 'is_superuser']

    def get_fields(self):
        fields = super().get_fields()
        request = self.context.get('request')

        if not request or not can_manage_users(request.user):
            fields['role'].read_only = True
        # Admins can't change their own role, so they can't remove their own access by accident.
        elif isinstance(self.instance, User) and self.instance.pk == request.user.pk:
            fields['role'].read_only = True

        return fields

    def validate_email(self, value):
        email = clean_email(value)
        current_user = None
        if isinstance(self.instance, User):
            current_user = self.instance
        check_email_is_free(email, current_user)
        return email


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_email(self, value):
        return clean_email(value)


class LoginResponseSerializer(serializers.Serializer):
    access = serializers.CharField()
    refresh = serializers.CharField()
    user = UserDetailSerializer()


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        attrs[self.username_field] = clean_email(attrs[self.username_field])
        return super().validate(attrs)


class SafeTokenRefreshSerializer(TokenRefreshSerializer):
    def validate(self, attrs):
        # A deleted user's token can still be unexpired. It should be refused, not crash.
        try:
            return super().validate(attrs)
        except User.DoesNotExist:
            raise InvalidToken('This account no longer exists.')


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()


class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(trim_whitespace=False)
    new_password = serializers.CharField(trim_whitespace=False)
    confirm_new_password = serializers.CharField(trim_whitespace=False)

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_new_password"]:
            raise serializers.ValidationError({
                "password": "New passwords do not match"
            })

        validate_password(attrs["new_password"], user=self.context["request"].user)
        return attrs
