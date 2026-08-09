import uuid

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import TokenError, TokenType, decode_token
from app.db.models import User
from app.db.session import get_db

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(
            status_code=401, detail={"code": "missing_token", "message": "Authentication required"}
        )
    try:
        payload = decode_token(credentials.credentials, TokenType.ACCESS)
    except TokenError as exc:
        raise HTTPException(status_code=401, detail={"code": exc.code, "message": exc.message}) from exc

    user = await db.get(User, uuid.UUID(payload["sub"]))
    if user is None:
        raise HTTPException(status_code=401, detail={"code": "invalid_token", "message": "Token is invalid"})
    return user
