import { useState, type ChangeEvent, type MouseEvent } from 'react';
import { Button } from '../design-system/Button';
import { Input } from '../design-system/Input';
import { Checkbox } from '../design-system/Checkbox';

type View = 'login' | 'register';

interface Errors {
  email?: string;
  password?: string;
  confirm?: string;
  terms?: string;
}

const validEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export function AuthPage() {
  const [view, setView] = useState<View>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const isLogin = view === 'login';
  const isRegister = view === 'register';

  const onEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setErrors((prev) => ({ ...prev, email: undefined }));
  };
  const onPasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setErrors((prev) => ({ ...prev, password: undefined }));
  };
  const onConfirmChange = (e: ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    setErrors((prev) => ({ ...prev, confirm: undefined }));
  };
  const onRememberChange = (e: ChangeEvent<HTMLInputElement>) => setRemember(e.target.checked);
  const onAgreeChange = (e: ChangeEvent<HTMLInputElement>) => {
    setAgreed(e.target.checked);
    setErrors((prev) => ({ ...prev, terms: undefined }));
  };

  const onSwitchToRegister = (e: MouseEvent) => {
    e.preventDefault();
    setView('register');
    setErrors({});
  };
  const onSwitchToLogin = (e: MouseEvent) => {
    e.preventDefault();
    setView('login');
    setErrors({});
  };
  const onForgotClick = (e: MouseEvent) => e.preventDefault();

  const onSubmit = () => {
    const nextErrors: Errors = {};
    if (!validEmail(email)) nextErrors.email = 'Enter a valid email address';
    if (password.length < 8) nextErrors.password = 'Must be at least 8 characters';
    if (isRegister) {
      if (confirmPassword !== password) nextErrors.confirm = "Passwords don't match";
      if (!agreed) nextErrors.terms = 'You need to agree to continue before creating an account';
    }
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    setSubmitting(true);
    setTimeout(() => setSubmitting(false), 900);
  };

  const passwordHint = isRegister && !errors.password ? 'At least 8 characters' : undefined;
  const submitLabel = isLogin ? 'Sign in' : 'Create account';

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--surface-page)',
        fontFamily: 'var(--font-ui)',
        padding: 24,
      }}
    >
      <div
        style={{
          width: 840,
          maxWidth: '100%',
          display: 'flex',
          background: '#fff',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--border-default)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: 340,
            flex: 'none',
            background: 'linear-gradient(135deg,var(--color-primary),var(--color-accent))',
            padding: 40,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            color: '#fff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
              }}
            >
              L
            </div>
            <span style={{ fontWeight: 800, fontSize: 'var(--text-xl)' }}>LearnFlow</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, margin: 0, lineHeight: 1.3 }}>
              Learn at your own pace, on your own terms.
            </h2>
            <p style={{ fontSize: 'var(--text-sm)', opacity: 0.9, margin: 0, lineHeight: 1.6 }}>
              Join thousands of learners building real skills with structured courses, quizzes, and progress tracking.
            </p>
          </div>
          <p style={{ fontSize: 'var(--text-sm)', opacity: 0.75, margin: 0 }}>Trusted by learners worldwide.</p>
        </div>

        <div style={{ flex: 1, padding: 36 }}>
          {isLogin && (
            <>
              <h1
                style={{
                  fontSize: 'var(--text-2xl)',
                  fontWeight: 700,
                  color: 'var(--text-heading)',
                  margin: '0 0 6px',
                  textAlign: 'center',
                }}
              >
                Welcome back
              </h1>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', textAlign: 'center', margin: '0 0 28px' }}>
                Sign in to continue your learning.
              </p>
            </>
          )}
          {isRegister && (
            <>
              <h1
                style={{
                  fontSize: 'var(--text-2xl)',
                  fontWeight: 700,
                  color: 'var(--text-heading)',
                  margin: '0 0 6px',
                  textAlign: 'center',
                }}
              >
                Create an account
              </h1>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', textAlign: 'center', margin: '0 0 28px' }}>
                Start your first course today.
              </p>
            </>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input
              label="Email"
              type="email"
              icon="mail"
              placeholder="you@example.com"
              value={email}
              onChange={onEmailChange}
              error={errors.email}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={onPasswordChange}
              error={errors.password}
              hint={passwordHint}
            />

            {isRegister && (
              <>
                <Input
                  label="Confirm password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={onConfirmChange}
                  error={errors.confirm}
                />

                <Checkbox label="I agree to the Terms and Privacy Policy" checked={agreed} onChange={onAgreeChange} />
                {errors.terms && (
                  <div style={{ fontSize: 'var(--text-sm)', color: '#B91C1C', marginTop: -10 }}>{errors.terms}</div>
                )}
              </>
            )}

            {isLogin && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Checkbox label="Remember me" checked={remember} onChange={onRememberChange} />
                <a href="#" onClick={onForgotClick}>
                  Forgot password?
                </a>
              </div>
            )}

            <Button style={{ width: '100%' }} onClick={onSubmit} loading={submitting}>
              {submitLabel}
            </Button>
          </div>

          <p style={{ textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: 22 }}>
            {isLogin && (
              <>
                New to LearnFlow? <a href="#" onClick={onSwitchToRegister}>Create an account</a>
              </>
            )}
            {isRegister && (
              <>
                Already have an account? <a href="#" onClick={onSwitchToLogin}>Sign in</a>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
