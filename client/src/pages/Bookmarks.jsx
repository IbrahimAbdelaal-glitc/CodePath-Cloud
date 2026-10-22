import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookmarkX, BookMarked, CheckCircle2, Clock } from 'lucide-react';
import { api } from '../api/client.js';
import { useI18n } from '../i18n/I18nContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useFetch } from '../lib/useFetch.js';
import { DifficultyBadge } from '../components/Badges.jsx';
import { EmptyState, ErrorState, PageSkeleton } from '../components/States.jsx';

export default function Bookmarks() {
  const { t, fmt } = useI18n();
  const toast = useToast();
  const { data, error, loading, reload, mutate } = useFetch('/api/me/bookmarks');
  const [removing, setRemoving] = useState(null);

  if (loading) return <PageSkeleton />;

  const remove = async (id) => {
    setRemoving(id);
    try {
      await api(`/api/lessons/${id}/bookmark`, { method: 'DELETE' });
      mutate((d) => ({ bookmarks: d.bookmarks.filter((b) => b.id !== id) }));
      toast.success(t('lesson.bookmarkRemoved'));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="container page">
      <header className="page-head">
        <h1>{t('bookmarks.title')}</h1>
        <p>{t('bookmarks.lead')}</p>
      </header>
      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : data.bookmarks.length === 0 ? (
        <EmptyState
          icon={BookMarked}
          title={t('bookmarks.emptyTitle')}
          action={
            <Link to="/paths" className="btn btn--primary">
              {t('home.ctaPaths')}
            </Link>
          }
        >
          {t('bookmarks.emptyText')}
        </EmptyState>
      ) : (
        <ul className="bookmark-list">
          {data.bookmarks.map((b) => (
            <li key={b.id} className="bookmark">
              <div className="bookmark__body">
                <span className="muted small">
                  {b.roadmapTitle} · {b.moduleTitle}
                </span>
                <h2>
                  <Link to={`/lessons/${b.id}`}>{b.title}</Link>
                </h2>
                {b.summary && (
                  <p className="muted">
                    {b.summary}
                  </p>
                )}
                <div className="bookmark__meta">
                  <DifficultyBadge level={b.difficulty} />
                  <span>
                    <Clock size={14} aria-hidden="true" /> {fmt.duration(b.estimatedMinutes)}
                  </span>
                  {b.isCompleted && (
                    <span className="success-text">
                      <CheckCircle2 size={14} aria-hidden="true" /> {t('path.completed')}
                    </span>
                  )}
                  <span className="muted">{t('bookmarks.savedAt', { when: fmt.timeAgo(b.createdAt) })}</span>
                </div>
              </div>
              <button
                className="btn btn--ghost btn--sm"
                onClick={() => remove(b.id)}
                disabled={removing === b.id}
                aria-label={t('bookmarks.removeLabel', { title: b.title })}
              >
                <BookmarkX size={16} aria-hidden="true" />
                {t('bookmarks.remove')}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
