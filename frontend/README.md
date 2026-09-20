# Training Hub — web UI

The Next.js frontend of the **Training, Attendance & Assessment Service** (SD-Group 6). It does exactly
what that service does — nothing else — and each page maps to the endpoints of the service brief. There is no
dashboard or overview: this is one microservice, not the whole system. The API it talks to lives in
[`../back-end`](../back-end).

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Vitest

## Pages

| Route | What it does | Endpoint of the brief |
| ----- | ------------ | --------------------- |
| `/training/sessions` | Create a session and assign its facilitator and topic; find a session by its ID | `POST /sessions`, `GET /sessions/:id` |
| `/training/attendance` | Open a session by ID; mark each participant present / absent / excused; save | `GET /sessions/:id`, `GET` and `POST /sessions/:id/attendance` |
| `/training/assessments` | Create the final assessment or a quiz; open an assessment by ID, see its scores, submit a score | `POST /assessments`, `GET` and `POST /assessments/:id/scores` |
| `/training/results` | Enter a participant and a workshop to get the final PASS / FAIL | `GET /participants/:id/results/:workshop_id` |

The service has no "list all" endpoints, so a session or assessment is opened by its ID (after creating one, the
confirmation links straight to it). Participants, workshops, facilitators and topics belong to other services, so
they appear as IDs (`P-001`, `WS-2025-001`, `FAC-001`, `TOP-001`) that you type in. On the attendance sheet you can
add one participant or paste several IDs at once.

## How it talks to the API

Pages are Server Components that read from the API on the server (`lib/api/*`), and forms are Server
Actions (`app/training/*/actions.ts`) that write to it. The browser never calls the API directly, so no CORS
setup is needed and the API address stays private.

The API address is `BACKEND_URL` (default `http://localhost:4000`).

## Run it

Easiest is the whole stack from the repository root (database, migrations, API and this UI):

```bash
docker compose up -d --build   # UI on http://localhost:3000, API on http://localhost:4000
docker compose run --rm migrate npx prisma db seed   # optional demo data
```

To work on the UI with hot reload, start the API (see `../back-end/README.md`), then:

```bash
npm install
npm run dev     # http://localhost:3000
```

Set `BACKEND_URL` in `.env.local` (see `.env.example`) if the API is not on `http://localhost:4000`.

## Scripts

| Script | What it does |
| ------ | ------------ |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / server |
| `npm test` | Unit tests (roster and form parsing, API client, Server Actions) |
| `npm run lint` | ESLint |

## Layout

```
app/training/          the four pages and their Server Actions
components/training/   AppShell, forms, attendance sheet, lookup form, status badges
lib/api/               typed client for the service (client.ts + one file per resource)
lib/                   pure helpers: formatting, roster and form parsing
types/training.ts      response and request shapes of the API
```
