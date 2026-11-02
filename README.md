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
