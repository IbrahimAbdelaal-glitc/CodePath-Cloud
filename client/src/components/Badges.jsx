import { useI18n } from '../i18n/I18nContext.jsx';

export function DifficultyBadge({ level }) {
  const { t } = useI18n();
  if (!level) return null;
  return (
    <span className={`badge badge--${level.toLowerCase()}`}>
      <span className="badge-dots" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      {t(`difficulty.${level}`)}
    </span>
  );
}

export function ProgressBar({ value = 0, label, size = 'md' }) {
  const { t } = useI18n();
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      className={`progress progress--${size}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-label={label || t('common.progress')}
    >
      <span className="progress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function ProgressRing({ value = 0, size = 120, stroke = 10, label }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="ring" style={{ width: size, height: size }} role="img" aria-label={label || `${pct}%`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--ring-track)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--brand-2)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (pct / 100) * c}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="ring-value"
        />
      </svg>
      <span className="ring-label" dir="ltr">
        {pct}%
      </span>
    </div>
  );
}
