# Training, Attendance & Assessment Service

**SD-Group 6 · Software Development Track 3**

Runs the day-to-day of each workshop: training sessions, daily attendance, assessments and scores, and the
final **PASS / FAIL** result that the Feedback, Certificate & Notification Service consumes.

This is one microservice of a larger system, so it (and its UI) does only what the service brief lists: the
eight endpoints for sessions, attendance, assessments, scores and the final result (plus two read-only lists,
`GET /sessions` and `GET /assessments`, so the UI can show what you created). There is no dashboard,
workshop management or other cross-service view here.

| Part | What | Docs |
| ---- | ---- | ---- |
| [`back-end/`](back-end) | NestJS 12 + Prisma 7 + PostgreSQL 17 REST API, also answering on a RabbitMQ queue | [back-end/README.md](back-end/README.md) |
| [`frontend/`](frontend) | Next.js 16 web UI ("Training Hub") | [frontend/README.md](frontend/README.md) |
| [`docker-compose.yml`](docker-compose.yml) | Database, RabbitMQ, migrations, API and web UI together | below |

## Run everything

```bash
docker compose up -d --build                        # PostgreSQL + RabbitMQ → migrations → API → web UI
docker compose run --rm migrate npx prisma db seed  # optional demo data (workshop WS-2025-001)
```

| | URL |
| - | --- |
| Web UI | <http://localhost:3000> (opens on Sessions) |
| API | <http://localhost:4000> |
| API docs (Swagger) | <http://localhost:4000/docs> |
| RabbitMQ | `localhost:5672` (AMQP) · management UI <http://localhost:15672> (`training` / `training_dev_password`) |
| PostgreSQL | `localhost:5435` |

Stop with `docker compose down` (add `-v` to also delete the database). Ports and the database and RabbitMQ credentials can
be changed in a root `.env` (copy [.env.example](.env.example)); every value has a working default.

## How the parts talk

```
browser ──HTTP──▶ web UI (Next.js server) ──RabbitMQ queue──▶ API (NestJS) ──▶ PostgreSQL
```

The web UI never calls the API over HTTP: its server sends each request to a RabbitMQ queue and the API answers on it
(request/reply), so **RabbitMQ is the gateway**. The HTTP API and Swagger stay for `curl` and for other services, and both
roads run the same code. The message contract is in [back-end/README.md](back-end/README.md#rabbitmq-gateway).

## PASS / FAIL

A participant **passes** if they attended **at least 2 of the 3 days** and scored **at or above the pass mark**
(60 out of 100 by default) on the final assessment. Otherwise they **fail** (including when there is no final
score). A workshop usually runs 3 days, but sessions can be on any day from 1 to 30; the pass rule still asks for
2 attended days, or every day for a workshop that has fewer than 2. Details are in the back-end README.

## Tests

```bash
cd back-end && npm test            # unit tests, no database needed
cd back-end && npm run test:e2e    # end-to-end against PostgreSQL and RabbitMQ (docker compose up -d db rabbitmq first)
cd frontend && npm test            # unit tests (the RabbitMQ transport is also tried against a real broker when one is up)
```
