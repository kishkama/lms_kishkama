from tests._credentials import SECOND_USER_PASSWORD, SHORT_PASSWORD, TEST_USER_PASSWORD


async def test_register_creates_user(client, user_credentials):
    response = await client.post("/auth/register", json=user_credentials)

    assert response.status_code == 201
    body = response.json()
    assert body["email"] == user_credentials["email"]
    assert "id" in body


async def test_register_duplicate_email_returns_409(client, user_credentials):
    await client.post("/auth/register", json=user_credentials)

    response = await client.post("/auth/register", json=user_credentials)

    assert response.status_code == 409
    assert response.json()["detail"]["code"] == "email_already_registered"


async def test_register_short_password_returns_400_with_reason(client):
    response = await client.post(
        "/auth/register", json={"email": "shorty@example.com", "password": SHORT_PASSWORD}
    )

    assert response.status_code == 400
    detail = response.json()["detail"]
    assert detail["code"] == "password_too_short"
    assert "8" in detail["message"]


async def test_register_normalizes_email_case(client):
    await client.post(
        "/auth/register", json={"email": "Mixed.Case@Example.com", "password": TEST_USER_PASSWORD}
    )

    duplicate = await client.post(
        "/auth/register", json={"email": "mixed.case@example.com", "password": SECOND_USER_PASSWORD}
    )

    assert duplicate.status_code == 409
