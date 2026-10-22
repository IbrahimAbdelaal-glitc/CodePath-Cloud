import { useState } from 'react';
import { Save } from 'lucide-react';
import { api, tokenStore } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useI18n } from '../i18n/I18nContext.jsx';
import { Alert } from '../components/States.jsx';

export default function Profile() {
  const { user, setUser } = useAuth();
  const { t, fmt } = useI18n();
  const toast = useToast();
  const [name, setName] = useState(user.name);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(null);

  const save = async (kind, body) => {
    setSaving(kind);
    setError(null);
    try {
      const d = await api('/api/auth/me', { method: 'PATCH', body });
      // A password change revokes old sessions; the server returns a fresh token for this one
      if (d.token) tokenStore.set(d.token);
      setUser(d.user);
      if (kind === 'password') setPw({ currentPassword: '', newPassword: '' });
      toast.success(t('profile.saved'));
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="container page page--narrow">
      <header className="page-head">
        <h1>{t('profile.title')}</h1>
        <p>
          <bdi dir="ltr">{user.email}</bdi> · {t(`role.${user.role}`)} · {t('profile.memberSince', { date: fmt.date(user.createdAt) })}
        </p>
      </header>
      {error && <Alert>{error}</Alert>}

      <form
        className="panel form-stack"
        onSubmit={(e) => {
          e.preventDefault();
          save('name', { name });
        }}
      >
        <h2>{t('profile.info')}</h2>
        <div className="field">
          <label htmlFor="pname">{t('auth.name')}</label>
          <input id="pname" className="input" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <button className="btn btn--primary" disabled={saving === 'name' || name.trim() === user.name}>
          <Save size={16} aria-hidden="true" /> {t('common.save')}
        </button>
      </form>

      <form
        className="panel form-stack"
        onSubmit={(e) => {
          e.preventDefault();
          save('password', pw);
        }}
      >
        <h2>{t('profile.changePassword')}</h2>
        <div className="field">
          <label htmlFor="cur">{t('profile.currentPassword')}</label>
          <input
            id="cur"
            type="password"
            className="input"
            dir="ltr"
            autoComplete="current-password"
            value={pw.currentPassword}
            onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="new">{t('profile.newPassword')}</label>
          <input
            id="new"
            type="password"
            className="input"
            dir="ltr"
            autoComplete="new-password"
            value={pw.newPassword}
            onChange={(e) => setPw({ ...pw, newPassword: e.target.value })}
            required
            aria-describedby="new-hint"
          />
          <span className="hint" id="new-hint">
            {t('auth.passwordHint')}
          </span>
        </div>
        <button className="btn btn--primary" disabled={saving === 'password' || !pw.currentPassword || !pw.newPassword}>
          <Save size={16} aria-hidden="true" /> {t('profile.updatePassword')}
        </button>
      </form>
    </div>
  );
}
