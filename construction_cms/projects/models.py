from django.db import models

from backend.slugs import make_unique_slug
from backend.validators import check_image_size


class Project(models.Model):
    STATUS_CHOICES = [
        ('planning', 'Planning'),
        ('ongoing', 'Ongoing'),
        ('completed', 'Completed'),
    ]

    DISCIPLINE_CHOICES = [
        ('civil', 'Civil'),
        ('structural', 'Structural'),
        ('mechanical', 'Mechanical'),
        ('electrical', 'Electrical'),
        ('other', 'Other'),
    ]

    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    description = models.TextField()
    client = models.CharField(max_length=150, blank=True)
    scope = models.CharField(max_length=255, blank=True)
    discipline = models.CharField(max_length=20, choices=DISCIPLINE_CHOICES, default='other')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='planning')
    location = models.CharField(max_length=100, blank=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    image = models.ImageField(
        upload_to='projects/',
        blank=True,
        null=True,
        validators=[check_image_size],
    )
    is_published = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = make_unique_slug(Project, self.title, self.pk)
        super().save(*args, **kwargs)
