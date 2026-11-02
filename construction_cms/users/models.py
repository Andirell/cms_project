from django.contrib.auth.models import AbstractUser
from django.db import models

from backend.validators import check_image_size


class User(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('engineer', 'Engineer'),
        ('manager', 'Manager'),
        ('client', 'Client'),
    ]

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='client')
    profile_image = models.ImageField(
        upload_to='profiles/',
        blank=True,
        null=True,
        validators=[check_image_size],
    )
    created_at = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email

    def clean(self):
        super().clean()
        # Lowercase before Django checks for duplicates, so the admin form shows a
        # normal error instead of crashing on the database's unique rule.
        self.email = self.email.strip().lower()

    def save(self, *args, **kwargs):
        # Every email is stored in lowercase so Case@x.co and case@x.co are one account.
        self.email = self.email.strip().lower()
        super().save(*args, **kwargs)

    @property
    def has_full_access(self):
        return self.is_superuser or self.is_staff or self.role == 'admin'

    @property
    def can_manage_users(self):
        return self.has_full_access

    @property
    def can_edit_company_content(self):
        return self.has_full_access or self.role == 'manager'

    @property
    def can_edit_projects_and_blog(self):
        return self.can_edit_company_content or self.role == 'engineer'
