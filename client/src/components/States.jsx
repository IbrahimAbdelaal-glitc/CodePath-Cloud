import { AlertTriangle, Inbox, RotateCcw } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext.jsx';

export function Loading({ label, inline = false }) {
  const { t } = useI18n();
  return (
    <div className={inline ? 'loading loading--inline' : 'loading'} role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span>{label || t('states.loading')}</span>
    </div>
  );
}

export function PageSkeleton() {
  const { t } = useI18n();
  return (
    <div className="container page" aria-busy="true" aria-label={t('states.loadingPage')}>
      <div className="skeleton skeleton--title" />
      <div className="skeleton skeleton--line" />
      <div className="skeleton skeleton--line skeleton--short" />
      <div className="skeleton-grid">
        <div className="skeleton skeleton--card" />
        <div className="skeleton skeleton--card" />
        <div className="skeleton skeleton--card" />
      </div>
    </div>
  );
}

export function ErrorState({ error, onRetry, title }) {
  const { t } = useI18n();
  return (
    <div className="state state--error" role="alert">
      <AlertTriangle size={32} aria-hidden="true" />
      <h2>{title || t('states.errorTitle')}</h2>
      <p>{error?.message || t('states.unexpected')}</p>
      {onRetry && (
        <button className="btn btn--secondary" onClick={onRetry}>
          <RotateCcw size={16} aria-hidden="true" />
          {t('common.retry')}
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, children, action }) {
  return (
    <div className="state state--empty">
      <Icon size={34} aria-hidden="true" />
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

export function Alert({ type = 'error', children }) {
  return (
    <div className={`alert alert--${type}`} role={type === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}
