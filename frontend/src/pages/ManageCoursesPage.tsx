import { useEffect, useState } from 'react';
import { Button } from '../design-system/Button';
import { Icon } from '../design-system/Icon';
import { Badge, type BadgeTone } from '../design-system/Badge';
import { CourseFormModal, type CourseFormValues } from './CourseFormModal';
import { formatUpdatedAt, type Course, type CourseStatus } from '../lib/courses';
import { archiveCourse, createCourse, listCourses, unarchiveCourse, updateCourse } from '../lib/coursesApi';
import type { ApiError } from '../lib/api';
import { loadTheme, applyTheme, type Theme } from '../lib/theme';

const STATUS_LABEL: Record<CourseStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  archived: 'Archived',
};

const STATUS_TONE: Record<CourseStatus, BadgeTone> = {
  draft: 'warning',
  active: 'success',
  archived: 'neutral',
};

type Tab = 'active' | 'archived';

interface ManageCoursesPageProps {
  userLabel: string;
  accessToken: string;
  onLogout: () => void;
}

const NAV_ITEMS = [
  { icon: 'home', label: 'Dashboard' },
  { icon: 'layout-grid', label: 'Catalog' },
  { icon: 'book-open', label: 'My course' },
  { icon: 'settings', label: 'Manage courses' },
] as const;

