import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useI18n } from '../i18n/I18nContext.jsx';
import { Alert } from '../components/States.jsx';
import Logo from '../components/Logo.jsx';

export function PasswordField({ id, value, onChange, autoComplete, error, describedBy }) {
  const { t } = useI18n();
  const [show, setShow] = useState(false);
  return (
    <div className="input-group">
      <input
        id={id}
        className={`input ${error ? 'is-invalid' : ''}`}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        dir="ltr"
        required
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
      />
      <button
        type="button"
        className="icon-btn input-group__btn"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? t('auth.hidePassword') : t('auth.showPassword')}
        aria-pressed={show}
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

export function fieldErrors(err) {
  const map = {};
  for (const d of err?.details || []) if (d.field && !map[d.field]) map[d.field] = d.message;
  return map;
}

export function Login() {
  const { login, user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const from = location.state?.from || '/dashboard';

  if (user) return <Navigate to={from} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(form.email, form.password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit} noValidate>
        <Logo size={44} />
        <h1>{t('auth.loginTitle')}</h1>
        <p className="muted">{t('auth.loginLead')}</p>
        {location.state?.passwordReset && !error && <Alert type="success">{t('reset.signInNow')}</Alert>}
        {error && <Alert>{error.message}</Alert>}
        <div className="field">
          <label htmlFor="email">{t('auth.email')}</label>
          <input
            id="email"
            className="input"
            type="email"
            dir="ltr"
            autoComplete="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div className="field">
          <div className="field__row">
            <label htmlFor="password">{t('auth.password')}</label>
            <Link to="/forgot-password" className="small">
              {t('reset.forgotLink')}
            </Link>
          </div>
          <PasswordField
            id="password"
            value={form.password}
            autoComplete="current-password"
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>
        <button className="btn btn--primary btn--block" disabled={submitting}>
          <LogIn size={18} aria-hidden="true" />
          {submitting ? t('auth.loggingIn') : t('auth.login')}
        </button>
        <p className="auth-switch">
          {t('auth.noAccount')} <Link to="/register">{t('auth.createAccount')}</Link>
        </p>
      </form>
    </div>
  );
}

export function Register() {
  const { register, user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;
  const errs = fieldErrors(error);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await register(form.name, form.email, form.password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit} noValidate>
        <Logo size={44} />
        <h1>{t('auth.registerTitle')}</h1>
        <p className="muted">{t('auth.registerLead')}</p>
        {error && !Object.keys(errs).length && <Alert>{error.message}</Alert>}
        <div className="field">
          <label htmlFor="name">{t('auth.name')}</label>
          <input
            id="name"
            className={`input ${errs.name ? 'is-invalid' : ''}`}
            autoComplete="name"
            required
            value={form.name}
            aria-invalid={Boolean(errs.name)}
            aria-describedby={errs.name ? 'name-err' : undefined}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          {errs.name && (
            <span className="field-error" id="name-err">
              {errs.name}
            </span>
          )}
        </div>
        <div className="field">
          <label htmlFor="email">{t('auth.email')}</label>
          <input
            id="email"
            className={`input ${errs.email ? 'is-invalid' : ''}`}
            type="email"
            dir="ltr"
            autoComplete="email"
            required
            value={form.email}
            aria-invalid={Boolean(errs.email)}
            aria-describedby={errs.email ? 'email-err' : undefined}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          {errs.email && (
            <span className="field-error" id="email-err">
              {errs.email}
            </span>
          )}
        </div>
        <div className="field">
          <label htmlFor="password">{t('auth.password')}</label>
          <PasswordField
            id="password"
            value={form.password}
            autoComplete="new-password"
            error={errs.password}
            describedBy="password-hint"
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <span className={errs.password ? 'field-error' : 'hint'} id="password-hint">
            {errs.password || t('auth.passwordHint')}
          </span>
        </div>
        <button className="btn btn--primary btn--block" disabled={submitting}>
          <UserPlus size={18} aria-hidden="true" />
          {submitting ? t('auth.creating') : t('auth.createAccount')}
        </button>
        <p className="auth-switch">
          {t('auth.haveAccount')} <Link to="/login">{t('auth.login')}</Link>
        </p>
      </form>
    </div>
  );
}
