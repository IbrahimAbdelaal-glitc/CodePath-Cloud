import { Link } from 'react-router-dom';
import { Award, Download } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext.jsx';
import { useFetch } from '../lib/useFetch.js';
import { EmptyState, ErrorState, PageSkeleton } from '../components/States.jsx';

export default function Certificates() {
  const { t, fmt } = useI18n();
  const { data, error, loading, reload } = useFetch('/api/me/certificates');

  if (loading) return <PageSkeleton />;

  return (
    <div className="container page">
      <header className="page-head">
        <h1>{t('certificates.title')}</h1>
        <p>{t('certificates.lead')}</p>
      </header>
      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : data.certificates.length === 0 ? (
        <EmptyState
          icon={Award}
          title={t('certificates.emptyTitle')}
          action={
            <Link to="/paths" className="btn btn--primary">
              {t('home.ctaPaths')}
            </Link>
          }
        >
          {t('dashboard.certificatesEmpty')}
        </EmptyState>
      ) : (
        <ul className="bookmark-list">
          {data.certificates.map((c) => (
            <li key={c.id} className="bookmark">
              <div className="bookmark__body">
                <h2>
                  <Link to={`/certificates/${c.id}`}>{c.roadmapTitle}</Link>
                </h2>
                <div className="bookmark__meta">
                  <span className="muted">{t('dashboard.completedOn', { date: fmt.date(c.completedAt) })}</span>
                </div>
              </div>
              <div className="cert-list__actions">
                <Link to={`/certificates/${c.id}`} className="btn btn--secondary btn--sm">
                  {t('certificate.view')}
                </Link>
                <Link to={`/certificates/${c.id}?download=1`} className="btn btn--primary btn--sm">
                  <Download size={15} aria-hidden="true" />
                  {t('certificate.download')}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
