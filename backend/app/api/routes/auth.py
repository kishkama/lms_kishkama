from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.rate_limit import limiter
from app.db.session import get_db
from app.schemas.auth import (
    AccessTokenResponse,
    GenericMessageResponse,
    LoginRequest,
    PasswordResetConfirmRequest,
    PasswordResetRequest,
    RefreshRequest,
    RegisterRequest,
    RegisterResponse,
    TokenResponse,
)
from app.services import auth_service
from app.services.auth_service import AuthError

router = APIRouter(prefix="/auth", tags=["auth"])


def _as_http_exception(exc: AuthError) -> HTTPException:
    return HTTPException(status_code=exc.status_code, detail={"code": exc.code, "message": exc.message})


@router.post("/register", response_model=RegisterResponse, status_code=201)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)) -> RegisterResponse:
    try:
        user = await auth_service.register_user(db, payload.email, payload.password)
    except AuthError as exc:
        raise _as_http_exception(exc) from exc
    return RegisterResponse(id=user.id, email=user.email)


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
async def login(
    request: Request, payload: LoginRequest, db: AsyncSession = Depends(get_db)
) -> TokenResponse:
    try:
        access_token, refresh_token = await auth_service.authenticate_user(db, payload.email, payload.password)
    except AuthError as exc:
        raise _as_http_exception(exc) from exc
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=AccessTokenResponse)
async def refresh(payload: RefreshRequest, db: AsyncSession = Depends(get_db)) -> AccessTokenResponse:
    try:
        access_token = await auth_service.refresh_access_token(db, payload.refresh_token)
    except AuthError as exc:
        raise _as_http_exception(exc) from exc
    return AccessTokenResponse(access_token=access_token)


@router.post("/password-reset/request", response_model=GenericMessageResponse)
@limiter.limit("3/minute")
async def request_password_reset(
    request: Request, payload: PasswordResetRequest, db: AsyncSession = Depends(get_db)
) -> GenericMessageResponse:
    await auth_service.request_password_reset(db, payload.email)
    return GenericMessageResponse(
        message="If an account with that email exists, a password reset link has been sent."
    )


@router.post("/password-reset/confirm", response_model=GenericMessageResponse)
async def confirm_password_reset(
    payload: PasswordResetConfirmRequest, db: AsyncSession = Depends(get_db)
) -> GenericMessageResponse:
    try:
        await auth_service.confirm_password_reset(db, payload.token, payload.new_password)
    except AuthError as exc:
        raise _as_http_exception(exc) from exc
    return GenericMessageResponse(message="Password has been reset. Please log in again.")
