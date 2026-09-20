# Training, Attendance & Assessment Service

**SD-Group 6 · Software Development Track 3**

Runs the day-to-day of each workshop: training sessions, daily attendance, assessments and scores, and the
final **PASS / FAIL** result that the Feedback, Certificate & Notification Service consumes.

This is one microservice of a larger system, so it (and its UI) does only what the service brief lists: the
eight endpoints for sessions, attendance, assessments, scores and the final result. There is no dashboard,
workshop management or other cross-service view here.

| Part | What | Docs |
| ---- | ---- | ---- |
| [`back-end/`](back-end) | NestJS 12 + Prisma 7 + PostgreSQL 17 REST API | [back-end/README.md](back-end/README.md) |
| [`frontend/`](frontend) | Next.js 16 web UI ("Training Hub") | [frontend/README.md](frontend/README.md) |
| [`docker-compose.yml`](docker-compose.yml) | Database, migrations, API and web UI together | below |

## Run everything

```bash
docker compose up -d --build                        # PostgreSQL → migrations → API → web UI
docker compose run --rm migrate npx prisma db seed  # optional demo data (workshop WS-2025-001)
```

| | URL |
| - | --- |
| Web UI | <http://localhost:3000> (opens on Sessions) |
| API | <http://localhost:4000> |
| API docs (Swagger) | <http://localhost:4000/docs> |
| PostgreSQL | `localhost:5435` |

Stop with `docker compose down` (add `-v` to also delete the database). Ports and database credentials can
be changed in a root `.env` (copy [.env.example](.env.example)); every value has a working default.

## PASS / FAIL

A participant **passes** if they attended **at least 2 of the 3 days** and scored **at or above the pass mark**
(60 out of 100 by default) on the final assessment. Otherwise they **fail** (including when there is no final
score). Details are in the back-end README.

## Tests

```bash
cd back-end && npm test            # unit tests, no database needed
cd back-end && npm run test:e2e    # end-to-end against PostgreSQL (docker compose up -d db first)
cd frontend && npm test            # unit tests
```
