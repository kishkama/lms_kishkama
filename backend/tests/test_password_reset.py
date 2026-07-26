from urllib.parse import parse_qs, urlparse

from app.services import auth_service
from tests._credentials import (
    BOGUS_TOKEN_PASSWORD,
    RESET_PASSWORD_1,
    RESET_PASSWORD_2,
    RESET_PASSWORD_3,
)


def _capture_reset_link(monkeypatch):
    captured: dict[str, str] = {}

    async def fake_send(to_email: str, reset_link: str) -> None:
        captured["to_email"] = to_email
        captured["reset_link"] = reset_link

    monkeypatch.setattr(auth_service.email_service, "send_password_reset_email", fake_send)
    return captured


def _token_from_link(reset_link: str) -> str:
    return parse_qs(urlparse(reset_link).query)["token"][0]


async def test_request_reset_for_known_email_sends_link(client, user_credentials, monkeypatch):
    captured = _capture_reset_link(monkeypatch)
    await client.post("/auth/register", json=user_credentials)

    response = await client.post(
        "/auth/password-reset/request", json={"email": user_credentials["email"]}
    )

    assert response.status_code == 200
    assert captured["to_email"] == user_credentials["email"]
    assert captured["reset_link"]


async def test_request_reset_for_unknown_email_returns_same_generic_message(
    client, user_credentials, monkeypatch
):
    captured = _capture_reset_link(monkeypatch)
    await client.post("/auth/register", json=user_credentials)

    known_response = await client.post(
        "/auth/password-reset/request", json={"email": user_credentials["email"]}
    )
    unknown_response = await client.post(
        "/auth/password-reset/request", json={"email": "nobody@example.com"}
    )

    assert unknown_response.status_code == 200
    assert unknown_response.json()["message"] == known_response.json()["message"]
    assert captured["to_email"] == user_credentials["email"]


async def test_confirm_reset_with_valid_token_updates_password_and_revokes_old_refresh_tokens(
    client, user_credentials, monkeypatch
):
    captured = _capture_reset_link(monkeypatch)
    await client.post("/auth/register", json=user_credentials)
    login_response = await client.post("/auth/login", json=user_credentials)
    old_refresh_token = login_response.json()["refresh_token"]

    await client.post("/auth/password-reset/request", json={"email": user_credentials["email"]})
    raw_token = _token_from_link(captured["reset_link"])

    confirm_response = await client.post(
        "/auth/password-reset/confirm",
        json={"token": raw_token, "new_password": RESET_PASSWORD_1},
    )
    assert confirm_response.status_code == 200

    old_token_refresh = await client.post("/auth/refresh", json={"refresh_token": old_refresh_token})
    assert old_token_refresh.status_code == 401
    assert old_token_refresh.json()["detail"]["code"] == "token_revoked"

    old_password_login = await client.post("/auth/login", json=user_credentials)
    assert old_password_login.status_code == 401

    new_password_login = await client.post(
        "/auth/login",
        json={"email": user_credentials["email"], "password": RESET_PASSWORD_1},
    )
    assert new_password_login.status_code == 200


async def test_confirm_reset_with_reused_token_fails(client, user_credentials, monkeypatch):
    captured = _capture_reset_link(monkeypatch)
    await client.post("/auth/register", json=user_credentials)
    await client.post("/auth/password-reset/request", json={"email": user_credentials["email"]})
    raw_token = _token_from_link(captured["reset_link"])

    first = await client.post(
        "/auth/password-reset/confirm",
        json={"token": raw_token, "new_password": RESET_PASSWORD_2},
    )
    assert first.status_code == 200

    second = await client.post(
        "/auth/password-reset/confirm",
        json={"token": raw_token, "new_password": RESET_PASSWORD_3},
    )
    assert second.status_code == 400
    assert second.json()["detail"]["code"] == "invalid_or_expired_reset_token"


async def test_confirm_reset_with_bogus_token_fails(client):
    response = await client.post(
        "/auth/password-reset/confirm",
        json={"token": "not-a-real-token", "new_password": BOGUS_TOKEN_PASSWORD},
    )

    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "invalid_or_expired_reset_token"
