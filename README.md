# Finder

Custom Tinder-like dating app (course project). See [`docs/PHASES.md`](docs/PHASES.md) for the phase breakdown.

**Course-oriented database write-up:** [`docs/DATABASE_COURSE_DESCRIPTION.md`](docs/DATABASE_COURSE_DESCRIPTION.md).

## Quick start

**Prerequisites:** Docker Desktop, Python 3.11+.

### 1. Environment

Copy `.env.example` to `.env` at the **repo root** (same folder as `docker-compose.yml`):

```bash
cp .env.example .env   # Mac/Linux
copy .env.example .env # Windows
```

Both **`DATABASE_URL`** and **`SECRET_KEY`** are required — auth returns 500 without `SECRET_KEY`.

### 2. Start PostgreSQL

```bash
docker compose up -d
```

### 3. Install backend dependencies

```bash
cd backend
python -m venv .venv

# Mac/Linux
source .venv/bin/activate
# Windows
.venv\Scripts\activate

pip install -r requirements.txt
```

### 4. Apply migrations

```bash
# from backend/ with venv active
alembic upgrade head
```

### 5. Seed fake data

```bash
# Mac/Linux
python ../db/seeds/seed.py
# Windows
python ..\db\seeds\seed.py
```

### 6. Start the backend server

```bash
# from backend/ with venv active
uvicorn app.main:app --reload
```

API is now running at **http://localhost:8000**.  
Interactive docs (Swagger UI): **http://localhost:8000/docs**

### 7. Install frontend dependencies

```bash
cd frontend
npm install
```

### 8. Start the frontend dev server

```bash
# from frontend/
npm run dev
```

App is now running at **http://localhost:5173**.

---

## Viewing the database

Use **TablePlus** (recommended, free tier sufficient) or DBeaver:

| Field    | Value       |
|----------|-------------|
| Host     | `localhost` |
| Port     | `5432`      |
| User     | `finder`    |
| Password | `finder`    |
| Database | `finder`    |

---

## Smoke check (Phase A)

```bash
# from backend/ with venv active
python scripts/verify_phase_a.py
```

---

## Layout

| Path | Purpose |
|------|---------|
| `docker-compose.yml` | Local Postgres 16 |
| `backend/app/main.py` | FastAPI entry point |
| `backend/app/models.py` | SQLAlchemy models |
| `backend/app/routers/` | Route handlers (auth, profiles, photos, discovery, swipes, matches, messages, stats) |
| `backend/static/photos/` | Uploaded profile photos served at `/static/photos/` |
| `frontend/` | React + Vite + TypeScript + Tailwind CSS SPA |
| `backend/alembic/` | Schema migrations |
| `db/schema.dbml` | DBML for [dbdiagram.io](https://dbdiagram.io) |
| `db/seeds/seed.py` | Faker seed script |

---

## Reset database

Use after pulling schema changes or to start fresh:

```bash
docker compose down -v
docker compose up -d
cd backend
alembic upgrade head
python ../db/seeds/seed.py  # Mac/Linux
```
