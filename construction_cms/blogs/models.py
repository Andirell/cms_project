from django.db import models
from django.utils import timezone

from backend.slugs import make_unique_slug
from backend.validators import check_image_size


class Post(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
    ]

    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    excerpt = models.CharField(max_length=300, blank=True)
    content = models.TextField()
    image = models.ImageField(
        upload_to='blogs/',
        blank=True,
        null=True,
        validators=[check_image_size],
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='published')
    published_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    author = models.CharField(max_length=100)

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = make_unique_slug(Post, self.title, self.pk)

        # Keep the first publish date, even if the post is unpublished and published again.
        if self.status == 'published' and self.published_at is None:
            self.published_at = timezone.now()

        super().save(*args, **kwargs)
