import { Link } from 'react-router-dom';
import { ArrowRight, Route } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext.jsx';
import { ProgressBar } from './Badges.jsx';
import RoadmapDownload from './RoadmapDownload.jsx';

// A staged roadmap on the paths page: its stages as a short connected route, with links to open or download it
export default function RoadmapFeature({ path }) {
  const { t, fmt } = useI18n();
  return (
    <section className="roadmap-feature panel" aria-labelledby={`feature-${path.id}`}>
      <p className="eyebrow">
        <Route size={16} aria-hidden="true" /> {t('paths.roadmapEyebrow')}
      </p>
      <h2 id={`feature-${path.id}`}>
        <Link to={`/paths/${path.slug}`}>{path.title}</Link>
      </h2>
      <p className="lead">{path.summary || path.description}</p>
      <ol className="mini-route">
        {path.stages.map((s, i) => (
          <li key={s.title} className="mini-route__stop">
            <span className="mini-route__node" aria-hidden="true">
              {i + 1}
            </span>
            <span className="mini-route__text">
              <strong>{s.title.replace(/^Stage \d+:\s*/, '')}</strong>
              {s.time && <span className="small muted">{s.time.split(/[:,]/)[0]}</span>}
            </span>
          </li>
        ))}
      </ol>
      {path.progress && (
        <ProgressBar value={path.progress.percent} size="sm" label={t('paths.lessonsDone', { done: fmt.number(path.progress.completed), total: fmt.number(path.progress.total) })} />
      )}
      <div className="roadmap-feature__actions">
        <Link to={`/paths/${path.slug}`} className="btn btn--accent">
          {t('paths.openRoadmap')} <ArrowRight size={16} aria-hidden="true" />
        </Link>
        <RoadmapDownload slug={path.slug} print={false} />
      </div>
    </section>
  );
}
