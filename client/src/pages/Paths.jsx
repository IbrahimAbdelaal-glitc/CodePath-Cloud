import { useMemo, useState } from 'react';
import { SearchX, Search } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext.jsx';
import { useFetch } from '../lib/useFetch.js';
import PathCard from '../components/PathCard.jsx';
import RoadmapFeature from '../components/RoadmapFeature.jsx';
import { EmptyState, ErrorState, PageSkeleton } from '../components/States.jsx';

const levels = ['ALL', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

export default function Paths() {
  const { t } = useI18n();
  const { data, error, loading, reload } = useFetch('/api/roadmaps');
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState('ALL');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data?.roadmaps || []).filter(
      (r) =>
        (level === 'ALL' || r.difficulty === level) &&
        (!q || [r.title, r.description, r.category, r.summary].some((f) => f?.toLowerCase().includes(q))),
    );
  }, [data, query, level]);

  // Staged roadmaps are featured above the search; while searching or filtering they appear in the results instead
  const browsing = !query.trim() && level === 'ALL';
  const roadmaps = browsing ? (data?.roadmaps || []).filter((r) => r.stages) : [];
  const cards = filtered.filter((r) => !roadmaps.includes(r));

  if (loading) return <PageSkeleton />;

  return (
    <div className="container page">
      <header className="page-head">
        <h1>{t('paths.title')}</h1>
        <p>{t('paths.lead')}</p>
      </header>

      {roadmaps.map((r) => (
        <RoadmapFeature key={r.id} path={r} />
      ))}

      <div className="toolbar" role="search">
        <label className="search">
          <Search size={18} aria-hidden="true" />
          <span className="sr-only">{t('paths.search')}</span>
          <input
            type="search"
            className="input"
            placeholder={t('paths.searchPlaceholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="segmented" role="group" aria-label={t('paths.filterLevel')}>
          {levels.map((l) => (
            <button key={l} type="button" aria-pressed={level === l} onClick={() => setLevel(l)}>
              {l === 'ALL' ? t('common.all') : t(`difficulty.${l}`)}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={SearchX} title={t('paths.emptyTitle')}>
          {t('paths.emptyText')}
        </EmptyState>
      ) : (
        <div className="grid grid--cards">
          {cards.map((p) => (
            <PathCard key={p.id} path={p} />
          ))}
        </div>
      )}
    </div>
  );
}
