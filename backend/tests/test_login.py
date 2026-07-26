from tests._credentials import UNKNOWN_LOGIN_PASSWORD, WRONG_PASSWORD


async def test_login_with_correct_credentials_returns_tokens(client, user_credentials):
    await client.post("/auth/register", json=user_credentials)

    response = await client.post("/auth/login", json=user_credentials)

    assert response.status_code == 200
    body = response.json()
    assert body["access_token"]
    assert body["refresh_token"]
    assert body["token_type"] == "bearer"


async def test_login_with_wrong_password_returns_generic_401(client, user_credentials):
    await client.post("/auth/register", json=user_credentials)

    response = await client.post(
        "/auth/login", json={"email": user_credentials["email"], "password": WRONG_PASSWORD}
    )

    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "invalid_credentials"


async def test_login_with_unknown_email_returns_same_generic_401(client):
    response = await client.post(
        "/auth/login", json={"email": "nobody@example.com", "password": UNKNOWN_LOGIN_PASSWORD}
    )

    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "invalid_credentials"


async def test_login_rate_limited_after_threshold(client, user_credentials):
    await client.post("/auth/register", json=user_credentials)
    bad_login = {"email": user_credentials["email"], "password": WRONG_PASSWORD}

    responses = [await client.post("/auth/login", json=bad_login) for _ in range(6)]

    assert responses[-1].status_code == 429
