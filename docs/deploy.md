# Backend Deployment to Cloud Run + Neon Postgres

Record of the first-time deployment of `backend/` to Google Cloud Run (project
`lms-demo-503720`, region `us-central1`), backed by Neon Postgres. Includes every
`gcloud` command run, the output received, and the issues hit along the way.

Date: 2026-07-28
Operator account: `giri.kamal@gmail.com`

## Pre-flight: files read to confirm config shape

- `backend/.env.example` — documents `DATABASE_URL` format for Neon:
  `postgresql+asyncpg://<user>:<password>@<endpoint>.neon.tech/<dbname>?sslmode=require`,
  plus `JWT_SECRET`, `JWT_ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`,
  `REFRESH_TOKEN_EXPIRE_MINUTES`, `PASSWORD_RESET_TOKEN_EXPIRE_MINUTES`,
  `MIN_PASSWORD_LENGTH`, `CORS_ORIGINS` (JSON array string).
- `backend/app/core/config.py` — pydantic-settings `Settings` class, confirms the
  env var names above map 1:1 (lowercased) to settings fields.
- `backend/app/db/engine.py` — `build_engine_kwargs()` strips `sslmode` off the
  URL and translates it into asyncpg's `ssl` connect arg, since asyncpg doesn't
  understand the libpq-style `sslmode` query param directly.
