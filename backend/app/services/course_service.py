import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Course
from app.schemas.courses import CourseWriteRequest


class CourseError(Exception):
    """Raised for any business-rule course failure. `status_code` + `code` map directly
    onto the API response (see app/api/routes/courses.py)."""

    def __init__(self, status_code: int, code: str, message: str):
        self.status_code = status_code
        self.code = code
        self.message = message
        super().__init__(message)


async def _get_or_404(db: AsyncSession, course_id: uuid.UUID) -> Course:
    course = await db.get(Course, course_id)
    if course is None:
        raise CourseError(404, "course_not_found", "Course not found")
    return course


async def list_courses(db: AsyncSession, *, archived: bool) -> list[Course]:
    status_filter = ["archived"] if archived else ["draft", "active"]
    result = await db.scalars(
        select(Course).where(Course.status.in_(status_filter)).order_by(Course.updated_at.desc())
    )
    return list(result.all())


async def create_course(db: AsyncSession, payload: CourseWriteRequest) -> Course:
    course = Course(**payload.model_dump())
    db.add(course)
    await db.commit()
    await db.refresh(course)
    return course


async def update_course(db: AsyncSession, course_id: uuid.UUID, payload: CourseWriteRequest) -> Course:
    course = await _get_or_404(db, course_id)

    for field, value in payload.model_dump().items():
        if field == "status" and course.status == "archived":
            # Archiving/unarchiving is a dedicated action — a plain edit must not
            # smuggle a status change in or out of the archived state.
            continue
        setattr(course, field, value)

    await db.commit()
    await db.refresh(course)
    return course


async def archive_course(db: AsyncSession, course_id: uuid.UUID) -> Course:
    course = await _get_or_404(db, course_id)
    if course.status == "archived":
        raise CourseError(409, "already_archived", "Course is already archived")

    course.status = "archived"
    await db.commit()
    await db.refresh(course)
    return course


async def unarchive_course(db: AsyncSession, course_id: uuid.UUID) -> Course:
    course = await _get_or_404(db, course_id)
    if course.status != "archived":
        raise CourseError(409, "not_archived", "Course is not archived")

    course.status = "active"
    await db.commit()
    await db.refresh(course)
    return course
