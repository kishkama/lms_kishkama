import uuid
from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Any

import bcrypt
import jwt

from app.core.config import get_settings


class TokenType(str, Enum):
    ACCESS = "access"
    REFRESH = "refresh"


class TokenError(Exception):
    """Raised for any invalid/expired/malformed JWT. `code` is machine-readable."""

    def __init__(self, code: str, message: str):
        self.code = code
        self.message = message
        super().__init__(message)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def _create_token(subject: str, token_type: TokenType, expire_minutes: int, extra_claims: dict[str, Any]) -> str:
    settings = get_settings()
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "type": token_type.value,
        "iat": now,
        "exp": now + timedelta(minutes=expire_minutes),
        "jti": str(uuid.uuid4()),
        **extra_claims,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_access_token(user_id: str, role: str) -> str:
    settings = get_settings()
    return _create_token(
        subject=user_id,
        token_type=TokenType.ACCESS,
        expire_minutes=settings.access_token_expire_minutes,
        extra_claims={"role": role},
    )


def create_refresh_token(user_id: str, token_version: int) -> str:
    settings = get_settings()
    return _create_token(
        subject=user_id,
        token_type=TokenType.REFRESH,
        expire_minutes=settings.refresh_token_expire_minutes,
        extra_claims={"token_version": token_version},
    )


def decode_token(token: str, expected_type: TokenType) -> dict[str, Any]:
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except jwt.ExpiredSignatureError:
        raise TokenError("token_expired", "Token has expired")
    except jwt.InvalidTokenError:
        raise TokenError("invalid_token", "Token is invalid")

    if payload.get("type") != expected_type.value:
        raise TokenError("invalid_token", f"Expected a {expected_type.value} token")

    return payload
