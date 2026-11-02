from django.core.exceptions import ValidationError

MAX_IMAGE_SIZE_MB = 5


def check_image_size(image):
    # A saved file was checked when it was uploaded. Reading its size again would need
    # the storage service, so an unrelated edit could fail if the file were missing.
    if getattr(image, '_committed', False):
        return

    max_bytes = MAX_IMAGE_SIZE_MB * 1024 * 1024
    if image.size > max_bytes:
        raise ValidationError(f'Image must be {MAX_IMAGE_SIZE_MB} MB or smaller.')
