import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BrainCircuit, Clock, Layers, Monitor, Server, Terminal } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext.jsx';
import { DifficultyBadge, ProgressBar } from './Badges.jsx';

const icons = { frontend: Monitor, 'dotnet-backend': Server, 'python-backend': Terminal, 'ai-fullstack': BrainCircuit };

export default function PathCard({ path }) {
  const { t, fmt, dir } = useI18n();
  const Icon = icons[path.slug] || Layers;
  const Arrow = dir === 'rtl' ? ArrowLeft : ArrowRight;
  return (
    <article className="path-card">
      <div className="path-card__top">
        <span className="path-card__icon" aria-hidden="true">
          <Icon size={24} />
        </span>
        <span className="path-card__category">
          {path.category}
        </span>
        {!path.isPublished && <span className="chip chip--draft">{t('paths.draft')}</span>}
      </div>
      <h3 className="path-card__title">
        <Link to={`/paths/${path.slug}`} className="stretched-link">
          {path.title}
        </Link>
      </h3>
      <p className="path-card__summary">
        {path.summary || path.description}
      </p>
      <div className="path-card__meta">
        <DifficultyBadge level={path.difficulty} />
        <span>
          <Layers size={15} aria-hidden="true" /> {fmt.count('modules', path.moduleCount)}
        </span>
        <span>
          <Clock size={15} aria-hidden="true" /> {fmt.duration(path.estimatedMinutes)}
        </span>
      </div>
      {path.progress && (
        <div className="path-card__progress">
          <ProgressBar value={path.progress.percent} label={t('paths.progressIn', { title: path.title })} size="sm" />
          <span>
            {t('paths.lessonsDone', { done: fmt.number(path.progress.completed), total: fmt.number(path.progress.total) })}
          </span>
        </div>
      )}
      <span className="path-card__cta" aria-hidden="true">
        {t('paths.explore')} <Arrow size={16} />
      </span>
    </article>
  );
}
