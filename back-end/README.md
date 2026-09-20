# Training, Attendance & Assessment Service

**SD-Group 6 · Software Development Track 3**

Runs the day-to-day of each workshop: training sessions, daily attendance, assessments and
scores, and the final **PASS / FAIL** result that the Feedback, Certificate & Notification
Service consumes.

**Stack:** NestJS 12 · Prisma 7 · PostgreSQL 17 · Docker Compose · Vitest

## Quick start

Run these from the **repository root** (the compose file starts the database, this API and the web UI):

```bash
docker compose up -d --build                        # PostgreSQL + migrations + API + web UI
docker compose run --rm migrate npx prisma db seed  # optional demo data
```

- API: <http://localhost:4000> · Swagger UI: <http://localhost:4000/docs>
- Web UI: <http://localhost:3000> (see `../frontend`)
- Stop: `docker compose down` (add `-v` to also delete the database volume)

Try it — the seed data contains P-001 … P-006 for workshop `WS-2025-001`:

```bash
curl localhost:4000/participants/P-001/results/WS-2025-001
```

### Developing on your machine (hot reload)

```bash
docker compose up -d db       # from the repository root: just PostgreSQL, on localhost:5435
cd back-end && cp .env.example .env
npm install                   # also runs `prisma generate`
npm run db:migrate            # apply migrations (creates new ones when the schema changes)
npm run db:seed               # optional demo data
npm run start:dev             # API with watch mode
```

## API

Exactly the endpoints of the service brief. Field names are `snake_case` like the brief's sample
data; `:id` in a path is the business id (`SES-001`, `ASS-001`, `P-001`), not a database id.

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| POST | `/sessions` | Create a training session (assigns facilitator + topic) |
| GET | `/sessions/:id` | Get session details |
| POST | `/sessions/:id/attendance` | Record attendance for a session |
| GET | `/sessions/:id/attendance` | Get the attendance list for a session |
| POST | `/assessments` | Create an assessment (final or optional daily quiz) |
| POST | `/assessments/:id/scores` | Submit a participant's score |
| GET | `/assessments/:id/scores` | Get all scores for an assessment |
| GET | `/participants/:id/results/:workshop_id` | Final PASS / FAIL result |

Besides these there is only `GET /health` (the Docker healthcheck uses it) and the Swagger docs at `/docs`.

Error shape (NestJS default): `{ "statusCode": 409, "message": "…", "error": "Conflict" }`.
`400` validation · `404` unknown session / assessment / workshop · `409` duplicates.

### Example flow

```bash
# 1. a session (session_id is optional: omitted → SES-001, SES-002, …)
curl -X POST localhost:4000/sessions -H 'content-type: application/json' -d '{
  "workshop_id": "WS-2025-001", "day": 1, "date": "2025-09-01",
  "facilitator_id": "FAC-001", "topic_id": "TOP-001", "time_slot": "08:00–09:30" }'

# 2. attendance (re-sending a participant corrects their status)
curl -X POST localhost:4000/sessions/SES-001/attendance -H 'content-type: application/json' -d '{
  "records": [ {"participant_id":"P-001","status":"present"}, {"participant_id":"P-002","status":"absent"} ] }'

# 3. the final assessment and a score (PASS/FAIL of the score is computed by the service)
curl -X POST localhost:4000/assessments -H 'content-type: application/json' -d '{
  "workshop_id": "WS-2025-001", "title": "Day 3 Final Assessment", "day": 3 }'
curl -X POST localhost:4000/assessments/ASS-001/scores -H 'content-type: application/json' -d '{
  "participant_id": "P-001", "score": 82 }'

# 4. the workshop result
curl localhost:4000/participants/P-001/results/WS-2025-001
```

Responses follow the brief's sample data, e.g. the result:

```json
{ "participant_id": "P-001", "workshop_id": "WS-2025-001", "result": "PASS", "days_attended": 3, "final_score": 82 }
```

### PASS / FAIL logic

