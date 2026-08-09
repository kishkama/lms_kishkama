import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

CourseLevel = Literal["beginner", "intermediate", "advanced", "expert"]
CourseWriteStatus = Literal["draft", "active"]
CourseStatus = Literal["draft", "active", "archived"]


class CourseWriteRequest(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1)
    category: str = Field(min_length=1, max_length=100)
    level: CourseLevel
    duration_hours: int | None = Field(default=None, ge=0)
    language: str = Field(min_length=1, max_length=50)
    prerequisites: str = Field(default="", max_length=500)
    status: CourseWriteStatus = "draft"


class CourseResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: str
    category: str
    level: CourseLevel
    status: CourseStatus
    duration_hours: int | None
    language: str
    prerequisites: str
    created_at: datetime
    updated_at: datetime
