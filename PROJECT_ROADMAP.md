# Finder — Database Course Project Roadmap

**Project:** Custom web dating application (Tinder-like, desktop/browser only — no native mobile app).  
**Goal:** Satisfy **all** course requirements: the full **Minimum** set **and** the full **Recommended (1.5×)** set.

**Suggested stack (matches course advice, easy to change later):**

| Layer | Choice | Why |
|--------|--------|-----|
| Database | PostgreSQL | Course requirement; works locally with Docker or native install, or hosted on Supabase. |
| Backend | FastAPI + SQLAlchemy (or raw SQL where useful) | Course advice; clear separation from DB; good for demos and deployment. |
| Frontend | React (Vite) | Course advice; swap components later without touching the DB. |
| Cloud hosting (**recommended** marks) | Supabase (Postgres) + Render (FastAPI) + Vercel/Netlify (React) | Course bonus asks for **deployed** DB + backend + frontend; use the same migrations/schema as locally. |

This document is the **roadmap only**. Implementation order is at the end; do not skip the “course alignment” sections when you submit the project.

### Syllabus wording vs “MVP”

The assignment’s **Recommended** section says *“Working MVP (at least locally, recorded demo) …”* — that is **their label** for the **local runnable app + screen recording** requirement. It does **not** mean you stop at a “lite” database-only project. For **full marks including 1.5×**, you still deliver **everything in Minimum** plus **local demo** plus **cloud deployment**.

---

## 0. Master map — each part → requirement → tier

Use this table when writing the report so every artifact is tied to a rubric line.

| # | What you produce (Finder) | Assignment requirement satisfied (paraphrase) | Tier |
|---|---------------------------|-----------------------------------------------|------|
| 0.1 | Written **entity list** + relationships | Entities description | **Minimum** |
| 0.2 | Written **common user paths** (register, profile, swipe, match, chat) | Most critical scenarios / common user paths | **Minimum** |
| 0.3 | **Domain description** prose + explicit answer to *“What should I know to reconstruct your schema from this text alone?”* | Domain description | **Minimum** |
| 0.4 | **`schema.sql`** (or equivalent): `CREATE TABLE`, FKs, checks, enums | Database schema in SQL / DDL | **Minimum** |
| 0.5 | **`schema.dbml`** (same logical model) | Database schema in DBML | **Minimum** |
| 0.6 | Short **DDL commentary** (constraints, uniqueness, why keys) | “Code description” of schema / DDL explanation in write-up | **Minimum** |
| 0.7 | **ERD image** (export from dbdiagram or tool) | Database schema image | **Minimum** |
| 0.8 | **Seed script** + valid rows (e.g. Faker) respecting constraints | Fake but valid data in DB | **Minimum** |
| 0.9 | **Three business questions** + **SQL** + **results** (screenshots or tables) | Three queries to your DB and SQLs to answer them | **Minimum** |
| 0.10 | **`CREATE INDEX` (or equivalent)** + justification (which queries / access paths) | Indexes on columns that need them / other DB performance optimizations | **Minimum** |
| 0.11 | *(No separate artifact — same as 0.1–0.10)* | Everything listed under Minimum | **Minimum** |
| 0.12 | **React + FastAPI + Postgres** running **on your machine**; user actions **persist** (swipes, matches, messages, profile) | Working **MVP** at least locally *(assignment wording)* | **Recommended** |
| 0.13 | **Screen recording** of that app; narration shows **data changing in Postgres** (UI + DB tool or equivalent proof) | Recorded demo showing data in DB updates | **Recommended** |
| 0.14 | **Public URL** frontend (e.g. Vercel) | Fully-functional app hosted in cloud | **Recommended** |
| 0.15 | **Public URL** backend API (e.g. Render) | Fully-functional app hosted in cloud | **Recommended** |
| 0.16 | **Hosted Postgres** (e.g. Supabase) wired to deployed backend; not localhost | Database hosted in cloud as part of deployed stack | **Recommended** |
| 0.17 | *(Implicit)* | “Everything from minimum requirements” inside Recommended bucket | **Recommended** |

**Summary:** Rows **0.1–0.10** = **Minimum (X max)**. Rows **0.11–0.17** = **Recommended (1.5× max)** — note **0.12–0.16** are the concrete build + submit pieces for that tier.

---

## 1. Domain description (for your write-up)

**Field:** Online dating / social matching — a platform where people create profiles, discover others, express interest (e.g. swipe or like), and when interest is mutual a **match** is created; matched users can **message** each other.

**What a reader should know to reconstruct your schema (answer this explicitly in the final report):**

- There are **users** (accounts). Each user has at most one **profile** (bio, age, location, photos metadata, preferences).
- Users perform **swipes** (or likes/passes) toward other users’ profiles; direction and timestamp matter.
- A **match** exists when two users have mutually indicated interest (define the rule precisely in prose, e.g. “both swiped right within the product rules”).
- **Messages** belong to a match (or to a conversation derived from a match) and have sender, body, timestamp.
- Optional but useful: **reports/blocks**, **photo** rows instead of a single URL, **tags/interests** — only add if you want richer demos.

