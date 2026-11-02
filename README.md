# Engineering CMS

A website for an engineering company, with a staff dashboard for editing its content.

- `construction_cms/`: Django REST API
- `frontend/`: React site and dashboard, built with Vite and Tailwind

## Run it locally

Backend (first terminal):

```bash
cd construction_cms
python3 -m venv venv
venv/bin/pip install -r requirements.txt
cp .env.example .env              # then set DJANGO_SECRET_KEY
venv/bin/python manage.py migrate
venv/bin/python manage.py createsuperuser
venv/bin/python manage.py runserver
```

Frontend (second terminal):

```bash
cd frontend
npm install
npm run dev
```

Open http://127.0.0.1:5173 and log in at `/login`. Staff land on `/dashboard`.

### Sample content

`venv/bin/python manage.py seed_demo` fills an empty local database with labelled sample
content and creates manager, engineer and client test accounts. It prints their passwords.
It only runs when `DJANGO_DEBUG=True`.

## Roles

| Role | Can edit |
|---|---|
| Admin (also superusers and `is_staff` accounts) | All content, company profile, users |
| Manager | Projects, blog, services, team, testimonials, inquiries |
| Engineer | Projects, blog |
| Client | Own account only |

New signups are clients. Admins change roles at `/dashboard/users`.

## Checks

```bash
cd construction_cms && venv/bin/python manage.py test
cd frontend && npm run build
```

API docs are at `/api/docs/` while the backend is running.

## Before going live

- Set `DJANGO_DEBUG=False`, a new `DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS`.
- Set `NUM_PROXIES` to the number of proxies in front of Django, or rate limits will count the proxy instead of each visitor.
- Use a production database instead of SQLite.
- Serve static files (Django admin's styles need `collectstatic` and a web server or WhiteNoise).
- Set `USE_CLOUDINARY=True`, or otherwise serve uploads, because Django only serves `/media/` in debug mode.
- Set `NUM_PROXIES` and `CSRF_TRUSTED_ORIGINS` if a proxy handles HTTPS, so Django can tell the request is secure.
- Add a shared cache such as Redis (`CACHES`). Rate-limit counters are kept per server process by default, so with several workers the real limits are higher.
