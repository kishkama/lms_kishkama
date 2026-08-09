import uuid
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.models import User
from app.db.session import get_db
from app.schemas.courses import CourseResponse, CourseWriteRequest
from app.services import course_service
from app.services.course_service import CourseError

router = APIRouter(prefix="/courses", tags=["courses"])


def _as_http_exception(exc: CourseError) -> HTTPException:
    return HTTPException(status_code=exc.status_code, detail={"code": exc.code, "message": exc.message})


@router.get("", response_model=list[CourseResponse])
async def list_courses(
    tab: Literal["active", "archived"] = "active",
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> list[CourseResponse]:
    courses = await course_service.list_courses(db, archived=tab == "archived")
    return [CourseResponse.model_validate(c, from_attributes=True) for c in courses]


@router.post("", response_model=CourseResponse, status_code=201)
async def create_course(
    payload: CourseWriteRequest,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> CourseResponse:
    course = await course_service.create_course(db, payload)
    return CourseResponse.model_validate(course, from_attributes=True)


@router.put("/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: uuid.UUID,
    payload: CourseWriteRequest,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> CourseResponse:
    try:
        course = await course_service.update_course(db, course_id, payload)
    except CourseError as exc:
        raise _as_http_exception(exc) from exc
    return CourseResponse.model_validate(course, from_attributes=True)


@router.patch("/{course_id}/archive", response_model=CourseResponse)
async def archive_course(
    course_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> CourseResponse:
    try:
        course = await course_service.archive_course(db, course_id)
    except CourseError as exc:
        raise _as_http_exception(exc) from exc
    return CourseResponse.model_validate(course, from_attributes=True)


@router.patch("/{course_id}/unarchive", response_model=CourseResponse)
async def unarchive_course(
    course_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> CourseResponse:
    try:
        course = await course_service.unarchive_course(db, course_id)
    except CourseError as exc:
        raise _as_http_exception(exc) from exc
    return CourseResponse.model_validate(course, from_attributes=True)
