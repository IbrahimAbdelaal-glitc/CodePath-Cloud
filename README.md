# CodePath Cloud

A learning platform for programming: **structured learning paths**, **interactive lessons**, **quizzes graded on the server**, and a **progress dashboard** that detects weak topics and recommends what to review.

---

## Contents

1. [Features](#features)
2. [Tech stack and project structure](#tech-stack-and-project-structure)
3. [Local setup](#local-setup)
4. [Demo accounts and the first admin](#demo-accounts-and-the-first-admin)
5. [Commands](#commands)
6. [Cloud deployment, step by step](#cloud-deployment-step-by-step)
7. [Deploying with Docker](#deploying-with-docker)
8. [Key rules](#key-rules)
9. [Troubleshooting](#troubleshooting)

---

## Features

- **Cybersecurity video courses:** four sequential courses from beginner to advanced (below), played in a course player with in-video checkpoint questions, a block quiz after every module, curated research readings and a certificate at the end.
- **Instructor video uploads:** admins and assigned instructors can upload a lesson video straight to object storage from the course player, the lesson editor or the course manager.
- **Matrix design:** a black-and-green theme with animated digital rain (canvas, respects reduced motion, can be paused).
- **Learning paths:** four ready-made paths (Frontend, Backend with .NET, Backend with Python, Full-Stack AI). Each has a description, ordered modules and lessons, prerequisites, an estimated duration and a difficulty level.
- **Lessons:** safe Markdown content (raw HTML is never rendered), syntax-highlighted code examples with a copy button, key takeaways, resources (articles, videos, documentation), bookmarks and completion tracking.
- **Interactive quizzes:** multiple choice, predict the output, and complete the code. **The correct answer is never sent to the browser before an attempt**; grading happens on the server, then the explanation is shown immediately and the attempt history and score are updated.
- **Student dashboard:** overall and per-path progress, completed and recommended lessons, recent attempts, learning streak, 14-day activity, topic mastery and topics that need review. All of it comes from the database.
- **Weakness detection and module locking:** the 70% rule (below), with an explanation of why a module is locked and how to unlock it, enforced on the server.
- **Roles:** student; instructor (manages only the paths assigned to them); admin (manages users, roles and all content). Every permission is enforced on the server.
- **Accessibility:** full keyboard navigation, a skip link, ARIA labels, loading/error/empty/success states, dark mode, and respect for reduced-motion preferences.

## Tech stack and project structure

| Part | Technology |
| --- | --- |
| Web app | React 19 + Vite + React Router + CSS + Lucide React (JavaScript only) |
| API | Node.js + Express 5 (JavaScript) |
| Database | PostgreSQL + Prisma ORM 6 |
| Validation | Zod on the server |
| Security | bcrypt password hashing, JWT, Helmet, rate-limited auth endpoints, CORS allow-list |

```
.
├── client/                    # React app (Vite)
│   ├── src/
│   │   ├── api/client.js      # HTTP client (sends the auth token)
│   │   ├── i18n/              # Interface text (en.js) and formatting helpers
│   │   ├── components/        # Shared components (QuizCard, CodeBlock, LockNotice...)
│   │   ├── pages/             # Pages, plus manage/ and admin/
│   │   └── styles/            # Design system
│   ├── vercel.json, netlify.toml, Dockerfile, nginx.conf
│   └── .env.example
├── server/                    # Express API
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/        # Database migrations
│   │   ├── seed.js            # Seed script
│   │   └── seed-data/         # Sample path content (JS + Markdown)
│   ├── src/
│   │   ├── routes/            # auth, roadmaps, lessons, quizzes, me, manage, admin
│   │   ├── services/learning.js  # Grading, weakness detection, module locking
│   │   ├── middleware/auth.js
│   │   └── lib/               # Errors, validation, env loading, Prisma
│   ├── scripts/create-admin.js
│   ├── Dockerfile
│   └── .env.example
├── docker-compose.yml
├── render.yaml
└── package.json               # Shortcut scripts for both parts
```

## Local setup

### Requirements

- Node.js **20.19 or later** (22 recommended).
- A PostgreSQL database with **UTF8** encoding. Pick one:
  - **Neon or Supabase**, free tier (easiest; UTF8 by default).
  - A local PostgreSQL install: `CREATE DATABASE codepath ENCODING 'UTF8' TEMPLATE template0;`
  - Docker: `docker run -d --name codepath-db -e POSTGRES_PASSWORD=<password> -e POSTGRES_DB=codepath -p 5432:5432 postgres:16-alpine`

### Steps

1. **Install dependencies:**

   ```bash
   npm run install:all
   ```

2. **Configure the server environment:** copy `server/.env.example` to `server/.env` and edit the values:

   ```bash
   cp server/.env.example server/.env
   ```

   - `DATABASE_URL` and `DIRECT_URL`: your database URL (the same value for both locally).
   - `JWT_SECRET`: a long random string. Generate one with:

     ```bash
     node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
     ```

   - `DEMO_PASSWORD` (optional): a password for local demo accounts.

3. **Apply migrations and add the sample data:**

   ```bash
   npm run db:deploy
   ```

   ```bash
   npm run db:seed
   ```

4. **Run the API and the web app** (in two terminals):

   ```bash
   npm run dev:server
   ```

   ```bash
   npm run dev:client
   ```

5. Open `http://localhost:5173`. Vite proxies `/api` to the API on port 4000, so you don't need `VITE_API_URL` locally.

## Demo accounts and the first admin

**No passwords are hard-coded anywhere.**

- **Local demo accounts:** if you set `DEMO_PASSWORD` in `server/.env` and run `npm run db:seed`, three accounts are created with your chosen password:
  `student@demo.local` (student), `instructor@demo.local` (instructor assigned to the Frontend path) and `admin@demo.local` (admin).
  These accounts are never created when `NODE_ENV=production`.
- **The first admin (locally or in production):**

  ```bash
  npm run create-admin -- --email you@example.com --name "Your Name" --password "<strong-password-123>"
  ```

  Or set `ADMIN_EMAIL`, `ADMIN_NAME` and `ADMIN_PASSWORD` and run `npm run create-admin`. The password needs at least 10 characters with letters and numbers. If the email already exists, that account is promoted to admin.
- Every account created from the sign-up page is a **student**. Roles can only be changed on the **Users** page by an admin, and admins cannot change their own role or remove the last admin.

## Commands

| Command (from the project root) | What it does |
| --- | --- |
| `npm run install:all` | Install API and web app dependencies |
| `npm run dev:server` | Run the API with auto-restart (port 4000) |
| `npm run dev:client` | Run the web app in development (port 5173) |
| `npm run build` | Generate the Prisma client and build the web app into `client/dist` |
| `npm start` | Run the API in production |
| `npm run db:migrate` | Create a new migration after editing `schema.prisma` (development) |
| `npm run db:deploy` | Apply existing migrations (locally and in production) |
| `npm run db:seed` | Add the sample paths, lessons and questions |
| `npm run create-admin -- --email ... --password ...` | Create an admin account |

To recreate the sample content: `SEED_RESET=true npm run db:seed` (deletes the sample paths, including student progress in them, then recreates them).

## Cloud deployment, step by step

Recommended order: **database → API → web app → update CORS**.

### 1) Database (Neon or Supabase)

**Neon:**
1. Create a project at [neon.tech](https://neon.tech).
2. Under "Connection Details", copy:
   - the **Pooled connection** URL → `DATABASE_URL`;
   - the **Direct connection** URL (without `-pooler`) → `DIRECT_URL`.
3. Make sure both URLs include `?sslmode=require`.

**Supabase:**
1. Create a project at [supabase.com](https://supabase.com).
2. Under Project Settings → Database → Connection string:
   - **Transaction pooler** (port 6543) with `?pgbouncer=true` appended → `DATABASE_URL`;
   - **Direct connection** or Session pooler (port 5432) → `DIRECT_URL`.

### 2) API (Render or Railway)

**Render (using `render.yaml`):**
1. Push the project to a GitHub repository.
2. In Render choose **New → Blueprint** and select the repository; it reads `render.yaml` automatically.
3. Fill in `DATABASE_URL`, `DIRECT_URL` and `CORS_ORIGIN` (use `http://localhost:5173` for now and update it after deploying the web app). `JWT_SECRET` is generated for you.
4. The build command applies migrations automatically: `npm ci && npx prisma generate && npx prisma migrate deploy`.
5. After deploying, open `https://<service-name>.onrender.com/health` and check for `{"status":"ok","database":"ok"}`.
6. Seed the data and create the admin from Render's **Shell**:

   ```bash
   npm run db:seed
   ```

   ```bash
   npm run create-admin -- --email you@example.com --name "Admin" --password "<strong-password>"
   ```

**Without the Blueprint (manual Render setup, or Railway):**
- Root directory: `server`
- Build command: `npm ci && npx prisma generate && npx prisma migrate deploy`
- Start command: `node src/index.js`
- Health check path: `/health`
- Variables: `NODE_ENV=production`, `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `CORS_ORIGIN`.
- The port is read automatically from the `PORT` variable the platform provides.

### 3) Web app (Vercel or Netlify)

**Vercel:**
1. **Add New → Project** and select the repository.
2. **Root Directory:** `client` (Vite is detected automatically, and `vercel.json` handles client-side routing).
3. Add the environment variable `VITE_API_URL` = your API URL, e.g. `https://codepath-api.onrender.com` (no trailing `/`).
4. Deploy.

**Netlify:**
1. **Add new site → Import from Git**.
2. **Base directory:** `client`. The build command, publish directory and redirects are set in `netlify.toml`.
3. Add `VITE_API_URL` under Site settings → Environment variables, then redeploy.

> `VITE_*` variables are baked in at build time; after changing `VITE_API_URL`, rebuild the web app.

### 4) Connect the web app to the API (CORS)

On the API, set `CORS_ORIGIN` to the exact web app origin. You can list several origins, comma-separated:

```
CORS_ORIGIN=https://codepath.vercel.app,https://www.codepath.example
```

## Deploying with Docker

```bash
cp .env.docker.example .env
```

Edit `POSTGRES_PASSWORD` and `JWT_SECRET` in `.env`, then:

```bash
docker compose up --build -d
```

```bash
docker compose exec server npm run db:seed
```

Open `http://localhost:8080`. nginx serves the web app and proxies `/api` to the API, which applies migrations automatically on start-up.

## Key rules

### Weakness detection (70%)

- For each **topic** (e.g. "Closures"), take the student's **latest answer** to each question, across the **10 most recently answered** questions in that topic.
- If accuracy is **below 70%**, the topic is flagged "needs review", and the lessons containing that topic's questions are recommended.
- The flag clears only when the student **confirms the review** on the lesson page **and** accuracy is back to 70% or more. Status is re-evaluated after every attempt and every review confirmation.
- The logic lives in `server/src/services/learning.js`.

### Module locking

A module is locked for a student if:
1. any lesson in its prerequisite modules is incomplete, **or**
2. the student has a "needs review" topic from those modules' questions.

The server refuses to open lessons in a locked module, mark them complete or accept quiz answers for them (`403 MODULE_LOCKED`, with details of what to do). The web app explains the reason and links to the suggested lessons. Instructors and admins see locked modules in preview mode.

### Permissions

| Action | Student | Instructor | Admin |
| --- | :-: | :-: | :-: |
| Browse paths and lessons, take quizzes | ✓ | ✓ | ✓ |
| Create a new path (assigned automatically) | | ✓ | ✓ |
| Edit a path's modules, lessons and questions | | Assigned paths only | All |
| Delete or feature a path | | | ✓ |
| Manage users, roles and instructor assignments | | | ✓ |

### Password reset

1. **Forgot password?** on the sign-in page leads to `/forgot-password`, where the user enters their email.
2. The API always answers with the same message, whether or not the email has an account, so it can't be used to find registered users.
3. If the account exists, the API creates a random 256-bit token, stores only its **SHA-256 hash** in `PasswordResetToken`, and emails a link to `APP_URL/reset-password#token=...`. The token is in the URL fragment, which browsers never send to servers or in `Referer` headers, and the page removes it from the address bar.
4. Links expire after `RESET_TOKEN_MINUTES` (default 30), work **once**, and requesting a new link cancels older ones.
5. After a successful reset, the token is marked used, the password is re-hashed, and the user's `tokenVersion` is incremented, which **signs the user out on every device**. Changing the password from the profile page does the same, but keeps the current session.
6. **Rate limits:** 5 reset requests per IP per 15 minutes, at most 3 emails per account per hour, and 20 verify/reset attempts per IP per 15 minutes.

**Email setup:** Render's free web services block outbound SMTP ports, so email goes over HTTPS. The free option that needs no domain is the Google Apps Script relay in [`server/apps-script/`](server/apps-script/README.md): deploy it from a Gmail account, then set `MAIL_APPS_SCRIPT_URL` and `MAIL_APPS_SCRIPT_SECRET`. It sends from that Gmail address, up to 100 recipients a day, and only ever sends the password-reset and test emails from its own template. Alternatively set `RESEND_API_KEY` (or `BREVO_API_KEY`) and `MAIL_FROM` with a verified domain; `SMTP_*` settings still work on hosts that allow SMTP. Always set `APP_URL` to your deployed web app URL. The API logs its email mode and any configuration problems at start-up, and admins can send a test email from the **System** page.

**Testing locally without email:** leave `SMTP_HOST` empty. Reset emails are then saved as HTML files in `server/.dev-mail/` (ignored by Git) instead of being sent; open the newest file and click the link. The API never returns the token, and only the file name is logged. In production (`NODE_ENV=production`) SMTP is required; without it, no email is sent and the failure is logged.

### Cybersecurity courses

The courses live in `server/src/catalog/`. The API does not create or update them on start-up or deploy. After a catalog change, an admin opens **Admin > System > Course catalog**, checks the preview (planned changes, learner data counts and the retired paths) and applies it once; this runs on the API server, so it also works on hosts without a shell such as Render Free. From a machine with database access you can instead run `npm --prefix server run catalog:sync` (a dry run that prints learner data counts and the planned changes), then `npm --prefix server run catalog:sync -- --apply`, which syncs under the catalog lock and fails loudly if any learner data count went down. Bump a course's `version` to update its content in place: items are matched by key, so student progress on unchanged lessons is kept, and uploaded videos and instructor review decisions are preserved. Run `npm --prefix server run check:catalog` to validate the content.

| # | Course | Level | Videos | Questions grounded in |
| --- | --- | --- | --- | --- |
| 1 | Cybersecurity Foundations | Beginner | Harvard CS50's Introduction to Cybersecurity (CC BY-NC-SA 4.0), cut at the lectures' chapter markers | CS50's published lecture notes |
| 2 | Networking & Linux Foundations | Beginner | Professor Messer N10-009 Network+; TCM Security "Beginner Linux for Ethical Hackers" | Messer's published transcripts; Linux questions are flagged for instructor review |
| 3 | Defensive Security Operations | Intermediate | Professor Messer SY0-701 Security+; TCM Security "SOC 101" (chapter clips) | Messer's transcripts; SOC 101 questions flagged for review |
| 4 | Security Architecture, Governance & Risk | Advanced | Professor Messer SY0-701 Security+ (domains 3–5) | Messer's transcripts |

Every module lists verified readings (NIST publications, RFCs, peer-reviewed papers, and Harvard sources such as the Harvard Law Review and the Belfer Center). Questions that could not be checked against the video text are flagged "Needs instructor review"; instructors can confirm them in the lesson editor and in the module's question bank.

### Roadmap: Cybersecurity: Foundations to Specialization

`server/src/catalog/cyber-roadmap.js` (slug `cybersecurity-foundations-to-specialization`). Four stages, each with outcomes, prerequisites, estimated time, lessons, practical exercises, a stage exam (10+ questions, 80%) and labeled readings (Free, Free account or Paid):

1. **Getting started:** CS50 Understanding Technology clips (hardware, internet) and Professor Messer on the CIA triad and security controls. Skip test available.
2. **Core skills:** links the existing courses Cybersecurity Foundations and Networking & Linux Foundations instead of repeating them; the stage exam opens once both are complete. Skip test available.
3. **Practice:** rules of engagement, a VirtualBox and Ubuntu lab (TCM SOC 101 clips, flagged for review) and guided exercises on the student's own machines and on OverTheWire Bandit.
4. **Choose a specialty:** SOC and incident response, network and cloud security, application security, and authorized penetration testing, each with a course on this site and labeled external resources.

**Skip tests** (`BlockQuizAttempt.mode = 'TEST_OUT'`): the stage exam taken before the lessons, 2 tries per stage; leaving one unfinished uses a try. Passing counts the stage as done, waives its lessons for unlocking and certificates, and keeps them open for review.

The four programming paths (`frontend`, `dotnet-backend`, `python-backend`, `ai-fullstack`) are archived: the migration `20261028000000_cyber_roadmap` sets `isPublished = false`, keeping their content, progress and certificates. An admin can republish them.

### Course player rules

- Lessons unlock one at a time. A lesson completes when the student has watched at least 90% of the video and scored at least the course's pass mark (`Roadmap.checkpointPassPercent`, 80% for every catalog course) on its in-video questions, counting the latest answer to each. A wrong answer reveals neither the answer nor the explanation; the student rewatches and tries again.
- Watching is verified on the server: the player reports the intervals it actually played, credit is limited by elapsed wall-clock time (up to 2× speed), so skipping ahead earns nothing.
- In-video questions do not affect the 70% weak-topic rule.
- Each module ends with a block quiz drawn at random from the module's bank (10 or more questions, pass mark 80%). Passing it unlocks the next module; every attempt is saved and can be reviewed. Completions and passes recorded under the earlier rules are kept.
- The catalog is synced only on purpose (System page or `npm run catalog:sync -- --apply`), never on start-up or deploy. The sync takes a lease row (`CatalogLock`) first, so two runs cannot sync at the same time.

### Video uploads

Browsers upload directly to an S3-compatible bucket with a short-lived signed URL (the signature fixes the file type and size), then the API checks the stored object and attaches it to the lesson. Playback uses signed URLs and the bucket stays private. Only admins and instructors assigned to the course can upload (checked on the server). Configure `STORAGE_ENDPOINT`, `STORAGE_ACCESS_KEY_ID`, `STORAGE_SECRET_ACCESS_KEY` (see `server/.env.example`); with Neon Object Storage, create a credential with `storage:read` and `storage:write` scopes for the branch. The admin **System** page shows whether storage and email are configured.

### Interface text

All interface text lives in `client/src/i18n/en.js` and is looked up with `t('section.key')`, so wording can be changed in one place.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `character ... has no equivalent in encoding` while seeding | The database isn't UTF8; recreate it with UTF8 encoding. |
| The deployed web app can't reach the API | Check `VITE_API_URL` on the web app (then rebuild) and that `CORS_ORIGIN` on the API matches. |
| `/health` returns `database: unreachable` | Check `DATABASE_URL`, and `sslmode=require` for hosted databases. |
| Migrations fail on Supabase/Neon | Use a direct (non-pooled) URL in `DIRECT_URL`. |
| The API stops at start-up with a `JWT_SECRET` message | It must be at least 32 characters in production. |