A participant **PASSES** the workshop if they attended **at least 2 of the 3 days** AND scored
**at or above the pass mark** (60 out of 100 by default) on the final assessment. **Otherwise FAIL** — including
when there is no final score. The rule is in `src/results/grading.ts`.

Where the brief left room:

- **Only `present` counts as attended.** `excused` is an approved absence, not attendance.
- **A day counts once**, even if the participant was present in several sessions that day.
- The pass mark comes from the assessment (`pass_mark`, configurable), not a hard-coded 60.

### Other rules enforced

- One attendance record per participant per session; one score per participant per assessment.
- A workshop has **exactly one FINAL assessment, on day 3**; it can also have any number of `QUIZ` assessments.
  If `type` is omitted it defaults to `FINAL` on day 3 and `QUIZ` otherwise.
- `0 ≤ score ≤ total_marks` and `pass_mark ≤ total_marks`. Clients cannot set a score's `result`; it is computed.
- A workshop cannot have two sessions in the same day and time slot. `time_slot` is normalised to `08:00–09:30`.
- `workshop_id`, `facilitator_id`, `topic_id`, `participant_id` belong to other services, so they are plain
  strings validated for shape only (no cross-service lookups).

## Database (PostgreSQL + Prisma)

Ported from the MongoDB schema in the brief. Models: `Session`, `AttendanceRecord`, `Assessment`, `Score`
(`prisma/schema.prisma`). Tables are snake_case; foreign keys use the business ids (`session_id`,
`assessment_id`) as in the brief. The init migration also contains hand-written SQL Prisma cannot express:
`CHECK` constraints (day 1–3, sane marks, FINAL on day 3), a partial unique index (one FINAL per workshop),
and the sequences behind generated `SES-nnn` / `ASS-nnn` ids.

| Script | What it does |
| ------ | ------------ |
| `npm run db:migrate` | `prisma migrate dev` — apply/create migrations (development) |
| `npm run db:deploy` | `prisma migrate deploy` — apply migrations (CI / production) |
| `npm run db:seed` | Demo data (idempotent) |
| `npm run db:studio` | Prisma Studio |
| `npm run db:reset` | Drop and recreate the dev database |
| `npm run db:generate` | Regenerate the Prisma client into `src/generated/prisma` (git-ignored) |

**Docker Compose services:** `db` (postgres:17-alpine, healthcheck, named volume) → `migrate` (one-shot
`prisma migrate deploy`) → `api` (waits for migrations, non-root, healthcheck on `/health`).
Host ports come from the root `.env`; the database defaults to **5435** because 5432–5434 are often taken.

## Tests

```bash
npm test          # unit tests, no database needed
(cd .. && docker compose up -d db) && npm run db:deploy
npm run test:e2e  # end-to-end against the real PostgreSQL
npm run lint
```

The e2e suite creates a throw-away workshop and deletes it afterwards, so it is safe to run against your
development database. It also checks that nothing beyond the brief's endpoints is exposed.

## Configuration

| Variable | Default | Notes |
| -------- | ------- | ----- |
| `DATABASE_URL` | — (required) | PostgreSQL connection string (Docker sets its own for the `api` container) |
| `PORT` | `4000` | 3000 is left free for the Next.js frontend |
| `CORS_ORIGIN` | `http://localhost:3000` | Comma-separated list of allowed browser origins. The web UI does not need it (its server calls the API), it is for other clients |

The database container's `POSTGRES_*` settings and the published ports live in the repository-root `.env` (see `../.env.example`).

## Project layout

```
prisma/               schema, migrations, seed
src/
  sessions/           POST /sessions, GET /sessions/:id
  attendance/         /sessions/:id/attendance
  assessments/        POST /assessments, /assessments/:id/scores
  results/            /participants/:id/results/:workshop_id  +  grading.ts (PASS/FAIL rules)
  prisma/             PrismaService, id generator, DB-error → HTTP filter
  common/ config/ health/
test/                 e2e tests
```
