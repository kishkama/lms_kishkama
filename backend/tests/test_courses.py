COURSE_PAYLOAD = {
    "title": "Intro to UX Research",
    "description": "Learn foundational methods for understanding users.",
    "category": "Design",
    "level": "beginner",
    "duration_hours": 12,
    "language": "English",
    "prerequisites": "",
    "status": "draft",
}


async def test_list_courses_requires_auth(client):
    response = await client.get("/courses")

    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "missing_token"


async def test_create_course_returns_201_with_course(client, auth_headers):
    response = await client.post("/courses", json=COURSE_PAYLOAD, headers=auth_headers)

    assert response.status_code == 201
    body = response.json()
    assert body["title"] == COURSE_PAYLOAD["title"]
    assert body["status"] == "draft"
    assert "id" in body


async def test_create_course_rejects_blank_title(client, auth_headers):
    payload = {**COURSE_PAYLOAD, "title": ""}

    response = await client.post("/courses", json=payload, headers=auth_headers)

    assert response.status_code == 422


async def test_list_courses_defaults_to_active_tab(client, auth_headers):
    await client.post("/courses", json=COURSE_PAYLOAD, headers=auth_headers)
    await client.post(
        "/courses", json={**COURSE_PAYLOAD, "title": "Modern JavaScript", "status": "active"}, headers=auth_headers
    )

    response = await client.get("/courses", headers=auth_headers)

    assert response.status_code == 200
    titles = [c["title"] for c in response.json()]
    assert set(titles) == {"Intro to UX Research", "Modern JavaScript"}


async def test_archived_course_excluded_from_active_tab(client, auth_headers):
    created = await client.post("/courses", json=COURSE_PAYLOAD, headers=auth_headers)
    course_id = created.json()["id"]
    await client.patch(f"/courses/{course_id}/archive", headers=auth_headers)

    active = await client.get("/courses?tab=active", headers=auth_headers)
    archived = await client.get("/courses?tab=archived", headers=auth_headers)

    assert active.json() == []
    assert len(archived.json()) == 1
    assert archived.json()[0]["status"] == "archived"


async def test_update_course_changes_fields(client, auth_headers):
    created = await client.post("/courses", json=COURSE_PAYLOAD, headers=auth_headers)
    course_id = created.json()["id"]

    response = await client.put(
        f"/courses/{course_id}",
        json={**COURSE_PAYLOAD, "title": "Intro to UX Research v2", "status": "active"},
        headers=auth_headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert body["title"] == "Intro to UX Research v2"
    assert body["status"] == "active"


async def test_update_unknown_course_returns_404(client, auth_headers):
    response = await client.put(
        "/courses/00000000-0000-0000-0000-000000000000", json=COURSE_PAYLOAD, headers=auth_headers
    )

    assert response.status_code == 404
    assert response.json()["detail"]["code"] == "course_not_found"


async def test_archive_then_unarchive_round_trip(client, auth_headers):
    created = await client.post("/courses", json=COURSE_PAYLOAD, headers=auth_headers)
    course_id = created.json()["id"]

    archived = await client.patch(f"/courses/{course_id}/archive", headers=auth_headers)
    assert archived.status_code == 200
    assert archived.json()["status"] == "archived"

    unarchived = await client.patch(f"/courses/{course_id}/unarchive", headers=auth_headers)
    assert unarchived.status_code == 200
    assert unarchived.json()["status"] == "active"


async def test_archive_already_archived_course_returns_409(client, auth_headers):
    created = await client.post("/courses", json=COURSE_PAYLOAD, headers=auth_headers)
    course_id = created.json()["id"]
    await client.patch(f"/courses/{course_id}/archive", headers=auth_headers)

    response = await client.patch(f"/courses/{course_id}/archive", headers=auth_headers)

    assert response.status_code == 409
    assert response.json()["detail"]["code"] == "already_archived"


async def test_update_cannot_smuggle_status_out_of_archived(client, auth_headers):
    created = await client.post("/courses", json=COURSE_PAYLOAD, headers=auth_headers)
    course_id = created.json()["id"]
    await client.patch(f"/courses/{course_id}/archive", headers=auth_headers)

    response = await client.put(
        f"/courses/{course_id}",
        json={**COURSE_PAYLOAD, "title": "Edited while archived", "status": "active"},
        headers=auth_headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert body["title"] == "Edited while archived"
    assert body["status"] == "archived"