export function ManageCoursesPage({ userLabel, accessToken, onLogout }: ManageCoursesPageProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [tab, setTab] = useState<Tab>('active');
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string>();
  const [editingCourse, setEditingCourse] = useState<Course | undefined>(undefined);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string>();
  const [theme, setTheme] = useState<Theme>(() => {
    const t = loadTheme();
    applyTheme(t);
    return t;
  });

  const loadCourses = async (targetTab: Tab) => {
    setLoading(true);
    setListError(undefined);
    try {
      const fetched = await listCourses(targetTab, accessToken);
      setCourses(fetched);
    } catch (err) {
      setListError((err as ApiError).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const openCreate = () => {
    setEditingCourse(undefined);
    setFormError(undefined);
    setFormOpen(true);
  };
  const openEdit = (course: Course) => {
    setEditingCourse(course);
    setFormError(undefined);
    setFormOpen(true);
  };
  const closeForm = () => setFormOpen(false);

  const onToggleTheme = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
  };

  const onSaveCourse = async (values: CourseFormValues) => {
    setSaving(true);
    setFormError(undefined);
    try {
      if (editingCourse) {
        await updateCourse(editingCourse.id, values, accessToken);
      } else {
        await createCourse(values, accessToken);
      }
      setFormOpen(false);
      await loadCourses(tab);
    } catch (err) {
      setFormError((err as ApiError).message);
    } finally {
      setSaving(false);
    }
  };

  const onArchive = async () => {
    if (!editingCourse) return;
    setSaving(true);
    setFormError(undefined);
    try {
      await archiveCourse(editingCourse.id, accessToken);
      setFormOpen(false);
      await loadCourses(tab);
    } catch (err) {
      setFormError((err as ApiError).message);
    } finally {
      setSaving(false);
    }
  };

  const onUnarchive = async () => {
    if (!editingCourse) return;
    setSaving(true);
    setFormError(undefined);
    try {
      await unarchiveCourse(editingCourse.id, accessToken);
      setFormOpen(false);
      await loadCourses(tab);
    } catch (err) {
      setFormError((err as ApiError).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--surface-page)', fontFamily: 'var(--font-ui)' }}>
      <aside
        style={{
          width: 240,
          flex: 'none',
          background: 'var(--surface-card)',
          borderRight: '1px solid var(--border-default)',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px', marginBottom: 28 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg,var(--color-primary),var(--color-accent))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon name="book-open" size={17} color="#fff" />
          </div>
          <span style={{ fontWeight: 'var(--weight-extrabold)', fontSize: 'var(--text-lg)', color: 'var(--text-heading)' }}>
            LearnFlow
          </span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
          {NAV_ITEMS.map((item) => {
            const active = item.label === 'Manage courses';
            return (
              <div
                key={item.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: active ? 'var(--weight-semibold)' : 'var(--weight-medium)',
                  color: active ? 'var(--color-primary)' : 'var(--text-muted)',
                  background: active ? 'var(--color-primary-subtle)' : 'transparent',
                  cursor: active ? 'default' : 'not-allowed',
                }}
                title={active ? undefined : 'Coming soon'}
              >
                <Icon name={item.icon} size={17} />
                {item.label}
              </div>
            );
          })}
        </nav>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            paddingTop: 16,
            marginTop: 16,
            borderTop: '1px solid var(--border-default)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-pill)',
                background: 'var(--color-primary)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--weight-semibold)',
                flexShrink: 0,
              }}
            >
              {userLabel.slice(0, 1).toUpperCase()}
            </div>
            <span
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--text-body)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {userLabel}
            </span>
          </div>
          <button
            type="button"
            onClick={onLogout}
            aria-label="Log out"
            title="Log out"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              padding: 6,
              borderRadius: 'var(--radius-sm)',
              flexShrink: 0,
            }}
          >
            <Icon name="log-out" size={16} />
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: '40px 48px' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              background: 'var(--surface-sunken)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-pill)',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              padding: 8,
            }}
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, gap: 24 }}>
          <div>
            <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-extrabold)', color: 'var(--text-heading)', margin: '0 0 6px' }}>
              Manage courses
            </h1>
            <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-muted)', margin: 0 }}>
              Create, edit, and archive courses in the catalog.
            </p>
          </div>
          <Button icon="plus" onClick={openCreate} style={{ flexShrink: 0 }}>
            New course
          </Button>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid var(--border-default)',
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', gap: 4 }}>
            {(['active', 'archived'] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: `2px solid ${tab === t ? 'var(--color-primary)' : 'transparent'}`,
                  padding: '10px 6px',
                  marginRight: 20,
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--weight-semibold)',
                  color: tab === t ? 'var(--color-primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                {t === 'active' ? 'Active' : 'Archived'}
              </button>
            ))}
          </div>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', paddingBottom: 10 }}>
            {loading ? 'Loading…' : `${courses.length} course${courses.length === 1 ? '' : 's'}`}
          </span>
        </div>

        {listError ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              padding: '64px 24px',
              border: '1px solid var(--color-danger)',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--color-danger-subtle)',
              color: 'var(--color-danger)',
            }}
          >
            <Icon name="triangle-alert" size={28} color="var(--color-danger)" />
            <p style={{ margin: 0, fontSize: 'var(--text-base)' }}>{listError}</p>
            <Button variant="secondary" onClick={() => loadCourses(tab)}>
              Retry
            </Button>
          </div>
        ) : !loading && courses.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              padding: '64px 24px',
              border: '1px dashed var(--border-strong)',
              borderRadius: 'var(--radius-lg)',
              color: 'var(--text-muted)',
            }}
          >
            <Icon name="layout-grid" size={28} color="var(--text-muted)" />
            <p style={{ margin: 0, fontSize: 'var(--text-base)' }}>
              {tab === 'archived' ? 'No archived courses.' : 'No courses yet.'}
            </p>
            {tab === 'active' && (
              <Button variant="secondary" icon="plus" onClick={openCreate}>
                Create your first course
              </Button>
            )}
          </div>
        ) : loading ? (
          <div style={{ padding: '64px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading courses…
          </div>
        ) : (
          <div style={{ border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--surface-sunken)' }}>
                  {['Title', 'Category', 'Level', 'Status', 'Last updated', ''].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: 'left',
                        padding: '12px 20px',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 'var(--weight-bold)',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        color: 'var(--text-muted)',
                        borderBottom: '1px solid var(--border-default)',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course.id} style={{ borderBottom: '1px solid var(--border-default)' }}>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-heading)' }}>
                        {course.title}
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                        {course.durationHours ? `${course.durationHours}h · ` : ''}
                        {course.language}
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: 'var(--text-sm)', color: 'var(--text-body)' }}>{course.category}</td>
                    <td style={{ padding: '16px 20px', fontSize: 'var(--text-sm)', color: 'var(--text-body)', textTransform: 'capitalize' }}>
                      {course.level}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <Badge label={STATUS_LABEL[course.status]} tone={STATUS_TONE[course.status]} />
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                      {formatUpdatedAt(course.updatedAt)}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => openEdit(course)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--color-primary)',
                          fontSize: 'var(--text-sm)',
                          fontWeight: 'var(--weight-semibold)',
                          padding: 0,
                        }}
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {formOpen && (
        <CourseFormModal
          course={editingCourse}
          onClose={closeForm}
          onSave={onSaveCourse}
          onArchive={onArchive}
          onUnarchive={onUnarchive}
          saving={saving}
          serverError={formError}
        />
      )}
    </div>
  );
}
