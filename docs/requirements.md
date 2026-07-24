# LearnFlow LMS — Authentication Feature Specification

**Feature:** User Registration, Login, JWT Issuing & Password Reset
**Stack context:** FastAPI backend / React 19 frontend / Postgres 17 / JWT-based auth
**Source brief:** "Let user register and log in to LearnFlow."

---

## 1. User Stories

### 1.1 Registration
**As a** prospective learner or instructor,
**I want** to create an account with my email and a password,
**so that** I can access LearnFlow's courses and features under my own identity.

**As a** new user,
**I want** to receive clear validation errors if my registration details are invalid,
**so that** I can correct them before submitting.

### 1.2 Login
**As a** registered user,
**I want** to log in with my email and password,
**so that** I can securely access my account and personalized content.

**As a** registered user,
**I want** to stay logged in across sessions (within a safe time window),
**so that** I don't have to re-authenticate constantly.

### 1.3 JWT Issuing
**As a** backend system,
**I want** to issue a signed JWT access token (and refresh token) upon successful login,
**so that** subsequent API requests can be authenticated statelessly and securely.

**As a** registered user,
**I want** my session to refresh automatically using a refresh token,
**so that** I'm not logged out unexpectedly while actively using the platform.

### 1.4 Password Reset
**As a** registered user who forgot my password,
**I want** to request a password reset link via email,
**so that** I can regain access to my account without contacting support.

**As a** registered user,
**I want** my reset link to expire after a short time,
**so that** my account stays secure if the email is compromised or delayed.

---

## 2. Acceptance Criteria (Given/When/Then)

### 2.1 Registration
- **Given** a visitor is on the registration page, **when** they submit a valid email, password, and required profile fields, **then** the system creates a new user record with a hashed password and returns a success response.
- **Given** a visitor submits an email that already exists in the system, **when** they submit the registration form, **then** the system rejects the request with a clear "email already registered" error (HTTP 409).
- **Given** a visitor submits a password that does not meet complexity requirements (e.g., minimum length), **when** they submit the form, **then** the system returns a validation error specifying the unmet requirement(s).
- **Given** a new account is created, **when** registration completes, **then** the password is stored only as a salted hash (e.g., bcrypt/argon2) — never in plaintext.

### 2.2 Login
- **Given** a registered user enters correct email and password, **when** they submit the login form, **then** the system authenticates them and returns an access token and refresh token.
- **Given** a user enters an incorrect password, **when** they submit the login form, **then** the system returns a generic "invalid credentials" error (HTTP 401) without revealing whether the email exists.
- **Given** a user attempts repeated failed logins beyond a defined threshold, **when** the threshold is exceeded, **then** the system applies rate-limiting or temporary lockout to mitigate brute-force attempts.

### 2.3 JWT Issuing
- **Given** a user successfully authenticates, **when** the login request completes, **then** the system issues a signed JWT access token containing user ID, role, and expiry claims.
- **Given** an access token has expired, **when** the client sends a request with that token, **then** the API rejects it with HTTP 401 and a token-expired error code.
- **Given** a valid refresh token is presented, **when** the client requests a new access token, **then** the system issues a new access token without requiring re-entry of credentials.
- **Given** a refresh token is expired or revoked, **when** it is used to request a new access token, **then** the system rejects the request and requires the user to log in again.

### 2.4 Password Reset
- **Given** a user requests a password reset with a registered email, **when** the request is submitted, **then** the system sends a time-limited, single-use reset link to that email.
- **Given** a user requests a password reset with an unregistered email, **when** the request is submitted, **then** the system returns a generic confirmation message (no account enumeration) without sending an email.
- **Given** a user opens a valid, unexpired reset link, **when** they submit a new password meeting complexity rules, **then** the system updates the password hash and invalidates the reset token.
- **Given** a user opens an expired or already-used reset link, **when** they attempt to reset their password, **then** the system rejects the request and prompts them to request a new link.
- **Given** a password has been reset, **when** the reset completes, **then** all existing refresh tokens/sessions for that user are invalidated, forcing re-login.

---

## 3. BRD Summary

**Objective:** Enable secure, self-service account access for LearnFlow users via registration, login, and password recovery, backed by stateless JWT authentication.

**In Scope:**
- User self-registration (email + password)
- Login with credential validation
- JWT access/refresh token issuance and renewal
- Self-service password reset via emailed link

**Out of Scope (this brief):**
- Social/SSO login (Google, Microsoft, etc.)
- Multi-factor authentication
- Role-based permission management (assumed handled downstream of auth)

**Key Non-Functional Requirements:**
- Passwords hashed with a strong algorithm (bcrypt/argon2); never stored or logged in plaintext.
- JWTs signed with a secret/key managed outside source control; short-lived access tokens, longer-lived refresh tokens.
- Reset tokens are single-use, time-limited (e.g., 15–30 min), and invalidate prior sessions on use.
- No account-enumeration leakage in error messages (login or reset flows).
- Rate-limiting on login and reset-request endpoints to reduce brute-force/abuse risk.

**Dependencies:**
- Email delivery service for reset links.
- Postgres 17 schema updates: `users` table (email, password_hash, timestamps), `password_reset_tokens` table.
- FastAPI endpoints: `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/password-reset/request`, `/auth/password-reset/confirm`.

**Open Questions for Stakeholders:**
1. Should email verification be required before first login?
2. What are the exact password complexity rules?
3. What access/refresh token lifetimes are acceptable (security vs. UX trade-off)?
