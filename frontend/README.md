# Training Hub — web UI

The Next.js frontend of the **Training, Attendance & Assessment Service** (SD-Group 6). It does exactly
what that service does — nothing else — and each page maps to the endpoints of the service brief. There is no
dashboard or overview: this is one microservice, not the whole system. The service it talks to lives in
[`../back-end`](../back-end), and the two talk **through RabbitMQ**.

**Stack:** Next.js 16 (App Router, Cache Components) · React 19 · Redux Toolkit · RabbitMQ (amqplib) · TypeScript · Tailwind CSS 4 · Vitest

## Pages

| Route | What it does | Endpoint of the brief |
| ----- | ------------ | --------------------- |
| `/training/sessions` | Every session in one table; **New session** opens a drawer to create one and assign its facilitator and topic | `POST /sessions`, `GET /sessions` |
| `/training/attendance` | Pick a session from a dropdown (grouped by workshop); the roll call starts with everyone the workshop has seen on its other days; mark present / absent / excused; save | `GET /sessions`, `GET /sessions/:id`, `GET` and `POST /sessions/:id/attendance` |
| `/training/assessments` | Every assessment in one table; **New assessment** opens a drawer; open one to see its scores and save a score | `POST /assessments`, `GET /assessments`, `GET` and `POST /assessments/:id/scores` |
| `/training/results` | Pick a workshop, then a participant of that workshop, to see the final PASS or FAIL | `GET /participants/:id/results/:workshop_id` |

## No ids to remember

Workshops, participants, facilitators and topics belong to other services, so this service only ever holds their **ids**, never their names. Nobody has to memorise those ids:

- **Workshop, facilitator, topic, participant** fields are dropdowns filled from what this service has already recorded, each option with a short description from its own data (for a workshop: *"3 sessions, 1 Sep 2025 to 3 Sep 2025, 1 assessment"*). They are never a closed list: type a new value and the list offers **Create “…”** (a name with spaces is tidied into a valid id, *Fire Safety* → *Fire-Safety*). A new workshop, facilitator or topic exists here as soon as a session using it is saved; that is also why a workshop shows up in the lists only once it has a session or an assessment.
- **Day** works the same way: 1, 2 and 3 are listed, and any number up to 30 can be typed (*day 5* is read as 5) when a workshop runs longer; days already in use join the list. The pass rule still asks for 2 attended days, and the results page counts a workshop's days from its sessions: "2 of 5" for a five-day workshop, "1 of 1" for a one-day workshop (which needs that one day).
- The **score form** offers only the participants of that workshop who do not have a score yet.
- The **results** page picks a workshop first, then lists that workshop's participants.
- A day-2 attendance sheet opens with the people already seen on day 1.

Showing real names would need the other services' APIs (Workshop, Participant, Facilitator, Topic); the lists come from `lib/catalog.ts` and `lib/directory.ts`, which is where such names would be looked up.

What you create shows up where you created it: after saving, the table under the button already contains the new record (newest first). The lists use two read-only endpoints the brief does not list, `GET /sessions` and `GET /assessments`.

## Design

