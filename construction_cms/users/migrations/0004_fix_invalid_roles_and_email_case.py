from django.db import migrations


def fix_invalid_roles_and_email_case(apps, schema_editor):
    User = apps.get_model('users', 'User')
    valid_roles = ['admin', 'engineer', 'manager', 'client']

    for user in User.objects.all():
        # Older accounts can have a role that is no longer a choice, such as "viewer".
        if user.role not in valid_roles:
            if user.is_superuser or user.is_staff:
                user.role = 'admin'
            else:
                user.role = 'client'

        # Two accounts can differ only by case. They can't both be lowercased, so
        # the second is left for an admin to merge by hand.
        clean_email = user.email.strip().lower()
        duplicate = User.objects.filter(email=clean_email).exclude(pk=user.pk).exists()
        if duplicate:
            print(f'Check duplicate account by hand: {user.email}')
        else:
            user.email = clean_email

        user.save(update_fields=['role', 'email'])


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0003_alter_user_profile_image'),
    ]

    operations = [
        migrations.RunPython(fix_invalid_roles_and_email_case, migrations.RunPython.noop),
    ]
