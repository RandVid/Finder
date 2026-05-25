# Finder — database description (course submission)

This document covers **domain**, **entities**, **user paths**, and enough detail that someone could **reconstruct the schema from prose alone**.

---

## 1. Domain

**Finder** is a **web-based dating application**: users register, maintain a **profile**, **swipe** (smash or pass) on other profiles, and when two users **mutually smash** each other the system creates a **match**. Matched users can exchange **messages** (text or photos). Each user can also record **dating preferences** (age range, accepted partner genders, desired partner hobbies, same-city bias) — these are *stated filters*, distinct from *observable traits* on profiles (gender, birth date → age, city, country, height, hobbies).

---

## 2. What you need to know to reconstruct the schema

1. **users** — One row per account (`email` unique). Authentication material is `password_hash` only.

2. **profiles** — At most **one** profile per user (`user_id` primary key → `users`). Stores presentation and measurable traits: display name, bio, birth date, city, country, Postgres **ENUM** `gender` (`woman` / `man` / `nonbinary`, **NOT NULL**), optional height in cm, optional `photo_url`, and `updated_at`.

3. **profile_hobbies** — **1NF child table**: one row per `(user_id, hobby)` the user has. `hobby` is a Postgres ENUM with 14 values (`hiking`, `gaming`, `cooking`, …). Storing hobbies as a `TEXT[]` array would violate 1NF; a separate table allows indexing and joining.

4. **dating_preferences** — At most **one** row per user (`user_id` PK/FK → `users`) for **scalar** filters: `partner_age_min`, `partner_age_max`, `prefer_same_city`. Multi-valued filters are **not** stored as arrays:
   - **dating_preference_genders** — one row per `(user_id, gender)` the user accepts as a partner;
   - **dating_preference_hobbies** — one row per `(user_id, hobby)` the user wants their partner to share.

5. **swipes** — Directed events: who swiped, on whom, `direction` ENUM (`smash` / `pass`), timestamp. A **UNIQUE** constraint on `(swiper_user_id, target_user_id)` prevents duplicate decisions. A user cannot swipe themselves (`CHECK swiper_user_id <> target_user_id`).

6. **matches** — Undirected pair of two users who **mutually smashed**. The pair is stored canonically as **`user_low_id` < `user_high_id`** (enforced by `CHECK` + `UNIQUE`) so the same two people always map to **one** row (see §3).

7. **messages** — Belongs to a **match** via `match_id` (the conversation thread). Each row stores sender, `body` (text), optional `image_url` (photo attachment), and timestamp.

You should also expect **foreign keys with ON DELETE CASCADE**, **indexes** on foreign keys and filter columns, **Postgres ENUM** types for controlled vocabularies, and **CHECK** constraints for ordering (`user_low_id < user_high_id`) and plausible ranges (heights 120–230 cm, ages 18–99).

---

## 3. Why `user_low_id` and `user_high_id`?

A match is a **relationship between two users** with no natural order. If we stored `(user_a_id, user_b_id)` without rules, the same match could appear twice as `(2, 5)` and `(5, 2)`.

**Convention:** always store the smaller `users.id` in `user_low_id` and the larger in `user_high_id`, with a `CHECK user_low_id < user_high_id` and `UNIQUE (user_low_id, user_high_id)`. The application computes `low = min(a, b)`, `high = max(a, b)` before every insert.

To find all matches for user `U`:
```sql
WHERE user_low_id = U OR user_high_id = U
```

---

## 4. Entities (tables)

| Table | Meaning |
|-------|---------|
| `users` | Account — login identity. |
| `profiles` | Public-facing facts and traits (gender, age, city, hobbies, photo). |
| `profile_hobbies` | Hobbies a user has (1NF child of profiles). |
| `dating_preferences` | Scalar partner filters (age range, same-city bias). |
| `dating_preference_genders` | Partner genders the user accepts (1NF child). |
| `dating_preference_hobbies` | Partner hobbies the user desires (1NF child). |
| `swipes` | Smash/pass events (directed, one per ordered pair). |
| `matches` | Mutual-smash pairs (canonical undirected storage). |
| `messages` | Chat messages inside a match (`match_id` = thread). |

---

## 5. Critical user paths (scenarios)

1. **Sign up** → INSERT `users`, then INSERT `profiles` (display name, gender, birth date), then INSERT `dating_preferences` + child rows.
2. **Edit profile** → UPDATE `profiles`; replace rows in `profile_hobbies` (DELETE old + INSERT new).
3. **Set preferences** → UPDATE `dating_preferences`; replace rows in `dating_preference_genders` and `dating_preference_hobbies`.
4. **Discovery** → one batch query: exclude self, exclude already-swiped users, apply preference filters (gender, age, same city+country, partner hobbies); sort by hobby overlap DESC; LIMIT 20. Then INSERT `swipes` per card.
5. **Swipe / match** → after a smash swipe, check if the reverse smash exists; if yes, INSERT `matches` with ordered pair.
6. **Chat** → user selects a match → `SELECT messages WHERE match_id = ? ORDER BY created_at`.

