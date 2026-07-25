from datetime import datetime, timedelta, timezone

import jwt

from app.core.config import get_settings


def _expired_refresh_token(user_id: str) -> str:
    settings = get_settings()
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "type": "refresh",
        "token_version": 0,
        "iat": now - timedelta(minutes=20),
        "exp": now - timedelta(minutes=5),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


async def test_refresh_issues_new_access_token(client, user_credentials):
    await client.post("/auth/register", json=user_credentials)
    login_response = await client.post("/auth/login", json=user_credentials)
    refresh_token = login_response.json()["refresh_token"]

    response = await client.post("/auth/refresh", json={"refresh_token": refresh_token})

    assert response.status_code == 200
    assert response.json()["access_token"]


async def test_refresh_rejects_expired_token(client, user_credentials):
    register_response = await client.post("/auth/register", json=user_credentials)
    user_id = register_response.json()["id"]

    response = await client.post(
        "/auth/refresh", json={"refresh_token": _expired_refresh_token(user_id)}
    )

    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "token_expired"


async def test_refresh_rejects_malformed_token(client):
    response = await client.post("/auth/refresh", json={"refresh_token": "not-a-real-token"})

    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "invalid_token"


async def test_refresh_rejects_access_token_used_as_refresh_token(client, user_credentials):
    await client.post("/auth/register", json=user_credentials)
    login_response = await client.post("/auth/login", json=user_credentials)
    access_token = login_response.json()["access_token"]

    response = await client.post("/auth/refresh", json={"refresh_token": access_token})

    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "invalid_token"
