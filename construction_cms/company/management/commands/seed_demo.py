import secrets

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

from blogs.models import Post
from company.models import CompanyProfile, Service, TeamMember, Testimonial
from projects.models import Project

User = get_user_model()

SAMPLE_SERVICES = [
    ("Civil Engineering", "Sample service: roads, drainage, earthworks and site infrastructure."),
    ("Structural Engineering", "Sample service: analysis, design and checks for buildings and bridges."),
    ("Mechanical & Electrical", "Sample service: building services design, coordination and commissioning."),
    ("Project Management", "Sample service: planning, cost control, procurement and site supervision."),
]

SAMPLE_PROJECTS = [
    ("Sample Stormwater Channel", "civil", "completed", "2024-03-04", "2024-12-18", True),
    ("Sample Road Rehabilitation", "civil", "ongoing", "2026-01-15", None, True),
    ("Sample Office Tower Frame", "structural", "ongoing", "2026-03-10", None, False),
    ("Sample Bridge Assessment", "structural", "completed", "2025-01-18", "2025-06-04", False),
    ("Sample Hospital Services Upgrade", "mechanical", "planning", "2027-02-01", None, False),
    ("Sample Substation Upgrade", "electrical", "planning", "2027-03-01", None, False),
]

SAMPLE_TEAM = [
    ("Sample Person A", "Principal Engineer"),
    ("Sample Person B", "Structural Lead"),
    ("Sample Person C", "Project Manager"),
]

SAMPLE_ACCOUNTS = ["manager", "engineer", "client"]


class Command(BaseCommand):
    help = "Fill a local database with clearly labelled sample content."

    def handle(self, *args, **options):
        # Sample content and test accounts must never reach a real website.
        if not settings.DEBUG:
            raise CommandError("seed_demo only runs when DJANGO_DEBUG=True.")

        self.create_company_profile()
        self.create_services()
        self.create_projects()
        self.create_team()
        self.create_testimonials()
        self.create_posts()
        self.create_accounts()

        self.stdout.write(self.style.SUCCESS("Sample content is ready."))

    def create_company_profile(self):
        if CompanyProfile.objects.exists():
            return

        CompanyProfile.objects.create(
            name="Sample Engineering Ltd",
            tagline="Placeholder tagline. Replace it in the dashboard.",
            about="This is sample text. Replace it with your company's real story in the dashboard.",
            phone="+000 000 0000",
            email="hello@example.com",
            address="Sample address",
            years_in_operation=10,
            certifications="Sample licence A\nSample certification B",
        )

    def create_services(self):
        for order, (title, description) in enumerate(SAMPLE_SERVICES):
            Service.objects.get_or_create(
                title=title,
                defaults={"description": description, "display_order": order},
            )

    def create_projects(self):
        for title, discipline, status, start_date, end_date, is_featured in SAMPLE_PROJECTS:
            Project.objects.get_or_create(
                title=title,
                defaults={
                    "description": "Sample project description. Replace it with real project details.",
                    "client": "Sample Client",
                    "scope": "Sample scope of work",
                    "location": "Sample City",
                    "discipline": discipline,
                    "status": status,
                    "start_date": start_date,
                    "end_date": end_date,
                    "is_featured": is_featured,
                },
            )

    def create_team(self):
        for order, (name, role) in enumerate(SAMPLE_TEAM):
            TeamMember.objects.get_or_create(
                name=name,
                defaults={"role": role, "bio": "Sample biography.", "display_order": order},
            )

    def create_testimonials(self):
        Testimonial.objects.get_or_create(
            client_name="Sample Client",
            defaults={
                "project_name": "Sample Stormwater Channel",
                "quote": "This is a sample testimonial, not a real client's words.",
                "rating": 5,
            },
        )

    def create_posts(self):
        Post.objects.get_or_create(
            title="Sample Post: How We Review a Site",
            defaults={
                "excerpt": "A placeholder post that shows how the blog looks.",
                "content": "This is sample text.\n\nWrite real articles in the dashboard and delete this one.",
                "author": "Sample Author",
            },
        )

    def create_accounts(self):
        for role in SAMPLE_ACCOUNTS:
            email = f"{role}@example.com"
            if User.objects.filter(email=email).exists():
                continue

            # A fresh random password each time, so no shared test password exists.
            password = secrets.token_urlsafe(12)
            user = User(email=email, username=f"sample_{role}", role=role)
            user.set_password(password)
            user.save()
            self.stdout.write(f"Created {email} with password: {password}")
