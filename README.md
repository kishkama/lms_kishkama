# LearnFlow — Project README (Plain-English Edition)

This document explains, in everyday language, what this project is, how it
was built with Claude's help, what every tool and technical term means, and
exactly how to run it on your own computer or publish it to the internet.

It assumes you know very little about programming. Every technical word is
explained the first time it shows up, usually with a real-world comparison.

> **Looking for the short, technical version instead?** See
> [`backend/README.md`](backend/README.md) for a quick developer reference,
> or [`docs/deploy.md`](docs/deploy.md) for the exact, command-by-command
> transcript of every deployment (including mistakes and how they were
> fixed).

---

## Table of contents

1. [What is this project?](#1-what-is-this-project)
2. [The story so far — how this app was built, step by step](#2-the-story-so-far--how-this-app-was-built-step-by-step)
3. [Tools and technologies used (plain-English glossary)](#3-tools-and-technologies-used-plain-english-glossary)
4. [How the requirements were written](#4-how-the-requirements-were-written)
5. [How the design was created](#5-how-the-design-was-created)
6. [How the code was written](#6-how-the-code-was-written)
7. [Project structure (directory map)](#7-project-structure-directory-map)
8. [How to run this project on your own computer](#8-how-to-run-this-project-on-your-own-computer)
9. [How to build and deploy this project to Google Cloud](#9-how-to-build-and-deploy-this-project-to-google-cloud)
10. [Known limitations — what isn't finished yet](#10-known-limitations--what-isnt-finished-yet)
11. [Where to find more detail](#11-where-to-find-more-detail)

---

## 1. What is this project?

**LearnFlow** is a small, working example of a **Learning Management System
(LMS)** — the kind of website a school or company uses to host online
courses. Right now it can do two things:

1. **Sign up / log in** — a visitor can create an account and sign in
   securely.
2. **Manage courses** — once logged in, a person lands on a "Manage
   courses" page where they can create a new course, see all courses in a
   table, edit one, and archive (retire) a course they no longer want
   active — without permanently deleting it.

Under the hood, every app like this is really **two separate programs
talking to each other over the internet**:

- The **backend** — the "engine room." It stores data (in a database),
  enforces rules (e.g. "you must be logged in to manage a course"), and
  answers questions the website asks it.
- The **frontend** — the part you actually see and click in your browser.
  It's just a nicely-designed messenger: it asks the backend for
  information and displays it, and sends your clicks/typing back to the
  backend to act on.

Both pieces live in this one repository (project folder), in the
`backend/` and `frontend/` directories.

---

## 2. The story so far — how this app was built, step by step

This project was built together with Claude, in this order:

1. **Wrote the sign-up/login requirements.** Before any code was written,
   a detailed requirements document was written describing exactly what
   "register, log in, and reset your password" should do — see
   [`docs/requirements.md`](docs/requirements.md).
2. **Built the sign-up/login feature** — the backend (Python/FastAPI) and
   frontend (React) code that makes registration, login, and password
   reset actually work.
3. **Wrote a second requirements document** asking to extend the app with
   a course-management screen — see
   [`docs/course-management-ui-prompt.md`](docs/course-management-ui-prompt.md).
   This one was written in a format specifically meant to be handed to a
   design tool or another developer/AI, in addition to a human reviewer.
4. **A visual mockup ("design") of the "Manage Courses" screen was
   generated** from that requirements document, using a separate
   AI-powered design tool (Claude's *Design* product — different from the
   coding assistant, more like a drag-and-drop mockup tool). This produced
   a clickable, good-looking prototype — colors, layout, buttons, pop-up
   windows — but with **fake, pretend data** and no real logic behind it
   (like a movie set: the storefront looks real, but there's nothing
   behind the wall).
5. **The mockup was inspected in detail** — every screen and every state
   (the course list, the "New course" form, the "Edit course" form, the
   warning box for archiving a course, the confirmation pop-up) was opened
   and screenshotted, so the exact wording, colors, spacing, and behavior
   could be copied faithfully.
6. **The real frontend code was written** to match that mockup exactly,
   reusing the app's existing design building-blocks (buttons, text boxes,
   etc.) so the new screen looks consistent with the rest of the app. At
   this stage it still used fake, made-up data stored only in the
   browser's memory (it would vanish on refresh).
7. **The real backend code was written**: a new database table for
   courses, and a set of web addresses (an "API," explained below) the
   frontend can call to create, list, edit, archive, and un-archive
   courses for real.
8. **The frontend was reconnected** to talk to this real backend instead
   of the pretend data, so courses you create now actually get saved.
9. **The whole app was published to the internet** using Google Cloud, so
   it has a real web address anyone can visit — see
   [`docs/deploy.md`](docs/deploy.md) for the full blow-by-blow record.

---

## 3. Tools and technologies used (plain-English glossary)

### 3.1 The backend ("engine room")

| Tool | Plain-English explanation |
|---|---|
| **Python** | The programming language the backend is written in. Think of it as the language the "engine room" instructions are written in. |
| **FastAPI** | A ready-made toolkit ("framework") for building web APIs in Python quickly and safely. It's like a pre-built kitchen with all the appliances already wired up, rather than building a kitchen from scratch. |
| **Uvicorn** | The actual program that keeps the backend running and listening for incoming requests, 24/7. FastAPI is the recipe book; Uvicorn is the oven that's actually switched on. |
| **SQLAlchemy** | A translator between Python code and the database. Databases speak their own language (SQL); SQLAlchemy lets the Python code say "give me this user" instead of writing raw database language by hand. |
| **Alembic** | A tool that tracks and applies changes to the database's structure over time — like "track changes" in a Word document, but for the shape of your data tables (e.g. "add a new `courses` table"). Each change is called a **migration**. |
| **Pydantic** | Checks that data coming in or going out has the right shape (e.g. "an email must actually look like an email, a password can't be blank"). Think of it as a bouncer checking IDs at the door. |
| **SQLite** | A tiny, file-based database used only for testing and running the app on your own laptop. It needs no setup — it's just a file on disk. Not used in the real, published version. |
| **PostgreSQL ("Postgres")** | A serious, production-grade database engine, used for the real, published version of the app. |
| **Neon** | A company that runs Postgres databases for you in the cloud, so you don't have to manage your own database server. |
| **bcrypt** | A one-way scrambling function used to store passwords safely. It turns `"mypassword123"` into unreadable gibberish that **cannot be reversed** — not even by the app's own developers. When you log in, the app scrambles what you typed and checks if the gibberish matches, rather than ever storing or comparing your real password. |
| **JWT (JSON Web Token)** | A digital "ID badge" the backend hands you right after you log in. Your browser shows this badge on every later request instead of re-typing your password each time. It's signed with a secret code so the backend can tell if anyone tampered with it, and it automatically "expires" (stops working) after a set time for safety — like a visitor badge that only works for the day. |
| **Rate limiting (via a tool called `slowapi`)** | A bouncer that limits how many times per minute someone can try to log in from the same location, to make it harder for an attacker to guess passwords by brute force. |
| **pytest** | An automated testing tool. Instead of a person manually clicking through the app to check it still works, `pytest` runs dozens of small automatic checks ("tests") in seconds every time the code changes. This project has 27 such tests. |

### 3.2 The frontend (what you see and click)

| Tool | Plain-English explanation |
|---|---|
| **React** | A popular toolkit for building interactive websites out of reusable pieces called "components" (e.g. a Button component, a Course Table component) — like building with LEGO bricks instead of carving one solid block. |
| **TypeScript** | JavaScript (the language web browsers understand) with an added spell-checker for data — it catches many mistakes (like "you forgot this field") while writing the code, before a user ever sees them. |
| **Vite** | A build tool. While developing, it instantly shows your changes in the browser. When you're ready to publish, it "bundles" all the code into small, fast files. Think of it as both the workshop and the packing station. |
| **Node.js / npm** | Node.js is a program that lets JavaScript code run outside a web browser (e.g. to build the site). `npm` is its accompanying tool for downloading and managing all the small helper libraries a project depends on — similar to an app store for code building-blocks. |

### 3.3 Packaging and hosting (getting it onto the internet)

| Tool | Plain-English explanation |
|---|---|
| **Docker** | A way to package an application **and everything it needs to run** (the exact right version of Python, all its libraries, etc.) into one single, self-contained box called a **container** or **image**. That box runs identically on any computer — your laptop, a colleague's laptop, or Google's servers — because it carries its own environment with it, instead of hoping the target computer already has the right things installed. A `Dockerfile` is the recipe/instructions for building that box. |
| **Google Cloud Run** | A Google service that takes a Docker container and runs it on the internet for you, automatically, without you needing to manage a physical server. It also automatically scales up if traffic increases and scales down (to save cost) if there's no traffic. |
| **Google Artifact Registry** | A private online warehouse where the built Docker "boxes" (images) are stored, ready for Cloud Run to pick up and run. |
| **Google Cloud Build** | A robot that follows a Dockerfile's instructions in the cloud to actually build the Docker image, so you don't need Docker installed on your own laptop to publish this app. |
| **Google Secret Manager** | A locked vault for sensitive values — like the database password or the secret key used to sign JWT badges — so they never appear in the code itself or in this repository. The running app is simply told "go fetch the value named `jwt-secret` from the vault" at startup. |
| **Nginx** | A lightweight, battle-tested web server used to actually serve the finished frontend files (HTML/CSS/JavaScript) to visitors' browsers once they're built. |

### 3.4 Design and project-management tools

| Tool | Plain-English explanation |
|---|---|
| **Claude Code** | The AI coding assistant used throughout this project to write requirements, code, tests, and documentation, and to run commands on your behalf. |
| **Claude Design** | A separate AI-powered tool (not the coding assistant) for quickly creating clickable visual mockups/prototypes from a written description — used here to design the "Manage Courses" screen before any real code was written for it. |
| **Git / GitHub** | Git keeps a complete, permanent history of every change ever made to the code, so nothing is ever truly lost and changes can always be reviewed or undone. GitHub is a website that hosts that history online and enables collaboration. |

### 3.5 A quick note on "API" and "REST"

You'll see the word **API** a lot. An API (Application Programming
Interface) is just the specific, agreed-upon set of web addresses
("endpoints") the frontend is allowed to call to ask the backend to do
something — for example:

- `POST /auth/login` → "please log this person in"
- `GET /courses` → "please give me the list of courses"
- `PATCH /courses/{id}/archive` → "please archive this specific course"

This particular style of API (predictable web addresses, plus standard web
verbs like `GET`/`POST`/`PUT`/`PATCH`) is called a **REST API**, and it's
the most common style used on the web today.

---

## 4. How the requirements were written

Before any code was written, requirements were captured in a very
structured, unambiguous way — the same style a professional Business
Analyst (BA) would use — so there was never any doubt about exactly what
"done" should look like. Two documents were produced this way:

- [`docs/requirements.md`](docs/requirements.md) — for sign-up, login,
  secure sessions, and password reset.
- [`docs/course-management-ui-prompt.md`](docs/course-management-ui-prompt.md)
  — for the course-management screen (this one doubles as a "prompt": a
  self-contained brief detailed enough to be handed directly to a
  designer, a developer, or an AI tool and get a correct result).

Both documents follow the same three-part structure:

1. **User Stories**, written as:
   > **As a** [type of person], **I want** [a goal], **so that** [the
   > reason/benefit].

   For example: *"As a registered user, I want to log in with my email
   and password, so that I can securely access my account."* This format
   forces every requirement to answer "who wants this, and why" — not
   just "what."

2. **Acceptance Criteria**, written as:
   > **Given** [a starting situation], **when** [an action happens],
   > **then** [the expected result].

   For example: *"Given a user enters an incorrect password, when they
   submit the login form, then the system returns a generic 'invalid
   credentials' error."* This format turns a vague idea ("show an error")
   into something specific and testable — exactly what someone (or an
   automated test) can check to prove the feature works correctly,
   including how it should behave when things go wrong.

3. **A BRD Summary** (Business Requirements Document summary) — a short
   recap of the objective, what's explicitly *in* scope, what's
   deliberately left *out* of scope for now, important non-functional
   requirements (security, performance), technical dependencies, and any
   **open questions** flagged for a real stakeholder to decide (e.g. "who
   is allowed to archive a course — any staff member, or only admins?").
   Writing these questions down explicitly — rather than silently
   guessing — is what keeps requirements honest about what's still
   undecided.

---

## 5. How the design was created

Once the course-management requirements document existed, it was used as
the brief for **Claude Design** — a separate, AI-driven visual prototyping
tool. Design tools like this let you describe what you want in plain
language and get back a working, clickable visual mockup very quickly,
without writing real application code.

That produced a mockup screen called "Manage Courses," built on top of a
shared "LearnFlow Design System" — a predefined set of colors, fonts,
spacing rules, and reusable pieces (buttons, form fields, etc.) meant to
keep every screen in the app looking consistent.

Before writing a single line of real code for this screen, the mockup was
**inspected thoroughly** using a browser: every visible screen and state
was opened, screenshotted, and clicked through, including:

- The main course table with its "Active" and "Archived" tabs.
- The "New course" and "Edit course" pop-up forms and every field in them.
- The "Danger zone" warning box and its "Archive course" button.
- The confirmation pop-up that appears before a course is actually
  archived (to prevent accidental clicks).
- The banner shown for a course that's already archived, with its
  "Unarchive" button.

This inspection produced an exact, faithful specification — colors,
spacing, exact wording, icons, and interaction flow — which was then used
to write the real, working frontend code (Section 6) so the finished
feature matches the approved design almost exactly, rather than being a
rough approximation of it.

---

## 6. How the code was written

### 6.1 Backend: a layered structure

The backend code (in `backend/app/`) is organized in layers, each with one
clear job — a common, easy-to-maintain pattern for this kind of
application:

```
Web request  →  Routes  →  Services  →  Database Models
                  ↑            ↑              ↑
              "front desk"  "rulebook"   "filing cabinet"
                            + Schemas ("the paperwork's shape")
```

- **`app/api/routes/`** — the "front desk." Defines the actual web
  addresses (`/auth/login`, `/courses`, etc.), receives incoming
  requests, and returns responses. It doesn't contain business logic
  itself — it hands off to the layer below.
- **`app/services/`** — the "rulebook." Contains the actual business
  logic and rules (e.g. "a course can only be un-archived if it's
  currently archived," "you can't register with an email that's already
  taken"). This is where decisions get made.
- **`app/db/models.py`** — defines the exact shape of the data as it's
  stored in the database (e.g. a `Course` has a title, a category, a
  status, and so on) — like the labeled columns on a filing cabinet
  drawer.
- **`app/schemas/`** — defines the shape of data as it travels *over the
  web* to and from the frontend (which can be slightly different from how
  it's stored internally, and adds validation rules like "title can't be
  blank").
- **`app/core/`** — shared low-level building blocks used everywhere:
  password hashing and JWT creation/checking (`security.py`), app
  settings (`config.py`), and rate limiting.
- **`app/api/deps.py`** — a small helper that checks "is this person
  actually logged in?" before letting a request reach a protected route
  like managing courses.

Every important behavior has an automated test in `backend/tests/`, which
`pytest` runs to make sure nothing breaks as the code evolves. As of this
writing there are **27 passing tests** covering registration, login,
token refresh, password reset, and the full course-management feature
(create, list, edit, archive, un-archive, and the rule that a course can't
accidentally lose its "archived" status through a plain edit).

### 6.2 Frontend: pages built from a shared design system

The frontend code (in `frontend/src/`) is organized as:

- **`src/pages/`** — full screens a user actually navigates to:
  `AuthPage.tsx` (sign-up/login/reset), `ManageCoursesPage.tsx` (the
  course table and tabs), and `CourseFormModal.tsx` (the create/edit
  pop-up with its Danger Zone).
- **`src/design-system/`** — small, reusable, consistently-styled
  building blocks used across every page: `Button`, `Input`, `Select`,
  `Checkbox`, `Modal`, `Badge`, and `Icon`. Building every screen out of
  the same small set of pieces is what keeps the whole app looking and
  behaving consistently, and means a visual tweak only needs to happen in
  one place.
- **`src/lib/`** — shared logic that isn't visual: `api.ts` and
  `coursesApi.ts` (talking to the backend over the network), `session.ts`
  (remembering that you're logged in), `theme.ts` (light/dark mode), and
  `courses.ts` (shared course-related types and constants).

### 6.3 Security practices used

- Passwords are never stored in readable form — only their `bcrypt` hash
  (see the glossary above).
- Logging in issues a short-lived JWT **access token** (15 minutes) plus
  a longer-lived **refresh token** (7 days), so a stolen access token
  becomes useless quickly, while you don't have to re-enter your password
  constantly.
- Every course-management web address requires a valid, logged-in JWT —
  attempting to call them without one is rejected immediately.
- Resetting a password invalidates all previously issued tokens for that
  account, so a compromised session can't linger after a password change.
- Login and password-reset-request endpoints are rate-limited to slow
  down automated password-guessing attempts.

---

## 7. Project structure (directory map)

```
lms_kishkama/
├── README.md                    ← this file
├── docs/
│   ├── requirements.md          ← sign-up/login requirements (BA-style)
│   ├── course-management-ui-prompt.md   ← course UI requirements/prompt
│   └── deploy.md                ← exact, command-by-command deployment log
│
├── backend/                     ← the "engine room" (Python / FastAPI)
│   ├── app/
│   │   ├── main.py              ← starts the web server, wires up routes
│   │   ├── api/
│   │   │   ├── routes/          ← auth.py, courses.py — the web addresses
│   │   │   └── deps.py          ← "is this person logged in?" check
│   │   ├── services/            ← business rules (auth_service, course_service)
│   │   ├── schemas/              ← shape of data sent/received over the web
│   │   ├── db/                  ← database models + connection setup
│   │   └── core/                ← passwords, JWT, settings, rate limiting
│   ├── alembic/versions/        ← one file per database change, in order
│   ├── tests/                   ← 27 automated checks
│   ├── requirements.txt         ← list of Python libraries this needs
│   ├── Dockerfile               ← recipe for packaging the backend
│   └── .env.example             ← template for local settings/secrets
│
└── frontend/                    ← what you see in the browser (React)
    ├── src/
    │   ├── pages/                ← AuthPage, ManageCoursesPage, CourseFormModal
    │   ├── design-system/       ← Button, Input, Select, Modal, Badge, Icon...
    │   └── lib/                 ← api.ts, coursesApi.ts, session.ts, theme.ts
    ├── package.json              ← list of JavaScript libraries this needs
    ├── Dockerfile                ← recipe for packaging the frontend
    ├── nginx.conf                ← config for serving the built site
    └── .env.example               ← template for local settings
```

---

## 8. How to run this project on your own computer

Running it locally means two separate programs run at the same time on
your laptop, each in its own terminal window, talking to each other over
`localhost` (a special address meaning "this same computer").

### 8.1 One-time setup: things you need installed first

- **Python 3.13** (the backend's language). On Windows, the launcher
  command is usually `py` rather than `python`.
- **Node.js** (needed to build/run the frontend). Installing Node.js also
  installs `npm` automatically.
- **Git** (to have downloaded/cloned this repository in the first place).

### 8.2 Start the backend

Open a terminal in the `backend/` folder and run:

```powershell
py -m venv .venv
```
This creates a private, isolated "toolbox" (called a **virtual
environment**) just for this project, so the specific library versions it
needs don't clash with anything else on your computer.

```powershell
.venv\Scripts\pip install -r requirements.txt
```
This reads `requirements.txt` (the shopping list of Python libraries) and
installs every one of them into that private toolbox.

```powershell
copy .env.example .env
```
This creates your own personal settings file (`.env`) from the provided
template. It's kept out of the shared codebase deliberately, since it can
contain machine-specific or secret values. The default settings already
point at a simple local file-based database (SQLite), so no extra database
setup is needed for local development.

```powershell
.venv\Scripts\alembic upgrade head
```
This builds the actual (currently empty) database tables, by replaying
every migration file in `alembic/versions/` in order, ending at the
latest version ("head").

```powershell
.venv\Scripts\uvicorn app.main:app --reload
```
This starts the backend server. Leave this terminal window open — closing
it stops the backend. The `--reload` flag means it automatically restarts
itself whenever you change the code, which is convenient during
development.

You can now visit **http://127.0.0.1:8000/docs** in a browser to see
**Swagger UI** — an automatically-generated, interactive page listing
every web address the backend offers, letting you try them out directly
without needing the frontend at all.

### 8.3 Start the frontend

Open a **second, separate** terminal window in the `frontend/` folder and
run:

```powershell
npm install
```
This reads `package.json` (the frontend's shopping list) and downloads
every JavaScript library it depends on.

Check that `frontend/.env.local` contains:
```
VITE_API_BASE_URL=http://localhost:8000
```
This tells the frontend where to find the backend you just started.

```powershell
npm run dev
```
This starts the frontend's own local server. Leave this terminal open too
— you now have **two** programs running side by side.

Open **http://localhost:5173** in your browser. You should see the
LearnFlow sign-in page. Click "Create an account," register, sign in, and
you'll land on the Manage Courses page — fully working against your own
local database.

### 8.4 Run the automated tests (optional, but reassuring)

From the `backend/` folder:

```powershell
.venv\Scripts\python -m pytest
```

This runs all 27 automated checks in a few seconds and reports whether
everything still behaves as expected.

---

## 9. How to build and deploy this project to Google Cloud

### 9.1 The big picture, in plain language

Publishing this app to the real internet involves four moving pieces:

1. The **backend** code is packaged into a Docker container (a
   self-contained "box" — see the glossary) and uploaded to **Google
   Artifact Registry** (the warehouse for these boxes).
2. **Google Cloud Run** picks up that box and runs it continuously,
   giving it a public web address like
   `<YOUR_BACKEND_SERVICE_URL>`.
3. The **frontend** goes through the same box-and-run process, ending up
   at its own public address, e.g.
   `<YOUR_FRONTEND_SERVICE_URL>`. When it's
   built, the frontend is told the backend's address so it knows where to
   send its requests.
4. The **database** lives separately, hosted by **Neon** (a company that
   runs Postgres databases in the cloud), and isn't packaged into either
   box — both the local and the deployed backend just connect to
   whichever database its settings point at.

Sensitive values (the database connection details, the secret key used to
sign JWT badges) are never written into the code or the Docker boxes
directly. Instead they're stored in **Google Secret Manager**, and the
running container is simply configured to fetch them by name at startup.

This project's actual Google Cloud project is called `lms-demo-503720`,
in the `us-central1` region. All the one-time setup (enabling Google
Cloud features, creating the warehouses, creating the secret vault
entries, and granting the right permissions) has already been done once —
see [`docs/deploy.md`](docs/deploy.md) for that full, exact record,
including a few mistakes made along the way and how they were diagnosed
and fixed (genuinely useful reading if you hit a similar error yourself).

**This section focuses on the commands you'd run for a routine update** —
i.e. "I've changed the code, now publish the new version" — assuming the
one-time setup already exists, which it does for this project.

### 9.2 Prerequisites for deploying

- The `gcloud` command-line tool installed and logged in
  (`gcloud auth login`) to the Google account that owns the project.
- The project already selected: `gcloud config set project lms-demo-503720`.
- You do **not** need Docker installed locally — the build happens in the
  cloud, via Google Cloud Build.

### 9.3 Deploy the backend

Run these three commands, one at a time, from the repository's root
folder:

```powershell
gcloud builds submit backend `
  --tag=us-central1-docker.pkg.dev/lms-demo-503720/lms-backend/backend:latest `
  --project=lms-demo-503720
```
**What this does:** uploads the `backend/` folder to Google, where Cloud
Build follows the instructions in `backend/Dockerfile` to build a fresh
Docker image, then stores that image in Artifact Registry under the name
`lms-backend/backend:latest`.

```powershell
gcloud run deploy lms-backend `
  --image=us-central1-docker.pkg.dev/lms-demo-503720/lms-backend/backend:latest `
  --region=us-central1 --project=lms-demo-503720
```
**What this does:** tells the already-existing `lms-backend` Cloud Run
service to start running that freshly built image instead of the old one,
and to send 100% of live traffic to it. It automatically keeps all
previously configured settings and secrets unless you explicitly change
them.

```powershell
gcloud run jobs execute lms-backend-migrate --region=us-central1 --project=lms-demo-503720 --wait
```
**What this does:** runs the `alembic upgrade head` migration (see
Section 8.2) against the real, live Neon database, so any new database
tables or columns the updated code needs actually get created — using a
pre-configured, reusable Cloud Run Job rather than needing a database
connection from your own laptop. `--wait` makes the command pause until
the migration has actually finished, so you know right away whether it
succeeded.

### 9.4 Deploy the frontend

The frontend needs one extra step, because Vite "bakes in" the backend's
web address at build time (rather than reading it while running), so it
has to be supplied as a **build argument**. `gcloud builds submit --tag`
doesn't support build arguments directly, so a small build-configuration
file is used instead:

Create a file (anywhere convenient — it isn't part of the repository)
called `cloudbuild-frontend.yaml`:

```yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - build
      - --build-arg
      - VITE_API_BASE_URL=<YOUR_BACKEND_SERVICE_URL>
      - -t
      - us-central1-docker.pkg.dev/lms-demo-503720/lms-frontend/frontend:latest
      - .
images:
  - us-central1-docker.pkg.dev/lms-demo-503720/lms-frontend/frontend:latest
```

Then run:

```powershell
gcloud builds submit frontend --config=cloudbuild-frontend.yaml --project=lms-demo-503720
```
**What this does:** builds the frontend's Docker image, telling it — at
build time — the exact web address of the live backend to talk to, then
uploads the finished image to Artifact Registry.

```powershell
gcloud run deploy lms-frontend `
  --image=us-central1-docker.pkg.dev/lms-demo-503720/lms-frontend/frontend:latest `
  --region=us-central1 --project=lms-demo-503720
```
**What this does:** same idea as the backend — tells the existing
`lms-frontend` Cloud Run service to switch over to the newly built image.

*(If the backend's or frontend's web address ever changes, the backend's
`CORS_ORIGINS` setting also needs updating to allow the new frontend
address to talk to it — a browser security feature. See
`docs/deploy.md` for exactly how that was done previously. It wasn't
needed for this redeploy since neither address changed.)*

### 9.5 Verify it worked

```powershell
Invoke-WebRequest -Uri "<YOUR_FRONTEND_SERVICE_URL>/" -UseBasicParsing
Invoke-WebRequest -Uri "<YOUR_BACKEND_SERVICE_URL>/health" -UseBasicParsing
```
Both should return a successful response (status code `200`). You can
then open the frontend's address in a real browser and use the app exactly
as you would locally — except now it's live on the real internet, backed
by the real Neon database.

---

## 10. Known limitations — what isn't finished yet

Being upfront about what's *not* done is as important as documenting what
is:

- **Sessions expire after 15 minutes with no automatic renewal yet.** The
  backend already supports refreshing a session using the longer-lived
  refresh token (`POST /auth/refresh`), but the frontend doesn't call it
  automatically yet — so after 15 minutes of being logged in, you'll need
  to log in again.
- **"Forgot password" doesn't actually send an email yet**, and the reset
  link it generates points to a placeholder address rather than the real,
  deployed frontend. There's also no page yet in the frontend that
  actually completes a password reset using that link. The backend logic
  itself (generating a secure, single-use, time-limited reset token) is
  fully built and tested — it just isn't wired up to a real mailbox or a
  finished on-screen flow yet.
- **No user roles yet.** Any logged-in user can currently create, edit,
  or archive any course — there's no concept yet of "admin" vs. "regular
  learner." This was intentionally left as an open question in the
  original requirements document for a real stakeholder to decide.
- **Courses can only be archived, not permanently deleted** — this is a
  deliberate design decision to prevent accidental, irreversible data
  loss, matching how similar tools (e.g. GitHub's "archive repository"
  feature) handle it.

---

## 11. Where to find more detail

- [`docs/requirements.md`](docs/requirements.md) — full requirements for
  sign-up, login, and password reset.
- [`docs/course-management-ui-prompt.md`](docs/course-management-ui-prompt.md)
  — full requirements for the course-management screen.
- [`docs/deploy.md`](docs/deploy.md) — the complete, unedited transcript
  of every deployment made so far, including every command run, every
  error hit, and how each one was diagnosed and fixed. Read this if
  you're troubleshooting a deployment issue yourself.
- [`backend/README.md`](backend/README.md) — a short, developer-focused
  quick-reference for running and testing the backend.
