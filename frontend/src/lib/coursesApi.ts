import { request } from './api';
import type { Course, CourseLevel, CourseStatus } from './courses';

interface CourseDto {
  id: string;
  title: string;
  description: string;
  category: string;
  level: CourseLevel;
  status: CourseStatus;
  duration_hours: number | null;
  language: string;
  prerequisites: string;
  updated_at: string;
}

export interface CourseWritePayload {
  title: string;
  description: string;
  category: string;
  level: CourseLevel;
  durationHours: number | null;
  language: string;
  prerequisites: string;
  status: Exclude<CourseStatus, 'archived'>;
}

function fromDto(dto: CourseDto): Course {
  return {
    id: dto.id,
    title: dto.title,
    description: dto.description,
    category: dto.category,
    level: dto.level,
    status: dto.status,
    durationHours: dto.duration_hours,
    language: dto.language,
    prerequisites: dto.prerequisites,
    updatedAt: dto.updated_at,
  };
}

function toWriteBody(payload: CourseWritePayload) {
  return {
    title: payload.title,
    description: payload.description,
    category: payload.category,
    level: payload.level,
    duration_hours: payload.durationHours,
    language: payload.language,
    prerequisites: payload.prerequisites,
    status: payload.status,
  };
}

function authHeaders(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}` };
}

export async function listCourses(tab: 'active' | 'archived', accessToken: string): Promise<Course[]> {
  const dtos = await request<CourseDto[]>(`/courses?tab=${tab}`, { headers: authHeaders(accessToken) });
  return dtos.map(fromDto);
}

export async function createCourse(payload: CourseWritePayload, accessToken: string): Promise<Course> {
  const dto = await request<CourseDto>('/courses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(accessToken) },
    body: JSON.stringify(toWriteBody(payload)),
  });
  return fromDto(dto);
}

export async function updateCourse(
  id: string,
  payload: CourseWritePayload,
  accessToken: string,
): Promise<Course> {
  const dto = await request<CourseDto>(`/courses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders(accessToken) },
    body: JSON.stringify(toWriteBody(payload)),
  });
  return fromDto(dto);
}

export async function archiveCourse(id: string, accessToken: string): Promise<Course> {
  const dto = await request<CourseDto>(`/courses/${id}/archive`, {
    method: 'PATCH',
    headers: authHeaders(accessToken),
  });
  return fromDto(dto);
}

export async function unarchiveCourse(id: string, accessToken: string): Promise<Course> {
  const dto = await request<CourseDto>(`/courses/${id}/unarchive`, {
    method: 'PATCH',
    headers: authHeaders(accessToken),
  });
  return fromDto(dto);
}
