from django.utils.text import slugify


def make_unique_slug(model, title, current_id=None):
    """Turn a title into a URL slug that no other row is using."""
    base_slug = slugify(title)[:200] or 'item'
    slug = base_slug
    number = 2

    while True:
        matches = model.objects.filter(slug=slug)
        if current_id:
            matches = matches.exclude(pk=current_id)
        if not matches.exists():
            return slug

        slug = f'{base_slug}-{number}'
        number += 1
