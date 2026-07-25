# LearnFlow Auth API

FastAPI implementation of the auth feature in `../docs/requirements.md`: register, login, JWT refresh, and password reset.

## Setup

```
py -m venv .venv
.venv\Scripts\pip install -r requirements.txt
copy .env.example .env      # defaults to a local SQLite DB; point DATABASE_URL at Postgres in production
.venv\Scripts\alembic upgrade head
```

## Run

```
.venv\Scripts\uvicorn app.main:app --reload
```

Swagger UI: http://127.0.0.1:8000/docs

## Test

```
.venv\Scripts\python -m pytest
```

## Notes

- **Database:** SQLite (`aiosqlite`) by default for local dev/tests; set `DATABASE_URL` to a `postgresql+asyncpg://` URL for Postgres 17 in production. Schema is portable between both (see `app/db/models.py`).
- **Password reset email:** `app/services/email_service.py` is a stub that logs the reset link instead of sending real email — swap in a real SMTP/SES client there.
- **Refresh token revocation:** a `token_version` column on `users`, bumped on password reset, invalidates all previously issued refresh tokens at once.
- **Rate limiting:** in-memory (`slowapi`), IP-keyed, on `/auth/login` (5/min) and `/auth/password-reset/request` (3/min). Resets on process restart — fine for a single instance, not for multi-instance deployments.