---

## 6. 1NF and multi-valued attributes

Three sets of multi-valued attributes exist in this domain: a user's own hobbies, their accepted partner genders, and their desired partner hobbies. All three are stored as **separate child tables** rather than arrays or comma-separated strings:

| Attribute | Table | Why not an array? |
|-----------|-------|-------------------|
| User hobbies | `profile_hobbies` | Enables `JOIN` for overlap scoring, indexing by hobby |
| Accepted partner genders | `dating_preference_genders` | Consistent filtering with `IN (SELECT …)` |
| Desired partner hobbies | `dating_preference_hobbies` | Same pattern; `EXISTS` join in discovery query |

---

## 7. Discovery SQL (key query)

The discovery batch query combines all hard filters and soft ranking in one statement:

```sql
SELECT p.user_id, p.display_name, p.bio, p.birth_date, p.city, p.country,
       p.gender, p.height_cm, p.photo_url, p.updated_at,
       (
           SELECT COUNT(*)
           FROM profile_hobbies ph_me
           JOIN profile_hobbies ph_them ON ph_them.hobby = ph_me.hobby
           WHERE ph_me.user_id = :me AND ph_them.user_id = p.user_id
       ) AS hobby_overlap
FROM profiles p
LEFT JOIN dating_preferences dp ON dp.user_id = :me
WHERE p.user_id <> :me
  -- exclude already-swiped profiles
  AND NOT EXISTS (
      SELECT 1 FROM swipes s
      WHERE s.swiper_user_id = :me AND s.target_user_id = p.user_id
  )
  -- same city preference: both city AND country must match
  AND (
      dp.user_id IS NULL OR NOT dp.prefer_same_city
      OR (
          p.city    IS NOT DISTINCT FROM (SELECT city    FROM profiles WHERE user_id = :me)
          AND p.country IS NOT DISTINCT FROM (SELECT country FROM profiles WHERE user_id = :me)
      )
  )
  -- age filter
  AND (
      dp.user_id IS NULL OR p.birth_date IS NULL
      OR dp.partner_age_min IS NULL OR dp.partner_age_max IS NULL
      OR EXTRACT(YEAR FROM age(p.birth_date)) BETWEEN dp.partner_age_min AND dp.partner_age_max
  )
  -- gender filter
  AND (
      dp.user_id IS NULL
      OR NOT EXISTS (SELECT 1 FROM dating_preference_genders WHERE user_id = :me)
      OR p.gender IN (SELECT gender FROM dating_preference_genders WHERE user_id = :me)
  )
  -- hobby filter
  AND (
      dp.user_id IS NULL
      OR NOT EXISTS (SELECT 1 FROM dating_preference_hobbies WHERE user_id = :me)
      OR EXISTS (
          SELECT 1 FROM profile_hobbies ph
          JOIN dating_preference_hobbies dph ON dph.hobby = ph.hobby
          WHERE ph.user_id = p.user_id AND dph.user_id = :me
      )
  )
ORDER BY hobby_overlap DESC, p.updated_at DESC NULLS LAST
LIMIT 20;
```

---

## 8. Additional SQL queries

---

## 9. Indexes and performance

| Index | Column(s) | Reason |
|-------|-----------|--------|
| `ix_profiles_updated_at` | `profiles(updated_at)` | Discovery ORDER BY fallback |
| `ix_profiles_city` | `profiles(city)` | `prefer_same_city` filter |
| `ix_profile_hobbies_hobby` | `profile_hobbies(hobby)` | Hobby overlap JOIN |
| `ix_dating_preference_genders_gender` | `dating_preference_genders(gender)` | Gender filter subquery |
| `ix_dating_preference_hobbies_hobby` | `dating_preference_hobbies(hobby)` | Hobby filter subquery |
| `uq_swipe_pair` | `swipes(swiper_user_id, target_user_id)` | Prevent duplicate swipes; covers `NOT EXISTS` lookup |
| `ix_swipes_target_created` | `swipes(target_user_id, created_at)` | Incoming swipe stats |
| `uq_match_pair` | `matches(user_low_id, user_high_id)` | Prevent duplicate matches |
| `ix_messages_match_created` | `messages(match_id, created_at)` | Chat thread load (covering index) |

---

## 10. DDL sources

| Artifact | Role |
|----------|------|
| `db/schema.sql` | Single-file canonical DDL for the report. |
| `db/schema.dbml` | DBML for [dbdiagram.io](https://dbdiagram.io) — import to export ERD image. |
| `backend/alembic/versions/` | Versioned migrations (001–009) applied with Alembic. |

---

## 11. Controlled vocabularies (Postgres ENUM)

| ENUM | Values |
|------|--------|
| `profile_gender` | `woman`, `man`, `nonbinary` |
| `hobby` | `hiking`, `gaming`, `cooking`, `reading`, `travel`, `music`, `sports`, `art`, `fitness`, `photography`, `yoga`, `dancing`, `movies`, `pets` |
| `swipe_direction` | `smash`, `pass` |
