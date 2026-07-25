import hashlib
import secrets
import uuid
from datetime import timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.time import utcnow
from app.core.security import (
    TokenError,
    TokenType,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.db.models import PasswordResetToken, User
from app.services.email_service import email_service

DEFAULT_ROLE = "learner"


class AuthError(Exception):
    """Raised for any business-rule auth failure. `status_code` + `code` map directly
    onto the API response (see app/api/routes/auth.py)."""

    def __init__(self, status_code: int, code: str, message: str):
        self.status_code = status_code
        self.code = code
        self.message = message
        super().__init__(message)


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _hash_reset_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


async def register_user(db: AsyncSession, email: str, password: str) -> User:
    settings = get_settings()
    if len(password) < settings.min_password_length:
        raise AuthError(
            400,
            "password_too_short",
            f"Password must be at least {settings.min_password_length} characters",
        )

    normalized_email = _normalize_email(email)
    existing = await db.scalar(select(User).where(User.email == normalized_email))
    if existing is not None:
        raise AuthError(409, "email_already_registered", "Email is already registered")

    user = User(email=normalized_email, password_hash=hash_password(password))
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def authenticate_user(db: AsyncSession, email: str, password: str) -> tuple[str, str]:
    normalized_email = _normalize_email(email)
    user = await db.scalar(select(User).where(User.email == normalized_email))

    if user is None or not verify_password(password, user.password_hash):
        raise AuthError(401, "invalid_credentials", "Incorrect email or password")

    access_token = create_access_token(str(user.id), DEFAULT_ROLE)
    refresh_token = create_refresh_token(str(user.id), user.token_version)
    return access_token, refresh_token


async def refresh_access_token(db: AsyncSession, refresh_token: str) -> str:
    try:
        payload = decode_token(refresh_token, TokenType.REFRESH)
    except TokenError as exc:
        raise AuthError(401, exc.code, exc.message) from exc

    user = await db.get(User, uuid.UUID(payload["sub"]))
    if user is None:
        raise AuthError(401, "invalid_token", "Token is invalid")

    if payload.get("token_version") != user.token_version:
        raise AuthError(401, "token_revoked", "Refresh token has been revoked")

    return create_access_token(str(user.id), DEFAULT_ROLE)


async def request_password_reset(db: AsyncSession, email: str) -> None:
    """Always succeeds from the caller's perspective (no account enumeration) —
    only creates a token + sends an email when the address is actually registered."""
    settings = get_settings()
    normalized_email = _normalize_email(email)
    user = await db.scalar(select(User).where(User.email == normalized_email))
    if user is None:
        return

    raw_token = secrets.token_urlsafe(32)
    reset_token = PasswordResetToken(
        user_id=user.id,
        token_hash=_hash_reset_token(raw_token),
        expires_at=utcnow() + timedelta(minutes=settings.password_reset_token_expire_minutes),
    )
    db.add(reset_token)
    await db.commit()

    reset_link = f"https://learnflow.example/reset-password?token={raw_token}"
    await email_service.send_password_reset_email(user.email, reset_link)


async def confirm_password_reset(db: AsyncSession, raw_token: str, new_password: str) -> None:
    settings = get_settings()
    if len(new_password) < settings.min_password_length:
        raise AuthError(
            400,
            "password_too_short",
            f"Password must be at least {settings.min_password_length} characters",
        )

    token_hash = _hash_reset_token(raw_token)
    reset_token = await db.scalar(
        select(PasswordResetToken).where(PasswordResetToken.token_hash == token_hash)
    )

    now = utcnow()
    if (
        reset_token is None
        or reset_token.used_at is not None
        or reset_token.expires_at < now
    ):
        raise AuthError(400, "invalid_or_expired_reset_token", "Reset link is invalid or has expired")

    user = await db.get(User, reset_token.user_id)
    if user is None:
        raise AuthError(400, "invalid_or_expired_reset_token", "Reset link is invalid or has expired")

    user.password_hash = hash_password(new_password)
    user.token_version += 1
    reset_token.used_at = now

    await db.commit()