From that description alone, a reader should infer: tables for users, profiles, swipes, matches, messages; foreign keys; uniqueness constraints (e.g. one swipe pair per direction per day, or one row per `(swiper_id, target_id)` — you will lock this in DDL).

---

## 2. Entities and critical scenarios (user paths)

Document these as **common paths** in your submission (bullet flows are enough).

| Entity (conceptual) | Role |
|---------------------|------|
| User | Authentication identity; links to profile. |
| Profile | What others see; discovery filters use age, location, etc. |
| Swipe | Records like/pass (or super-like) from A to B at a time. |
| Match | Created when mutual interest is detected. |
| Message | Chat between two matched users. |

**Critical scenarios (minimum write-up + same flows power the Recommended local demo):**

1. **Register / log in** → create or load user and profile.  
2. **Edit profile** → update DB; later screens read fresh data.  
3. **Discovery / swipe** → insert swipe; if reciprocal swipe exists, insert match (transaction).  
4. **Open matches** → list matches for current user.  
5. **Send message** → insert message linked to match; recipient sees updated thread.

These paths prove the database is not static: **writes** (profile update, swipe, match creation, message) are what you **show in the recorded demo** (**Recommended**, row 0.13).

---

## 3. Proposed relational schema (high level)

Adjust names to taste; keep **normalization** and **clear FKs** for the course.

**Core tables (typical):**

- `users` — `id`, email, password_hash (or auth provider id), `created_at`, …  
- `profiles` — `user_id` (PK/FK), `display_name`, `bio`, `birth_date`, `latitude`, `longitude` or `city`, `gender`, `looking_for`, …  
- `photos` (optional) — `id`, `profile_user_id`, `url`, `sort_order`  
- `swipes` — `id`, `swiper_user_id`, `target_user_id`, `direction` (enum: like / pass), `created_at`; **unique** `(swiper_user_id, target_user_id)` if one decision per pair  
- `matches` — `id`, `user_a_id`, `user_b_id`, `created_at`; **unique** unordered pair (enforce `user_a_id < user_b_id` in app or with a check)  
- `messages` — `id`, `match_id`, `sender_user_id`, `body`, `created_at`

**Optional extensions (only if you need them for queries or UI):**

- `user_interests` / `tags` for discovery  
- `blocks` / `reports` for safety narrative  

