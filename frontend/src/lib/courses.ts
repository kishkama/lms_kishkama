export type CourseStatus = 'draft' | 'active' | 'archived';
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  level: CourseLevel;
  status: CourseStatus;
  durationHours: number | null;
  language: string;
  prerequisites: string;
  updatedAt: string;
}

export const CATEGORY_OPTIONS = [
  'Design',
  'Web Development',
  'Data',
  'Product',
  'Business',
  'Career',
  'Marketing',
];

export const LEVEL_OPTIONS: { value: CourseLevel; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' },
];

export const LANGUAGE_OPTIONS = ['English', 'Spanish', 'French', 'German', 'Hindi'];

export const STATUS_OPTIONS: { value: Exclude<CourseStatus, 'archived'>; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
];

export function formatUpdatedAt(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