- `backend/Dockerfile` — `python:3.13-slim`, installs `requirements.txt`, runs
  `uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}` (shell form so
  Cloud Run's `$PORT` expands at container start).
- `backend/alembic/env.py` — reads `DATABASE_URL` via `get_settings()`, i.e. from
  the environment — no separate `alembic.ini` URL to maintain.

## Pre-flight: GCP state check (read-only)

```
gcloud --version
gcloud config list
gcloud projects describe lms-demo-503720 --format="value(projectId,name,projectNumber)"
```
Output confirmed: authenticated as `giri.kamal@gmail.com`, active project
`lms-demo-503720` (project number `270670804695`).

```
gcloud services list --enabled --filter="name:run.googleapis.com OR name:artifactregistry.googleapis.com OR name:secretmanager.googleapis.com OR name:cloudbuild.googleapis.com OR name:sqladmin.googleapis.com"
gcloud artifacts repositories list --project=lms-demo-503720
gcloud secrets list --project=lms-demo-503720
gcloud run services list --project=lms-demo-503720
```
All four returned `SERVICE_DISABLED` errors — none of the required APIs were
enabled yet, and consequently no Artifact Registry repos, Secret Manager
secrets, or Cloud Run services existed. Confirmed this was a clean first-time
setup with no risk of overwriting existing resources.

```
python --version   # failed: Windows Store alias stub, not a real interpreter
py --version        # Python 3.13.7 — usable via the `py` launcher
```

## Decisions confirmed with user before any billable action

- Region: `us-central1` (over `us-east4`, which would have been closer to
  Neon's AWS `us-east-2` endpoint — accepted the latency tradeoff for the
  cheaper/more standard region).
- Cloud Run service: `--allow-unauthenticated` (public), since the app has its
  own JWT auth layer and needs to be reachable by a frontend directly.
- Secret names `database-url` / `jwt-secret`, Artifact Registry repo
  `lms-backend`, Cloud Run service `lms-backend` — none pre-existed.

## Step 1 — Enable required APIs

```
gcloud services enable run.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com cloudbuild.googleapis.com --project=lms-demo-503720
```
Output:
```
Operation "operations/acf.p2-270670804695-2006f1ae-b7e7-49c4-ad08-7251796d9331" finished successfully.
```

## Step 2 — Create Secret Manager secrets

The Neon connection string (pasted by the user in chat) and a freshly generated
JWT secret were each written to a temp file in the session scratchpad — never
as a CLI argument, never logged — then loaded via `--data-file` and deleted
immediately after.

Neon URL was converted from the raw Neon dashboard format to the driver format
the app expects:
```
postgresql://...       ->  postgresql+asyncpg://...    (scheme change only; sslmode=require kept as-is, translated at runtime by build_engine_kwargs)
```

JWT secret generated directly to disk without ever being printed:
```powershell
py -c "import secrets; open(r'<scratchpad>\jwt_secret.txt','w').write(secrets.token_urlsafe(64))"
```

```
gcloud secrets create database-url --project=lms-demo-503720 --replication-policy=automatic --data-file="<scratchpad>\db_url.txt"
gcloud secrets create jwt-secret --project=lms-demo-503720 --replication-policy=automatic --data-file="<scratchpad>\jwt_secret.txt"
```
Output:
```
Created version [1] of the secret [database-url].
Created version [1] of the secret [jwt-secret].
```

Temp files deleted immediately after:
```powershell
Remove-Item "<scratchpad>\db_url.txt","<scratchpad>\jwt_secret.txt" -Force
```

## Step 3 — Create Artifact Registry repo

```
gcloud artifacts repositories create lms-backend --repository-format=docker --location=us-central1 --project=lms-demo-503720
```
Output:
```
Create request issued for: [lms-backend]
Waiting for operation [projects/lms-demo-503720/locations/us-central1/operations/a352fd7b-0101-4f7a-8110-7b33488b0e29] to complete...
...................................................done.
Created repository [lms-backend].
```

## Step 4 — Build and push the image via Cloud Build

```
gcloud builds submit backend --tag=us-central1-docker.pkg.dev/lms-demo-503720/lms-backend/backend:latest --project=lms-demo-503720
```
Uploaded a 61.8 MiB source tarball from `backend/`, built the image on
`python:3.13-slim` (8 Dockerfile steps, all `requirements.txt` deps installed
cleanly), pushed all layers, and tagged the image. Final output:
```
Digest: sha256:91dc93171af399ae03c6a1e4fdfbe821406870451e023fa227c3b24c378e2c7c
STATUS: SUCCESS
```

## Step 5 — Deploy to Cloud Run

### Attempt 1 — failed (unquoted `--set-secrets`)
```powershell
gcloud run deploy lms-backend `
  --image=us-central1-docker.pkg.dev/lms-demo-503720/lms-backend/backend:latest `
  --region=us-central1 --project=lms-demo-503720 --allow-unauthenticated `
  --set-secrets=DATABASE_URL=database-url:latest,JWT_SECRET=jwt-secret:latest `
  --set-env-vars=...
```
Output:
```
ERROR: gcloud crashed (ValueError): Invalid secret spec 'database-url:latest JWT_SECRET=jwt-secret:latest'
```
**Analysis:** the `--set-secrets` value was passed unquoted in PowerShell. The
comma-separated `KEY=VALUE,KEY=VALUE` list got corrupted in transit (the comma
and the leading `DATABASE_URL=` were lost), producing a malformed spec. Fix:
always quote multi-value gcloud list flags as a single string in PowerShell.

### Attempt 2 — failed (missing IAM binding)
Re-ran with `--set-secrets="DATABASE_URL=database-url:latest,JWT_SECRET=jwt-secret:latest"`
(quoted). The secret spec parsed correctly this time, but:
```
ERROR: (gcloud.run.deploy) spec.template.spec.containers[0].env[6].value_from.secret_key_ref.name:
Permission denied on secret: projects/270670804695/secrets/database-url/versions/latest
for Revision service account 270670804695-compute@developer.gserviceaccount.com.
The service account used must be granted the 'Secret Manager Secret Accessor' role
(roles/secretmanager.secretAccessor) at the secret, project or higher level.
```
**Analysis:** newly created secrets have no IAM bindings by default; the
default compute service account Cloud Run uses needs explicit
`secretmanager.secretAccessor` on each secret. Fixed with:
```
gcloud secrets add-iam-policy-binding database-url --project=lms-demo-503720 --member="serviceAccount:270670804695-compute@developer.gserviceaccount.com" --role="roles/secretmanager.secretAccessor"
gcloud secrets add-iam-policy-binding jwt-secret --project=lms-demo-503720 --member="serviceAccount:270670804695-compute@developer.gserviceaccount.com" --role="roles/secretmanager.secretAccessor"
```
Output (both):
```
Updated IAM policy for secret [database-url / jwt-secret].
bindings:
- members:
  - serviceAccount:270670804695-compute@developer.gserviceaccount.com
  role: roles/secretmanager.secretAccessor
```

### Attempt 3 — failed (container failed to start)
Re-ran the same deploy command. IAM was now correct, but:
```
ERROR: (gcloud.run.deploy) The user-provided container failed to start and listen
on the port defined provided by the PORT=8080 environment variable within the
allocated timeout.
```
Pulled the revision's startup logs:
```
gcloud logging read 'resource.type="cloud_run_revision" AND resource.labels.service_name="lms-backend" AND resource.labels.revision_name="lms-backend-00002-6hc"' --project=lms-demo-503720 --limit=50 --format="value(timestamp,severity,textPayload)" --order=asc
```
Traceback showed:
```
json.decoder.JSONDecodeError: Expecting value: line 1 column 2 (char 1)
...
pydantic_settings/sources.py ... decode_complex_value ... json.loads(value)
...
app/core/config.py -> get_settings() -> Settings() failed at import time (app/db/session.py)
```
**Analysis:** `CORS_ORIGINS` is a `list[str]` field, so pydantic-settings
JSON-decodes the raw env var value. The value was passed via
`--set-env-vars=...,CORS_ORIGINS=[\"http://localhost:5173\"]`; PowerShell does
not treat `\"` as an escape the way `cmd`/bash would, so the string that
actually reached the container was malformed JSON, and the app crashed at
import time before uvicorn could bind to `$PORT` — hence Cloud Run's generic
"failed to start and listen on PORT" error masking the real (Python-level)
cause. Fixed by moving all non-secret env vars into a YAML file and using
`--env-vars-file`, which avoids shell quoting entirely:
```yaml
JWT_ALGORITHM: "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES: "15"
REFRESH_TOKEN_EXPIRE_MINUTES: "10080"
PASSWORD_RESET_TOKEN_EXPIRE_MINUTES: "30"
MIN_PASSWORD_LENGTH: "8"
CORS_ORIGINS: '["http://localhost:5173"]'
```

### Attempt 4 — success
```
gcloud run deploy lms-backend `
  --image=us-central1-docker.pkg.dev/lms-demo-503720/lms-backend/backend:latest `
  --region=us-central1 --project=lms-demo-503720 --allow-unauthenticated `
  --set-secrets="DATABASE_URL=database-url:latest,JWT_SECRET=jwt-secret:latest" `
  --env-vars-file="<scratchpad>\env-vars.yaml"
```
Output:
```
Deploying container to Cloud Run service [lms-backend] in project [lms-demo-503720] region [us-central1]
Deploying...
Setting IAM Policy......................done
Creating Revision.......................................................................................................done
Routing traffic.....done
Done.
Service [lms-backend] revision [lms-backend-00003-q58] has been deployed and is serving 100 percent of traffic.
Service URL: <BACKEND_SERVICE_URL>
```

## Step 6 — Run `alembic upgrade head` against Neon

Chose a one-off **Cloud Run Job** reusing the same built image over running
Alembic locally, since the image already has `alembic`/`asyncpg` installed —
avoids setting up a Windows Python venv with C-extension deps just for a
single migration run.

```
gcloud run jobs create lms-backend-migrate `
  --image=us-central1-docker.pkg.dev/lms-demo-503720/lms-backend/backend:latest `
  --region=us-central1 --project=lms-demo-503720 `
  --set-secrets="DATABASE_URL=database-url:latest" `
  --command=alembic --args=upgrade,head
```
Job created successfully.

### Execution attempt 1 — failed (unquoted `--args`)
```
gcloud run jobs execute lms-backend-migrate --region=us-central1 --project=lms-demo-503720 --wait
```
Ran long enough to be backgrounded (>180s timeout), then was found still
retrying. Logs:
```
gcloud logging read 'resource.type="cloud_run_job" AND resource.labels.job_name="lms-backend-migrate" AND labels."run.googleapis.com/execution_name"="lms-backend-migrate-lh957"' --project=lms-demo-503720 --limit=100 --format="value(timestamp,severity,textPayload)" --order=asc
```
```
alembic: error: argument {...}: invalid choice: 'upgrade head' (choose from 'branches', 'check', ...)
Container called exit(2).
```
**Analysis:** same class of bug as the `--set-secrets` issue — the unquoted
`--args=upgrade,head` had its comma lost in PowerShell's argument handling, so
the container received a single argument `"upgrade head"` instead of two
separate args `["upgrade", "head"]`, which `argparse` (used by Alembic's CLI)
rejected outright.

Fixed by quoting and updating the existing job in place:
```
gcloud run jobs update lms-backend-migrate --region=us-central1 --project=lms-demo-503720 --args="upgrade,head"
```
Verified the fix before re-running:
```
gcloud run jobs describe lms-backend-migrate --region=us-central1 --project=lms-demo-503720 --format="yaml(spec.template.spec.template.spec.containers[0].args,spec.template.spec.template.spec.containers[0].command)"
```
```yaml
spec:
  template:
    spec:
      template:
        spec:
          containers:
          - args:
            - upgrade
            - head
            command:
            - alembic
```

### Execution attempt 2 — success
```
gcloud run jobs execute lms-backend-migrate --region=us-central1 --project=lms-demo-503720 --wait
```
```
Execution [lms-backend-migrate-xnnn7] has successfully completed.
```
Confirmed via logs that the migration actually ran (not a silent no-op):
```
gcloud logging read 'resource.type="cloud_run_job" AND resource.labels.job_name="lms-backend-migrate" AND labels."run.googleapis.com/execution_name"="lms-backend-migrate-xnnn7"' --project=lms-demo-503720 --limit=50 --format="value(timestamp,textPayload)" --order=asc
```
```
[alembic.runtime.migration] Context impl PostgresqlImpl.
[alembic.runtime.migration] Will assume transactional DDL.
[alembic.runtime.migration] Running upgrade  -> 8f57289a6f2b, create users and password_reset_tokens
Container called exit(0).
```

Note: a stray background-task notification for the *first* (failed) execution
attempt arrived after the second (successful) one had already been confirmed
via logs — it was for the superseded `lms-backend-migrate-lh957` execution and
was disregarded in favor of the verified `lms-backend-migrate-xnnn7` result.

## Step 7 — Verify the deployed service

```powershell
Invoke-WebRequest -Uri "<BACKEND_SERVICE_URL>/docs" -UseBasicParsing
Invoke-WebRequest -Uri "<BACKEND_SERVICE_URL>/openapi.json" -UseBasicParsing
```
Both returned `200`.

## Cleanup

All temp files holding secret material (`db_url.txt`, `jwt_secret.txt`) and
the non-sensitive `env-vars.yaml` were deleted from the session scratchpad
after use. No secrets were written to any file inside this repository, to
`cloudbuild.yaml`, or to shell history (all `--data-file` values were files,
not inline arguments).

## Result

| Resource | Name | Notes |
|---|---|---|
| Secret Manager secret | `database-url` | Neon `postgresql+asyncpg://...` URL |
| Secret Manager secret | `jwt-secret` | `secrets.token_urlsafe(64)`-generated |
| Artifact Registry repo | `lms-backend` (us-central1) | Docker format |
| Container image | `us-central1-docker.pkg.dev/lms-demo-503720/lms-backend/backend:latest` | |
| Cloud Run service | `lms-backend` (us-central1) | public, `--allow-unauthenticated` |
| Cloud Run job | `lms-backend-migrate` | `alembic upgrade head`, reusable for future migrations |
| Service URL | <BACKEND_SERVICE_URL> | `/docs` returns 200 |

`CORS_ORIGINS` was initially `["http://localhost:5173"]` as a placeholder;
updated in the frontend deployment below to include the deployed frontend's
origin.

---

# Frontend Deployment to Cloud Run

Date: 2026-07-28 (same session, immediately following the backend deployment)

## Pre-flight: files read to confirm build/serve setup

- `frontend/Dockerfile` — multi-stage build: `node:22-alpine` builds the Vite
  app (`npm ci && npm run build`), then `nginx:1.27-alpine` serves the static
  `dist/` output. Listens on port `8080` (Cloud Run default), so no `--port`
  override needed on deploy.
- `frontend/nginx.conf` — simple SPA config: `try_files $uri $uri/ /index.html`.
- `frontend/package.json` — React 19 + Vite 6 + TypeScript, `learnflow-frontend`.
- Key constraint (per Dockerfile comment): Vite inlines `VITE_*` env vars at
  **build time**, so the backend's URL must be passed as a Docker build-arg
  (`--build-arg VITE_API_BASE_URL=...`), not as a Cloud Run runtime env var.

## Decision: reaching the backend URL

Cloud Run URLs are deterministic —
`https://<service>-<project-number>.<region>.run.app` — so the backend's URL
(`<BACKEND_SERVICE_URL>`, already live from the
prior deployment) could be baked into the frontend build without waiting for
anything new. Likewise, the frontend's own URL
(`<FRONTEND_SERVICE_URL>`) was predictable
ahead of deploying it, which let the backend's `CORS_ORIGINS` be planned in
the same breath as the deploy plan.

## Step 1 — Create Artifact Registry repo

```
gcloud artifacts repositories create lms-frontend --repository-format=docker --location=us-central1 --project=lms-demo-503720
```
Output:
```
Create request issued for: [lms-frontend]
Waiting for operation [projects/lms-demo-503720/locations/us-central1/operations/c7a53d1b-83cc-4e0a-b35a-0f6dc38b82c6] to complete...
..........done.
Created repository [lms-frontend].
```

## Step 2 — Build and push the image via Cloud Build

**Analysis:** `gcloud builds submit --tag=IMAGE` (the shorthand used for the
backend) only runs a plain `docker build -t IMAGE .` — it does not expose a
`--build-arg` flag. Passing `VITE_API_BASE_URL` through required a small
`cloudbuild.yaml` build config instead (written to the session scratchpad, not
committed to the repo, since it hardcodes an environment-specific URL):

```yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - build
      - --build-arg
      - VITE_API_BASE_URL=<BACKEND_SERVICE_URL>
      - -t
      - us-central1-docker.pkg.dev/lms-demo-503720/lms-frontend/frontend:latest
      - .
images:
  - us-central1-docker.pkg.dev/lms-demo-503720/lms-frontend/frontend:latest
```

```
gcloud builds submit frontend --config="<scratchpad>\cloudbuild-frontend.yaml" --project=lms-demo-503720
```
Build ran cleanly: `npm ci` (68 packages, 0 vulnerabilities), `tsc -b && vite
build` (36 modules, ~209 kB JS bundle), then the nginx stage copied `dist/`
in. Output:
```
Digest: sha256:78b747073c7f4072d057f7245838f33ec4e81d2112cf4109d38f51e9edaddbcd
STATUS: SUCCESS
```

## Step 3 — Deploy to Cloud Run

```
gcloud run deploy lms-frontend `
  --image=us-central1-docker.pkg.dev/lms-demo-503720/lms-frontend/frontend:latest `
  --region=us-central1 --project=lms-demo-503720 --allow-unauthenticated
```
Output:
```
Deploying container to Cloud Run service [lms-frontend] in project [lms-demo-503720] region [us-central1]
Deploying new service...
Setting IAM Policy....................done
Creating Revision................................................done
Routing traffic.....done
Done.
Service [lms-frontend] revision [lms-frontend-00001-bls] has been deployed and is serving 100 percent of traffic.
Service URL: <FRONTEND_SERVICE_URL>
```
Deployed URL matched the predicted one exactly.

## Step 4 — Update backend `CORS_ORIGINS` to allow the frontend origin

This modifies the already-live `lms-backend` service, so it was called out
explicitly as an update to an existing resource rather than a new one. Reused
the `--env-vars-file` approach from the backend deployment (same reasoning:
avoids PowerShell mangling the JSON-array value):

```yaml
JWT_ALGORITHM: "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES: "15"
REFRESH_TOKEN_EXPIRE_MINUTES: "10080"
PASSWORD_RESET_TOKEN_EXPIRE_MINUTES: "30"
MIN_PASSWORD_LENGTH: "8"
CORS_ORIGINS: '["http://localhost:5173","<FRONTEND_SERVICE_URL>"]'
```
```
gcloud run services update lms-backend --region=us-central1 --project=lms-demo-503720 --env-vars-file="<scratchpad>\env-vars-backend-cors.yaml"
```
Output:
```
Deploying...
Creating Revision........................................................................................................................................done
Routing traffic.....done
Done.
Service [lms-backend] revision [lms-backend-00004-7cb] has been deployed and is serving 100 percent of traffic.
Service URL: <BACKEND_SERVICE_URL>
```

**Verification that `--env-vars-file` didn't clobber the secret-sourced env
vars** (since Cloud Run stores literal and secret-backed env vars in the same
underlying `env` list, this was worth double-checking rather than assuming):
```
gcloud run services describe lms-backend --region=us-central1 --project=lms-demo-503720 --format="yaml(spec.template.spec.containers[0].env)"
```
Confirmed `DATABASE_URL` and `JWT_SECRET` were still present as
`secretKeyRef`s pointing at `database-url:latest` / `jwt-secret:latest`,
alongside the updated literal env vars including the new `CORS_ORIGINS` value.
`--set-env-vars`/`--env-vars-file` and `--set-secrets` are tracked as separate
flag groups by gcloud — updating one does not disturb the other.

## Step 5 — Verify the deployed frontend

```powershell
Invoke-WebRequest -Uri "<FRONTEND_SERVICE_URL>/" -UseBasicParsing
```
Returned `200`, `Content-Type: text/html`, and the expected `LearnFlow`
`index.html` shell referencing the built Vite bundle.

## Cleanup

`cloudbuild-frontend.yaml` and `env-vars-backend-cors.yaml` (both
non-sensitive — no secrets involved in the frontend deploy) were deleted from
the session scratchpad after use.

## Result

| Resource | Name | Notes |
|---|---|---|
| Artifact Registry repo | `lms-frontend` (us-central1) | Docker format |
| Container image | `us-central1-docker.pkg.dev/lms-demo-503720/lms-frontend/frontend:latest` | built with `VITE_API_BASE_URL` baked in |
| Cloud Run service | `lms-frontend` (us-central1) | public, `--allow-unauthenticated` |
| Service URL | <FRONTEND_SERVICE_URL> | returns 200, serves the SPA shell |
| Updated: Cloud Run service | `lms-backend` | `CORS_ORIGINS` now includes the frontend origin |

## Lessons for future gcloud usage on this machine (PowerShell)

1. Always **quote** multi-value gcloud list flags
   (`--set-secrets`, `--set-env-vars`, `--args`, `--update-labels`, etc.) as a
   single string — PowerShell's unquoted comma handling silently corrupts
   them, and gcloud's error messages for this are misleading (crashes,
   "invalid choice", or generic container-startup failures rather than a
   parsing error).
2. For env var values containing JSON/brackets/quotes (e.g. `CORS_ORIGINS`),
   skip `--set-env-vars` entirely and use `--env-vars-file` with a YAML file —
   it avoids shell-escaping problems altogether.
3. A Cloud Run "container failed to start and listen on PORT" error can mask
   an unrelated Python-level crash (here, a JSON parse error in app config at
   import time). Always pull `gcloud logging read` for the failed revision
   before assuming it's a port/timeout issue.
4. Newly created Secret Manager secrets have no IAM bindings — grant
   `roles/secretmanager.secretAccessor` to the Cloud Run service's runtime
   service account (`<PROJECT_NUMBER>-compute@developer.gserviceaccount.com`
   by default) before deploying.
5. `gcloud builds submit --tag=IMAGE` has no `--build-arg` equivalent — it's a
   fixed single-step `docker build`. Any build needing build-args (e.g. a
   frontend baking in an API URL at build time via Vite/webpack) needs a
   `cloudbuild.yaml` passed via `--config` instead.
6. Cloud Run URLs are deterministic
   (`https://<service>-<project-number>.<region>.run.app`), which is useful
   for breaking build-time chicken-and-egg problems between services (e.g. a
   frontend that needs the backend's URL at build time, and a backend whose
   CORS config needs the frontend's URL) — both can be planned up front
   without waiting for either deploy to complete.

---

# Redeploy: Course Management feature

Date: 2026-08-09
Operator account: `giri.kamal@gmail.com`

Shipped the new "Manage courses" backend (courses table + CRUD API) and
frontend (real API-backed UI, replacing the earlier mock data) on top of the
existing `lms-backend` / `lms-frontend` Cloud Run services and Neon database
from the deployment above. No new infrastructure was created — this section
only covers what changed from a routine redeploy.

## Pre-flight

Confirmed the existing resources were all still in place before touching
anything:
```
gcloud run services list --project=lms-demo-503720 --region=us-central1
gcloud run jobs list --project=lms-demo-503720 --region=us-central1
gcloud run jobs describe lms-backend-migrate --region=us-central1 --project=lms-demo-503720 --format="value(spec.template.spec.template.spec.containers[0].image)"
```
`lms-backend`, `lms-frontend`, and the `lms-backend-migrate` job all existed
as before; the migrate job's image reference is the mutable `:latest` tag, so
pushing a new image and re-executing the same job (no `gcloud run jobs
update` needed) picks up the new code automatically.

## Step 1 — Rebuild and redeploy the backend

```
gcloud builds submit backend --tag=us-central1-docker.pkg.dev/lms-demo-503720/lms-backend/backend:latest --project=lms-demo-503720
gcloud run deploy lms-backend --image=us-central1-docker.pkg.dev/lms-demo-503720/lms-backend/backend:latest --region=us-central1 --project=lms-demo-503720
```
Both succeeded; revision `lms-backend-00005-wmm` now serving 100% of traffic.
Verified the new revision kept its existing secrets/env vars (omitting
`--set-secrets`/`--env-vars-file` on `gcloud run deploy` preserves whatever
the previous revision had):
```
gcloud run services describe lms-backend --region=us-central1 --project=lms-demo-503720 --format="yaml(spec.template.spec.containers[0].env)"
```
`DATABASE_URL` / `JWT_SECRET` were still present as `secretKeyRef`s, and all
literal env vars (`CORS_ORIGINS` etc.) were unchanged.

## Step 2 — Run the courses migration against Neon

Reused the existing job rather than creating a new one:
```
gcloud run jobs execute lms-backend-migrate --region=us-central1 --project=lms-demo-503720 --wait
```
```
Execution [lms-backend-migrate-9gwj9] has successfully completed.
```
Confirmed via logs it actually ran the new revision (not a no-op):
```
gcloud logging read 'resource.type="cloud_run_job" AND resource.labels.job_name="lms-backend-migrate" AND labels."run.googleapis.com/execution_name"="lms-backend-migrate-9gwj9"' --project=lms-demo-503720 --limit=50 --format="value(timestamp,textPayload)" --order=asc
```
```
[alembic.runtime.migration] Running upgrade 8f57289a6f2b -> 79a15414a6e7, create courses
Container called exit(0).
```

## Step 3 — Rebuild and redeploy the frontend

Same build-arg approach as the original frontend deploy (`gcloud builds
submit --tag` still has no `--build-arg` flag), reusing a `cloudbuild.yaml`
written to the session scratchpad (not committed — hardcodes the backend
URL) with the same `VITE_API_BASE_URL` as before, since the backend's URL
hasn't changed:
```
gcloud builds submit frontend --config="<scratchpad>\cloudbuild-frontend.yaml" --project=lms-demo-503720
gcloud run deploy lms-frontend --image=us-central1-docker.pkg.dev/lms-demo-503720/lms-frontend/frontend:latest --region=us-central1 --project=lms-demo-503720
```
Revision `lms-frontend-00002-c7l` deployed and serving 100% of traffic. No
`CORS_ORIGINS` update needed since neither service's URL changed.

## Step 4 — Verify

```powershell
Invoke-WebRequest -Uri "<FRONTEND_SERVICE_URL>/" -UseBasicParsing        # 200
Invoke-WebRequest -Uri "<BACKEND_SERVICE_URL>/health" -UseBasicParsing    # {"status":"ok"}
Invoke-RestMethod -Uri "<BACKEND_SERVICE_URL>/courses"                    # 401 missing_token (auth correctly enforced)
```
Then a full smoke test against the live stack: registered a throwaway
account (`qa-test@learnflow-dev.io`), logged in for a real access token,
created a course via `POST /courses`, confirmed it showed up via
`GET /courses?tab=active`, then archived it via `PATCH
/courses/{id}/archive` to leave the production catalog clean (no hard-delete
endpoint exists by design — archiving is the only removal path).

## Result

No new resources — same services, secrets, and Artifact Registry repos as
the original deployment, now running:

| Resource | Revision |
|---|---|
| `lms-backend` | `lms-backend-00005-wmm` (courses API) |
| `lms-frontend` | `lms-frontend-00002-c7l` (courses UI) |
| Neon `courses` table | created via `lms-backend-migrate` execution `lms-backend-migrate-9gwj9` |

## Cleanup

`cloudbuild-frontend.yaml` deleted from the session scratchpad after use (no
secrets involved). The throwaway smoke-test course was archived (see Step 4);
the throwaway smoke-test account was left as-is (harmless, no PII, matches
the existing `qa-test@learnflow-dev.io` account already used for local
testing).