**DBML / diagram:** Export from [dbdiagram.io](https://dbdiagram.io) (or maintain `schema.dbml` in repo and paste there for the **schema image**).

**Deliverables for “schema” requirement:**

- **SQL DDL** — `CREATE TABLE`, constraints, enums/types, FKs.  
- **DBML** — same model in DBML syntax.  
- **Image** — export PNG/SVG from dbdiagram (or ERD from your tool).

---

## 4. Custom SQL tasks (replace professor’s numbered list)

Your project is custom; you still need **three meaningful analytical queries** + SQL in the report. Suggested set (tune column names when you implement):

**Q1 — Weekly activity**  
*How many new matches were created last week (calendar week or rolling 7 days — state which)?*

**Q2 — Ranking**  
*Who are the top 5 users by number of “likes” (incoming swipes) received in the last 30 days?*  
(Join `swipes` to profiles/users; filter `direction = like` and time window.)

**Q3 — Average / ratio**  
*What is the average number of messages per match for matches that had activity in the last 30 days?*  
(Define: matches with ≥1 message in window; average message count per such match.)

These mirror the course pattern: **time window**, **aggregate**, **top-N**, **average**.

---

## 5. Indexes and performance (minimum requirement)

Plan indexes **after** you know your query filters and joins. Typical candidates:

- `swipes(created_at)` or `(target_user_id, created_at)` for “likes received in range”  
- `swipes(swiper_user_id, target_user_id)` unique index (also supports lookups)  
- `matches(user_a_id)`, `matches(user_b_id)` or a composite fitting your “list my matches” query  
- `messages(match_id, created_at)` for chat history  

Document in the report: **which query each index supports** and why. Add `EXPLAIN (ANALYZE, BUFFERS)` screenshots optionally for extra clarity.

---

## 6. Fake data (Faker)

- **Script** (e.g. Python with Faker + SQLAlchemy, or a standalone `seed.sql` generator) that inserts valid rows respecting FKs and CHECKs.  
- Volume: enough to make charts/queries interesting (e.g. tens of users, hundreds of swipes, dozens of matches, many messages).  
- **Reproducibility:** fixed random seed so teammates get the same dataset.

---

## 7. Pipeline — local development (no mobile)

Conceptual flow end-to-end:

```text
[PostgreSQL] <--SQL/migrations-- [SQLAlchemy / Alembic migrations]
       ^
       | connection string (env var: DATABASE_URL)
       |
[FastAPI]  --REST/JSON-->  [React]
   |
   +-- optional: Pydantic schemas mirroring tables for request/response
```

**Practical steps (order matters):**

1. Run Postgres locally (Docker Compose is ideal: one `postgres` service + optional `pgadmin`).  
2. Add **migrations** from the first day (Alembic with SQLAlchemy) so schema changes stay reversible.  
3. Implement **models** matching DDL; keep DDL, DBML, and models in sync.  
4. **Seed** data with Faker.  
5. **FastAPI** routes: e.g. `POST /swipes`, `GET /matches`, `POST /messages`, `PATCH /profiles/me`.  
6. **React** calls API with `fetch` or axios; show minimal UI (lists/forms) — polish later.  
7. Run **three report queries** in `psql`, DBeaver, or a small `/admin/stats` endpoint — include exact SQL in the PDF/report.

**Environment:** `.env` / `.env.local` with `DATABASE_URL`; never commit secrets.

---

## 8. Extensibility (schemas, pipeline, UI)

- **Schema:** Prefer additive migrations (new nullable columns, new tables) over destructive changes during the course.  
- **Pipeline:** Thin API layer — business rules (e.g. “create match on mutual like”) in one service module so SQL and UI do not duplicate logic.  
- **UI:** React components that only know JSON shapes; when columns change, update Pydantic + TypeScript types together.

---

## 9. Course requirements checklist (duplicate of §0 for quick reading)

Section **§0** is the authoritative row-by-row map. Below is the same split in prose form.

### Minimum — rubric label: *X points max*

| Rubric item | Finder artifact(s) | Map |
|-------------|-------------------|-----|
| Entities + scenarios | Report § entities + user paths | §0 rows 0.1, 0.2 |
| Domain description | Report § domain + “reconstruct schema” answer | §0 row 0.3 |
| SQL + DBML + DDL notes | `schema.sql`, `schema.dbml`, report text | §0 rows 0.4–0.6 |
| Schema image | PNG/SVG in `docs/images/` or report | §0 row 0.7 |
| Fake data | `db/seeds/` (Faker) | §0 row 0.8 |
| 3 queries + SQL + answers | Report appendix | §0 row 0.9 |
| Indexes / optimizations | Migrations or `schema.sql` + report | §0 row 0.10 |

### Recommended — rubric label: *1.5× points max*

Includes **all Minimum rows** plus:

| Rubric item | Finder artifact(s) | Map |
|-------------|-------------------|-----|
| Everything from minimum | Same as above | §0 row 0.17 |
| Local runnable app *(syllabus: “Working MVP”)* | Full stack local | §0 row 0.12 |
| Recorded demo, DB updates visible | Video file or link | §0 row 0.13 |
| Deployed frontend + backend + DB | Three cloud pieces + URLs in report | §0 rows 0.14–0.16 |

#### Recommended tier — submission checklist (tick when done)

- [ ] **0.12** Local app: register/login, profile edit, swipe, match, messaging (UI polish optional).
- [ ] **0.13** Recording: short narrated video; **Postgres rows change** because of UI actions (split-screen DB tool optional).
- [ ] **0.14–0.16** Links in report: frontend URL, API base URL, hosted Postgres (e.g. Supabase); secrets only in host env.
- [ ] Smoke-test production: create data via deployed UI, verify in cloud DB.

**Important:** Plans do not earn points — only submitted artifacts do.

---

## 10. Implementation phases (do in order; roadmap only until you start)

**Phase A — Foundation**  
Postgres + migrations + DDL/DBML/image + seed data.

**Phase B — Backend**  
FastAPI + CRUD + match rule + message thread; run Q1–Q3 against real data.

**Phase C — Frontend**  
React flows for profile, swipe, matches, chat (minimal styling OK).

**Phase D — Course packaging**  
Write-up: domain, ERD image, SQL appendix, index rationale, query results.

**Phase E — Recommended tier (1.5×)**  
Deliver **0.12–0.16**: local full stack, **recorded demo** (0.13), then deploy Postgres + FastAPI + React with **public URLs** in the report.

---

## 11. Suggested repo layout (when you implement)

```text
Finder/
  backend/           # FastAPI app, Alembic, tests
  frontend/          # React (Vite)
  db/
    schema.sql       # canonical DDL (or generated from migrations)
    schema.dbml
    seeds/           # Faker scripts
  docs/
    images/          # ERD export
  PROJECT_ROADMAP.md # this file
```

---

## 12. Deadline and teamwork

- **Deadline:** May 30 — reserve time for demo recording and deployment.  
- **Groups:** Max 3 — split Phase A/B/C by person but keep one owner for schema/migrations to avoid drift.

---

*This roadmap is the single source of truth for scope and course alignment until you replace sections with “as implemented” notes in your final report.*
