import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, KeyRound, LinkIcon, MailCheck, Send } from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useI18n } from '../i18n/I18nContext.jsx';
import { Alert, ErrorState, Loading } from '../components/States.jsx';
import Logo from '../components/Logo.jsx';
import { PasswordField, fieldErrors } from './Auth.jsx';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Same rules as the server: at least 8 characters with letters and numbers
function validatePasswords(t, password, confirmPassword) {
  const errors = {};
  if (password.length < 8) errors.password = t('reset.errTooShort');
  else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) errors.password = t('reset.errLettersNumbers');
  if (!confirmPassword) errors.confirmPassword = t('reset.errConfirmRequired');
  else if (password !== confirmPassword) errors.confirmPassword = t('reset.errMismatch');
  return errors;
}

export function ForgotPassword() {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!EMAIL_RE.test(email.trim())) {
      setFieldError(t('reset.errEmail'));
      return;
    }
    setFieldError(null);
    setSubmitting(true);
    try {
      await api('/api/auth/forgot-password', { method: 'POST', body: { email: email.trim() } });
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="auth-page">
        <div className="auth-card auth-card--status" role="status">
          <MailCheck size={40} className="status-icon status-icon--ok" aria-hidden="true" />
          <h1>{t('reset.sentTitle')}</h1>
          <p className="muted">{t('reset.sentText', { email: email.trim() })}</p>
          <p className="muted small">{t('reset.sentHint')}</p>
          <Link to="/login" className="btn btn--primary btn--block">
            <ArrowLeft size={18} aria-hidden="true" /> {t('reset.backToSignIn')}
          </Link>
          <button type="button" className="btn btn--ghost btn--block" onClick={() => setSent(false)}>
            {t('reset.tryOtherEmail')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit} noValidate>
        <Logo size={44} />
        <h1>{t('reset.forgotTitle')}</h1>
        <p className="muted">{t('reset.forgotLead')}</p>
        {error && <Alert>{error}</Alert>}
        <div className="field">
          <label htmlFor="reset-email">{t('auth.email')}</label>
          <input
            id="reset-email"
            className={`input ${fieldError ? 'is-invalid' : ''}`}
            type="email"
            autoComplete="email"
            required
            value={email}
            aria-invalid={Boolean(fieldError)}
            aria-describedby={fieldError ? 'reset-email-err' : undefined}
            onChange={(e) => setEmail(e.target.value)}
          />
          {fieldError && (
            <span className="field-error" id="reset-email-err">
              {fieldError}
            </span>
          )}
        </div>
        <button className="btn btn--primary btn--block" disabled={submitting}>
          <Send size={18} aria-hidden="true" />
          {submitting ? t('reset.sending') : t('reset.sendLink')}
        </button>
        <p className="auth-switch">
          <Link to="/login">{t('reset.backToSignIn')}</Link>
        </p>
      </form>
    </div>
  );
}

function readTokenFromHash() {
  const params = new URLSearchParams(window.location.hash.slice(1));
  return params.get('token') || '';
}

export function ResetPassword() {
  const { t } = useI18n();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  // The token arrives in the URL fragment; read it once, then remove it from the address bar and history
  const [token, setToken] = useState(readTokenFromHash);
  const [status, setStatus] = useState(token ? 'checking' : 'invalid');
  const [checkError, setCheckError] = useState(null);
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const clearHash = () => {
      if (window.location.hash) window.history.replaceState(null, '', window.location.pathname);
    };
    clearHash();
    // A link opened while this page is already showing only changes the hash
    const onHashChange = () => {
      const next = readTokenFromHash();
      clearHash();
      if (next) {
        setForm({ password: '', confirmPassword: '' });
        setErrors({});
        setFormError(null);
        setToken(next);
        setAttempt((a) => a + 1);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;
    setStatus('checking');
    setCheckError(null);
    api('/api/auth/reset-password/verify', { method: 'POST', body: { token } })
      .then(() => !cancelled && setStatus('ready'))
      .catch((err) => {
        if (cancelled) return;
        if (err.status === 400) setStatus('invalid');
        else {
          setCheckError(err);
          setStatus('error');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token, attempt]);

  const submit = async (e) => {
    e.preventDefault();
    setFormError(null);
    const clientErrors = validatePasswords(t, form.password, form.confirmPassword);
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length) return;

    setSubmitting(true);
    try {
      await api('/api/auth/reset-password', { method: 'POST', body: { token, ...form } });
      // Every existing session was revoked on the server, including one in this browser
      if (user) logout();
      setStatus('done');
    } catch (err) {
      if (err.code === 'RESET_TOKEN_INVALID') setStatus('invalid');
      else {
        const serverErrors = fieldErrors(err);
        if (Object.keys(serverErrors).length) setErrors(serverErrors);
        else setFormError(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'checking') {
    return (
      <div className="auth-page">
        <div className="auth-card auth-card--status">
          <Loading label={t('reset.checking')} />
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <ErrorState error={checkError} onRetry={() => setAttempt((a) => a + 1)} />
        </div>
      </div>
    );
  }

  if (status === 'invalid') {
    return (
      <div className="auth-page">
        <div className="auth-card auth-card--status" role="alert">
          <LinkIcon size={40} className="status-icon status-icon--bad" aria-hidden="true" />
          <h1>{t('reset.invalidTitle')}</h1>
          <p className="muted">{t('reset.invalidText')}</p>
          <Link to="/forgot-password" className="btn btn--primary btn--block">
            {t('reset.requestNew')}
          </Link>
          <Link to="/login" className="btn btn--ghost btn--block">
            {t('reset.backToSignIn')}
          </Link>
        </div>
      </div>
    );
  }

  if (status === 'done') {
    return (
      <div className="auth-page">
        <div className="auth-card auth-card--status" role="status">
          <CheckCircle2 size={40} className="status-icon status-icon--ok" aria-hidden="true" />
          <h1>{t('reset.doneTitle')}</h1>
          <p className="muted">{t('reset.doneText')}</p>
          <button
            type="button"
            className="btn btn--primary btn--block"
            onClick={() => navigate('/login', { replace: true, state: { passwordReset: true } })}
          >
            {t('auth.login')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit} noValidate>
        <KeyRound size={40} className="status-icon status-icon--ok" aria-hidden="true" />
        <h1>{t('reset.newTitle')}</h1>
        <p className="muted">{t('reset.newLead')}</p>
        {formError && <Alert>{formError}</Alert>}
        <div className="field">
          <label htmlFor="new-password">{t('reset.newPassword')}</label>
          <PasswordField
            id="new-password"
            value={form.password}
            autoComplete="new-password"
            error={errors.password}
            describedBy="new-password-hint"
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <span className={errors.password ? 'field-error' : 'hint'} id="new-password-hint">
            {errors.password || t('auth.passwordHint')}
          </span>
        </div>
        <div className="field">
          <label htmlFor="confirm-password">{t('reset.confirmPassword')}</label>
          <PasswordField
            id="confirm-password"
            value={form.confirmPassword}
            autoComplete="new-password"
            error={errors.confirmPassword}
            describedBy={errors.confirmPassword ? 'confirm-password-err' : undefined}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
          />
          {errors.confirmPassword && (
            <span className="field-error" id="confirm-password-err">
              {errors.confirmPassword}
            </span>
          )}
        </div>
        <button className="btn btn--primary btn--block" disabled={submitting}>
          <KeyRound size={18} aria-hidden="true" />
          {submitting ? t('reset.saving') : t('reset.save')}
        </button>
      </form>
    </div>
  );
}
