# Prompt: Extend LearnFlow LMS UI — Course Management

**Purpose:** This is a build prompt for extending the LearnFlow LMS frontend
with course management capabilities. Hand this document to the
frontend/design team (or an AI coding assistant) as the spec to implement
against. It follows the same format as `docs/requirements.md` (User Stories →
Acceptance Criteria → BRD Summary) so both features stay consistent.

**Feature:** Course Catalog Management (Create, List, Edit, Archive)
**Stack context:** FastAPI backend / React 19 frontend / Postgres 17
**Source brief:** "Extend the current LMS UI so admins/instructors can create,
browse, edit, and archive courses."

---

## 1. User Stories

### 1.1 Create a New Course
**As a** course administrator or instructor,
**I want** an option to create a new course from the courses page,
**so that** I can add new learning content to the LMS catalog without leaving the page.

### 1.2 Course Fields
**As a** course administrator,
**I want** each course to capture a title, category, status, and other fields relevant to learning content (description, level, etc.),
**so that** courses are complete, categorized, and discoverable by learners.

### 1.3 Course Grid
**As a** course administrator,
**I want** to see all existing courses in a grid/table view,
**so that** I can quickly scan, find, and manage the full course catalog.

### 1.4 Active / Archived Toggle
**As a** course administrator,
**I want** to toggle the course grid between Active and Archived courses,
**so that** I can focus on live courses day-to-day while still being able to review or restore archived ones.

### 1.5 Manage / Edit Course
**As a** course administrator,
**I want** a Manage or Edit action on each course row,
**so that** I can update a course's details directly from the grid.

### 1.6 Create/Edit Course Form
**As a** course administrator,
**I want** the create and edit course form to capture Title, Description, Category (dropdown), and Level (dropdown), with clear Save and Cancel actions,
**so that** I can efficiently author or update a course and safely back out without saving unintended changes.

### 1.7 Archive a Course (Danger Zone)
**As a** course administrator,
**I want** a clearly separated "danger zone" in the edit-course view where I can archive a course,
**so that** I can retire outdated courses while being protected from doing so by accident.

---

## 2. Acceptance Criteria (Given/When/Then)

### 2.1 Create a New Course
- **Given** an administrator is on the Courses page, **when** they click "New Course," **then** the create-course form opens (as a modal or dedicated route) with all fields empty and Status defaulted to `Draft`.
- **Given** the create-course form is open, **when** required fields are missing on submit, **then** inline validation errors appear next to the offending fields and the form does not submit.

### 2.2 Course Fields
- **Given** a course is created or edited, **when** it is saved, **then** it stores at minimum: `title`, `description`, `category`, `level`, `status`, `created_at`, `updated_at`.
- **Given** the product may need richer metadata later, **when** designing the schema, **then** the following optional fields should be considered and confirmed with stakeholders: estimated duration/hours, thumbnail/cover image, instructor/owner, tags, language, prerequisites, and enrollment capacity.
- **Given** `status`, **when** a course is first created, **then** it defaults to `Draft`; valid values are `Draft`, `Active`, and `Archived`.

### 2.3 Course Grid
- **Given** an administrator opens the Courses page, **when** the page loads, **then** a grid displays all non-archived courses by default, showing at minimum: Title, Category, Level, Status, and Last Updated.
- **Given** the grid has more courses than fit on one screen, **when** the list is long, **then** the grid paginates or virtualizes rather than rendering an unbounded list.
- **Given** no courses exist for the current filter, **when** the grid renders, **then** an empty state with a "Create your first course" call to action is shown.

### 2.4 Active / Archived Toggle
- **Given** the Courses page, **when** it loads, **then** a toggle (e.g., segmented control or switch labeled "Active / Archived") is visible above the grid, defaulted to "Active."
- **Given** the administrator switches the toggle to "Archived," **when** the toggle changes, **then** the grid re-queries and shows only courses with `status = Archived`.
- **Given** the toggle state, **when** the administrator navigates away and returns, **then** the last-selected toggle state is preserved for the session (nice-to-have — confirm with stakeholders).

### 2.5 Manage / Edit Course
- **Given** a course row in the grid, **when** the administrator clicks its Manage/Edit action, **then** the edit-course form opens pre-populated with that course's current data.
- **Given** an archived course, **when** the administrator opens Manage/Edit, **then** editing is still permitted for metadata fields, but a clear "Archived" indicator is shown (confirm with stakeholders whether archived courses should be read-only instead).

