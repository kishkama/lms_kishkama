import { useState, type ChangeEvent } from 'react';
import { Modal } from '../design-system/Modal';
import { Button } from '../design-system/Button';
import { Input } from '../design-system/Input';
import { Select } from '../design-system/Select';
import { Icon } from '../design-system/Icon';
import {
  CATEGORY_OPTIONS,
  LEVEL_OPTIONS,
  LANGUAGE_OPTIONS,
  STATUS_OPTIONS,
  type Course,
  type CourseLevel,
  type CourseStatus,
} from '../lib/courses';

export interface CourseFormValues {
  title: string;
  description: string;
  category: string;
  level: CourseLevel;
  durationHours: number | null;
  language: string;
  prerequisites: string;
  status: Exclude<CourseStatus, 'archived'>;
}

interface FormErrors {
  title?: string;
  description?: string;
}

interface CourseFormModalProps {
  course?: Course;
  onClose: () => void;
  onSave: (values: CourseFormValues) => void;
  onArchive: () => void;
  onUnarchive: () => void;
  saving?: boolean;
  serverError?: string;
}

const emptyValues: CourseFormValues = {
  title: '',
  description: '',
  category: CATEGORY_OPTIONS[0],
  level: 'beginner',
  durationHours: null,
  language: LANGUAGE_OPTIONS[0],
  prerequisites: '',
  status: 'draft',
};

export function CourseFormModal({
  course,
  onClose,
  onSave,
  onArchive,
  onUnarchive,
  saving = false,
  serverError,
}: CourseFormModalProps) {
  const isEdit = !!course;
  const isArchived = course?.status === 'archived';
  const [values, setValues] = useState<CourseFormValues>(
    course
      ? {
          title: course.title,
          description: course.description,
          category: course.category,
          level: course.level,
          durationHours: course.durationHours,
          language: course.language,
          prerequisites: course.prerequisites,
          status: course.status === 'archived' ? 'draft' : course.status,
        }
      : emptyValues,
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [confirmingArchive, setConfirmingArchive] = useState(false);

  const onTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setValues((v) => ({ ...v, title: e.target.value }));
    setErrors((prev) => ({ ...prev, title: undefined }));
  };
  const onDescriptionChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setValues((v) => ({ ...v, description: e.target.value }));
    setErrors((prev) => ({ ...prev, description: undefined }));
  };
  const onDurationChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setValues((v) => ({ ...v, durationHours: raw === '' ? null : Math.max(0, Number(raw)) }));
  };

  const onSubmit = () => {
    const nextErrors: FormErrors = {};
    if (!values.title.trim()) nextErrors.title = 'Give the course a title';
    if (!values.description.trim()) nextErrors.description = 'Describe what learners will get out of this course';
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    onSave(values);
  };

  return (
    <>
      <Modal
        title={isEdit ? 'Edit course' : 'New course'}
        onClose={onClose}
        width={520}
        footer={
          <>
            <Button variant="ghost" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" onClick={onSubmit} loading={saving}>
              Save
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {serverError && (
            <div
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--color-danger)',
                background: 'var(--color-danger-subtle)',
                border: '1px solid var(--color-danger)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
              }}
            >
              {serverError}
            </div>
          )}
          <Input
            label="Title"
            placeholder="e.g. Intro to UX Research"
            value={values.title}
            onChange={onTitleChange}
            error={errors.title}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--text-body)' }}>
              Description
            </label>
            <textarea
              placeholder="What will learners get out of this course?"
              value={values.description}
              onChange={onDescriptionChange}
              rows={3}
              style={{
                width: '100%',
                padding: '11px 14px',
                fontSize: 'var(--text-base)',
                fontFamily: 'var(--font-ui)',
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${errors.description ? 'var(--color-danger)' : 'var(--border-default)'}`,
                outline: 'none',
                background: 'var(--surface-card)',
                color: 'var(--text-body)',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
            {errors.description && (
              <span
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-danger)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Icon name="circle-alert" size={13} />
                {errors.description}
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Select
              label="Category"
              value={values.category}
              onChange={(e) => setValues((v) => ({ ...v, category: e.target.value }))}
              options={CATEGORY_OPTIONS.map((c) => ({ value: c, label: c }))}
            />
            <Select
              label="Level"
              value={values.level}
              onChange={(e) => setValues((v) => ({ ...v, level: e.target.value as CourseLevel }))}
              options={LEVEL_OPTIONS}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Input
              label="Duration (hours)"
              type="number"
              min={0}
              value={values.durationHours ?? ''}
              onChange={onDurationChange}
            />
            <Select
              label="Language"
              value={values.language}
              onChange={(e) => setValues((v) => ({ ...v, language: e.target.value }))}
              options={LANGUAGE_OPTIONS.map((l) => ({ value: l, label: l }))}
            />
          </div>

          <Input
            label="Prerequisites"
            placeholder="e.g. Modern JavaScript Fundamentals"
            hint="Comma-separated course titles, optional"
            value={values.prerequisites}
            onChange={(e) => setValues((v) => ({ ...v, prerequisites: e.target.value }))}
          />

          <Select
            label="Status"
            value={values.status}
            onChange={(e) => setValues((v) => ({ ...v, status: e.target.value as CourseFormValues['status'] }))}
            options={STATUS_OPTIONS}
          />

          {isEdit && isArchived && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                padding: 16,
                borderRadius: 'var(--radius-lg)',
                background: 'var(--color-info-subtle)',
                border: '1px solid var(--color-primary-border)',
              }}
            >
              <div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-heading)' }}>
                  This course is archived
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Restore it to make it active again.</div>
              </div>
              <Button variant="secondary" size="sm" icon="circle-check-big" onClick={onUnarchive} disabled={saving}>
                Unarchive
              </Button>
            </div>
          )}

          {isEdit && !isArchived && (
            <div
              style={{
                padding: 16,
                borderRadius: 'var(--radius-lg)',
                background: 'var(--color-danger-subtle)',
                border: '1px solid rgba(239,68,68,0.35)',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-danger)' }}>
                <Icon name="triangle-alert" size={16} />
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>Danger zone</span>
              </div>
              <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-muted)', lineHeight: 'var(--leading-normal)' }}>
                Archiving hides this course from learners and the active catalog. It can be restored later from the
                Archived tab.
              </p>
              <div>
                <Button variant="danger" size="sm" icon="lock" onClick={() => setConfirmingArchive(true)} disabled={saving}>
                  Archive course
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {confirmingArchive && (
        <ArchiveConfirmDialog
          courseTitle={values.title || course?.title || 'this course'}
          onCancel={() => setConfirmingArchive(false)}
          onConfirm={() => {
            setConfirmingArchive(false);
            onArchive();
          }}
        />
      )}
    </>
  );
}

function ArchiveConfirmDialog({
  courseTitle,
  onCancel,
  onConfirm,
}: {
  courseTitle: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      title="Archive course?"
      onClose={onCancel}
      width={440}
      footer={
        <>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Archive course
          </Button>
        </>
      }
    >
      <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-body)', lineHeight: 'var(--leading-normal)' }}>
        Archived courses are hidden from learners and the active catalog. You can unarchive{' '}
        <strong>{courseTitle}</strong> later from the Archived tab.
      </p>
    </Modal>
  );
}
