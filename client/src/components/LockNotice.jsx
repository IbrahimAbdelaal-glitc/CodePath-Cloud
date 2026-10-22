import { Link } from 'react-router-dom';
import { BookOpen, Lock, Target } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext.jsx';

// Explains why a module is locked and what unlocks it (data comes from the server)
export default function LockNotice({ access, compact = false, roadmapSlug }) {
  const { t, fmt } = useI18n();
  if (!access) return null;
  const { incompleteModules = [], reviewTopics = [] } = access;

  return (
    <div className={`lock-notice ${compact ? 'lock-notice--compact' : ''}`} role="note">
      <div className="lock-notice__title">
        <Lock size={18} aria-hidden="true" />
        <strong>{t('lock.title')}</strong>
      </div>
      <p className="lock-notice__lead">{t('lock.lead')}</p>
      <ul className="lock-notice__list">
        {incompleteModules.map((m) => (
          <li key={m.id}>
            <BookOpen size={16} aria-hidden="true" />
            <span>
              {t('lock.completeModule', { title: m.title, done: fmt.number(m.completed), total: fmt.number(m.total) })}
              {roadmapSlug && !compact && (
                <>
                  {' '}
                  <Link to={`/paths/${roadmapSlug}#module-${m.id}`}>{t('lock.goToModule')}</Link>
                </>
              )}
            </span>
          </li>
        ))}
        {reviewTopics.map((topic) => (
          <li key={topic.tag}>
            <Target size={16} aria-hidden="true" />
            <span>
              {t('lock.reviewTopic', { name: topic.name, n: fmt.number(topic.accuracy) })}{' '}
              <em>{t(`topicStatus.${topic.status}`)}</em>
              {!compact && topic.lessons?.length > 0 && (
                <span className="lock-notice__lessons">
                  {t('lock.suggested')}{' '}
                  {topic.lessons.map((l, i) => (
                    <span key={l.id}>
                      {i > 0 && t('common.listSep')}
                      <Link to={`/lessons/${l.id}`}>
                        {l.title}
                      </Link>
                    </span>
                  ))}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