### 2.6 Create/Edit Course Form
- **Given** the create/edit form, **when** it renders, **then** it includes: Title (text input, required), Description (textarea, required), Category (dropdown, required, populated from a managed category list), and Level (dropdown, required; options: Beginner, Intermediate, Advanced, Expert).
- **Given** the form's action row, **when** it renders, **then** it shows "Save" styled as the primary button and "Cancel" styled as a ghost/tertiary button, with Save on the right per platform convention.
- **Given** unsaved changes exist, **when** the administrator clicks Cancel, **then** the form closes without persisting changes (confirm whether an "unsaved changes" confirmation dialog is required).
- **Given** valid data, **when** the administrator clicks Save, **then** the course is created/updated, a success toast/notification is shown, and the grid reflects the change immediately.

### 2.7 Archive a Course (Danger Zone)
- **Given** the edit-course view, **when** it renders, **then** a "Danger Zone" section appears visually separated from the rest of the form (e.g., bottom of the page, red/warning-colored border, distinct heading), containing the Archive action.
- **Given** the administrator clicks "Archive Course," **when** the action is triggered, **then** a confirmation dialog appears explaining the consequence (e.g., "Archived courses are hidden from learners and the active catalog. You can unarchive it later.") before any change is committed.
- **Given** the confirmation dialog for a destructive action, **when** it is shown, **then** the confirm button is styled as destructive (red/danger), is not the default-focused element, and the dialog requires an explicit affirmative click (no accidental Enter-key confirmation).
- **Given** the course is successfully archived, **when** the action completes, **then** its `status` is set to `Archived`, it disappears from the "Active" grid view, appears under "Archived," and a success confirmation is shown.
- **Given** an archived course, **when** the administrator wants to reverse the action, **then** an "Unarchive" / "Restore" action is available (either in the grid row or the same Danger Zone) to set `status` back to `Active`.

---

## 3. BRD Summary

**Objective:** Extend the LearnFlow LMS UI so administrators/instructors can
create, browse, edit, and archive courses, giving the platform a functional
course catalog management surface beyond authentication.

**In Scope:**
- "New Course" creation flow
- Course grid listing with Active/Archived filtering
- Manage/Edit flow for existing courses, reusing the create form
- Danger Zone pattern for archiving (and unarchiving) courses

**Out of Scope (this brief):**
- Course content authoring (lessons, modules, quizzes, videos)
- Learner-facing course browsing/enrollment UI
- Bulk actions (bulk archive, bulk category reassignment)
- Permanent/hard delete of courses (archive is a soft-delete only)
- Category and instructor management screens (assume categories are seeded or managed elsewhere for now)

**Key UI/Design Requirements:**
- **Danger Zone pattern (industry standard):** isolate destructive actions in a distinctly bordered/colored section (red accent, warning icon), separate from routine settings; require an explicit confirmation step (dialog or type-to-confirm) before committing; use a destructive-styled confirm button that is not the default focus target; state the consequence and reversibility plainly in the copy.
- **Button hierarchy:** Save = primary (filled, high emphasis); Cancel = ghost/tertiary (low emphasis, no fill); destructive actions (Archive) = separate danger styling, never grouped with primary/ghost pair.
- Grid should support empty, loading, and error states, not just the happy path.
- Toggle control should make the current filter state (Active vs. Archived) unambiguous at a glance.

**Key Non-Functional Requirements:**
- Course create/edit operations should give optimistic or immediate UI feedback (loading state on Save, disabled state to prevent double-submit).
- Archive is a reversible, soft-delete operation — no data is destroyed, only hidden from active views.
- Form validation errors must be field-level and accessible (ARIA-compliant) alongside any top-level summary.
- Category and Level lists should be centrally defined (not hardcoded per form instance) so they stay consistent across create/edit/filter surfaces.

**Dependencies:**
- Postgres schema: `courses` table (`id`, `title`, `description`, `category`, `level`, `status`, `created_at`, `updated_at`, plus any confirmed optional fields).
- FastAPI endpoints: `GET /courses` (with `status` filter/query param), `POST /courses`, `GET /courses/{id}`, `PUT /courses/{id}`, `PATCH /courses/{id}/archive`, `PATCH /courses/{id}/unarchive`.
- Existing auth/JWT middleware (per `docs/requirements.md`) to gate these endpoints to authorized roles (instructor/admin).

**Open Questions for Stakeholders:**
1. What roles are allowed to create/edit/archive courses — instructors only, admins only, or both?
2. Should archived courses remain editable, or become read-only until unarchived?
3. What is the full/final list of "other relevant learning fields" beyond description and level (e.g., duration, thumbnail, price, prerequisites, language)?
4. Is a category the responsibility of this feature to manage (CRUD on categories), or is it a fixed/seeded list maintained elsewhere?
5. Should archiving require a type-to-confirm step (e.g., typing the course title) in addition to a confirmation dialog, given the current scale of course data?