Quiet paper-and-ink surfaces in the **SOMNOG palette** (the logo's sky blue `#29A7DF`, and its black, or white on dark): the data is the hero, and the one loud element is the PASS / FAIL stamp. Fonts (Figtree, Bricolage Grotesque) are self-hosted from npm, so nothing loads from the internet.

- **Light and dark themes.** Every colour is a token written `light-dark(light, dark)` in `app/globals.css`, so one set of rules serves both, and native controls (dates, scrollbars) follow. The theme is managed with **Redux** (`lib/store`): a small tab on the edge of the sidebar shows the current theme and opens to **Dark / Light / System**; the choice is remembered in a cookie. The **logo follows the theme**: `public/images/somnog.png` on light pages and `somnogDark.png` on dark ones (`somnog-640.png` / `somnogDark-640.png` are light-weight copies of them for the interface). The favicon is `somnogFivIcon.png` (`somnogFivIconDark.png` is its white-lettered copy for dark browser tab strips).
- **Filters on every list**, in plain words: search plus the common choices in view, the rest under **More filters** (dates, facilitator, topic, score range…), "Showing 3 of 8 sessions", and **Clear filters**. Filters change instantly and are kept in the address bar, so a link to the page carries them. Logic lives in `lib/filters.ts`.
- **Download as Excel or PDF** beside every table (sessions, attendance, assessments, scores) and on the final result. A file holds what is on screen after the filters, with the SOMNOG header, the date, and the filters that were on. The Excel and PDF libraries (`exceljs`, `jspdf`) load only when a button is pressed. Logic lives in `lib/export`.

- The page title bar **stays put** while the content scrolls, so the main action is always in reach; in-page jumps land below it.
- Forms open in a **drawer** beside the list instead of pushing it down the page; its Create button never scrolls out of reach, and Escape closes it.
- On the attendance sheet the **Save** bar sticks to the bottom however long the class list is.
- Feedback (saved, errors) scrolls itself into view. After saving a score the cursor returns to the participant field.
- On phones the sidebar becomes a bottom tab bar and tables become one card per record.
- Keyboard focus is always visible, and reduced-motion is respected.

## How it talks to the API

Pages are Server Components that ask the service on the server (`lib/api/*`), and forms are Server Actions
(`app/training/*/actions.ts`) that write to it. **Every request goes through RabbitMQ, not HTTP**: the server publishes
`{ pattern, data, id }` to the service's queue (`training_attendance_assessment`) and waits for the reply that comes back on
RabbitMQ's direct reply-to queue. `lib/api/rabbitmq.ts` is that transport (one shared connection, each request matched to its
answer, a timeout, reconnecting after a lost connection), `lib/api/patterns.ts` lists the operations, and `lib/api/client.ts` turns
a failure into an `ApiError` with the same status and messages the HTTP API uses (404 → `null` for a "not found" lookup). The
message contract is in [`../back-end/README.md`](../back-end/README.md#rabbitmq-gateway).

The browser never talks to RabbitMQ or to the service, so no CORS setup is needed and the broker address stays private. If RabbitMQ is
down, or nothing is listening on the queue (the API is not running), a page shows the error straight away instead of hanging.

**Static shell, streamed data** (Next.js Cache Components, `cacheComponents: true`): the frame of every page (sidebar, logo,
title bar, "New …" button) is prerendered once and served as static HTML. Only what comes from the Training service is fetched per
request, inside `<Suspense>` boundaries with a skeleton, and streams in. `npm run build` lists these pages as `◐ Partial
Prerender`. The root layout never reads the theme cookie on the server (that would make everything dynamic): a tiny inline script
in `<head>` puts the saved theme on `<html>` before the first paint. Asking the service is request-time work (`client.ts` calls
`connection()` first), so nothing opens a broker connection while the shell is being prerendered.

The broker is `RABBITMQ_URL` (default `amqp://training:training_dev_password@localhost:5672`); `RABBITMQ_QUEUE` and
`RABBITMQ_TIMEOUT_MS` (default 10000) are optional.

## Run it

Easiest is the whole stack from the repository root (database, RabbitMQ, migrations, API and this UI):

```bash
docker compose up -d --build   # UI on http://localhost:3000, API on http://localhost:4000, RabbitMQ UI on http://localhost:15672
docker compose run --rm migrate npx prisma db seed   # optional demo data
```

To work on the UI with hot reload, start RabbitMQ and the API (`docker compose up -d db rabbitmq` from the repository root, then
the API with `RABBITMQ_URL` set: see `../back-end/README.md`), then:

```bash
npm install
npm run dev     # http://localhost:3000
```

Set `RABBITMQ_URL` in `.env.local` (see `.env.example`) if RabbitMQ is not on `localhost:5672` with the default login.

## Scripts

| Script | What it does |
| ------ | ------------ |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / server |
| `npm test` | Unit tests (roster and form parsing, API client and RabbitMQ transport, Server Actions, filters, exports, theme); the transport is also tried against a real broker when one is up |
| `npm run lint` | ESLint |

## Layout

```
app/training/          the four pages and their Server Actions
components/training/   shell, page bar, drawer, combobox, forms, attendance sheet, tables
components/theme/      Redux provider, theme switch, logo
components/filters/    the filter bar
components/export/     the Excel / PDF buttons
lib/api/               the service client: rabbitmq.ts (transport), patterns.ts, client.ts, one file per resource
lib/store/             the Redux store and the theme slice
lib/export/            what a download holds, and the Excel and PDF builders
lib/                   pure helpers: catalog (pick-lists), filters, roster, results, formatting, form parsing
types/training.ts      response and request shapes of the API
```
