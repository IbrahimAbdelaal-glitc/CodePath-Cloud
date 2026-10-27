import { Link, useParams } from 'react-router-dom';
import { Award, Bookmark, CheckCircle2, Circle, Clock, Eye, Layers, ListChecks, Lock, LogIn, PlayCircle, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useI18n } from '../i18n/I18nContext.jsx';
import { useFetch } from '../lib/useFetch.js';
import { DifficultyBadge, ProgressBar, ProgressRing } from '../components/Badges.jsx';
import LockNotice from '../components/LockNotice.jsx';
import { ErrorState, PageSkeleton } from '../components/States.jsx';
import RoadmapMap, { isStage, useHashTarget } from '../components/RoadmapMap.jsx';
import { StageCard } from './CoursePlayer.jsx';

export default function PathDetail() {
  const { slug } = useParams();
  const { user, ready } = useAuth();
  const { t, fmt } = useI18n();
  const { data, error, loading, reload } = useFetch(ready ? `/api/roadmaps/${encodeURIComponent(slug)}` : null);
  // A staged roadmap is drawn as a winding road from the course outline (the same data the course player uses)
  const { data: outline } = useFetch(ready ? `/api/courses/${encodeURIComponent(slug)}/outline` : null);
  useHashTarget();

  if (!ready || loading) return <PageSkeleton />;
  if (error)
    return (
      <div className="container page">
        <ErrorState error={error} onRetry={error.status === 404 ? null : reload} />
      </div>
    );

  const r = data.roadmap;
  const course = outline?.course;
  const stagedCourse = course?.modules?.filter(isStage).length > 1 ? course : null;
  const next = r.modules.flatMap((m) => (m.access.locked && m.access.enforced ? [] : m.lessons)).find((l) => !l.isCompleted);
  // Video courses open in the course player, which tracks watching, checkpoints and block quizzes
  const lessonHref = (id) => (r.isSequential ? `/learn/${r.slug}/${id}` : `/lessons/${id}`);

  return (
    <div className="page">
      <section className="path-hero">
        <div className="container path-hero__inner">
          <div>
            <nav className="crumbs" aria-label={t('common.breadcrumb')}>
              <Link to="/paths">{t('nav.paths')}</Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">
                {r.title}
              </span>
            </nav>
            <span className="path-hero__category">
              {r.category}
            </span>
            <h1>{r.title}</h1>
            <p className="path-hero__desc">
              {r.description}
            </p>
            <div className="path-hero__meta">
              <DifficultyBadge level={r.difficulty} />
              <span>
                <Layers size={16} aria-hidden="true" /> {fmt.count('modules', r.modules.length)}
              </span>
              <span>
                <ListChecks size={16} aria-hidden="true" /> {fmt.count('lessons', r.lessonCount)}
              </span>
              <span>
                <Clock size={16} aria-hidden="true" /> {fmt.duration(r.estimatedMinutes)}
              </span>
              {r.instructors.length > 0 && (
                <span>
                  <Users size={16} aria-hidden="true" /> {r.instructors.map((i) => i.name).join(t('common.listSep'))}
                </span>
              )}
            </div>
            {r.prerequisites.length > 0 && (
              <div className="prereq-box">
                <h2>{t('path.prerequisites')}</h2>
                <ul>
                  {r.prerequisites.map((p) => (
                    <li key={p}>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <aside className="path-hero__side" aria-label={t('path.yourProgress')}>
            {r.progress ? (
              <>
                <ProgressRing value={r.progress.percent} label={t('path.progressLabel', { n: r.progress.percent })} />
                <p>
                  {t('paths.lessonsDone', { done: fmt.number(r.progress.completed), total: fmt.number(r.progress.total) })}
                </p>
                {r.isSequential ? (
                  <Link to={`/learn/${r.slug}`} className="btn btn--accent">
                    <PlayCircle size={18} aria-hidden="true" />
                    {r.progress.completed ? t('player.openCourseContinue') : t('player.openCourse')}
                  </Link>
                ) : next ? (
                  <Link to={`/lessons/${next.id}`} className="btn btn--accent">
                    <PlayCircle size={18} aria-hidden="true" />
                    {r.progress.completed ? t('path.continue') : t('path.start')}
                  </Link>
                ) : r.progress.percent === 100 ? (
                  <p className="success-text">{t('path.done')}</p>
                ) : null}
                {r.certificateId && (
                  <Link to={`/certificates/${r.certificateId}`} className="btn btn--accent">
                    <Award size={18} aria-hidden="true" />
                    {t('certificate.view')}
                  </Link>
                )}
              </>
            ) : (
              <>
                <p>{t('path.loginToTrack')}</p>
                <Link to="/login" state={{ from: `/paths/${slug}` }} className="btn btn--accent">
                  <LogIn size={18} aria-hidden="true" />
                  {t('nav.login')}
                </Link>
              </>
            )}
          </aside>
        </div>
      </section>

      {r.learningOutcomes?.length > 0 && (
        <section className="container section" aria-labelledby="outcomes-title">
          <div className="panel">
            <h2 id="outcomes-title">{t('player.outcomes')}</h2>
            <ul className="checklist">
              {r.learningOutcomes.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {stagedCourse ? (
        <div className="container section">
          <RoadmapMap course={stagedCourse} signedIn={Boolean(user)} />
          <section aria-labelledby="stages-h" className="stages">
            <h2 id="stages-h">{t('player.stageDetails')}</h2>
            {stagedCourse.modules.filter(isStage).map((m) => (
              <StageCard key={m.id} course={stagedCourse} stage={m} open={false} />
            ))}
          </section>
        </div>
      ) : (
      <section className="container section" aria-labelledby="modules-title">
        <h2 id="modules-title">{t('path.modulesTitle')}</h2>
        <ol className="modules">
          {r.modules.map((m, mi) => {
            const locked = m.access.locked && m.access.enforced;
            const preview = m.access.locked && !m.access.enforced && user;
            const pct = m.progress.total ? (m.progress.completed / m.progress.total) * 100 : 0;
            return (
              <li key={m.id} id={`module-${m.id}`} className={`module ${locked ? 'module--locked' : ''}`}>
                <div className="module__rail" aria-hidden="true">
                  <span className="module__dot">{locked ? <Lock size={16} /> : mi + 1}</span>
                </div>
                <div className="module__body">
                  <header className="module__head">
                    <div>
                      <h3>{m.title}</h3>
                      {m.description && (
                        <p className="muted">
                          {m.description}
                        </p>
                      )}
                    </div>
                    <div className="module__meta">
                      <DifficultyBadge level={m.difficulty} />
                      <span>
                        <Clock size={15} aria-hidden="true" /> {fmt.duration(m.estimatedMinutes)}
                      </span>
                    </div>
                  </header>

                  {m.access.prerequisites.length > 0 && (
                    <p className="module__requires">
                      {t('path.requires')}{' '}
                      {m.access.prerequisites.map((p, i) => (
                        <span key={p.id}>
                          {i > 0 && t('common.listSep')}
                          <bdi>{p.title}</bdi>
                        </span>
                      ))}
                    </p>
                  )}

                  {user && (
                    <div className="module__progress">
                      <ProgressBar value={pct} size="sm" label={t('paths.progressIn', { title: m.title })} />
                      <span>
                        {fmt.number(m.progress.completed)}/{fmt.number(m.progress.total)}
                      </span>
                    </div>
                  )}

                  {locked && <LockNotice access={m.access} roadmapSlug={r.slug} />}
                  {preview && (
                    <p className="preview-note">
                      <Eye size={15} aria-hidden="true" /> {t('path.staffPreview')}
                    </p>
                  )}

                  <ul className="lessons">
                    {m.lessons.map((l) => {
                      const inner = (
                        <>
                          {l.isCompleted ? (
                            <CheckCircle2 className="lesson-row__state is-done" size={20} aria-label={t('path.completed')} />
                          ) : locked ? (
                            <Lock className="lesson-row__state" size={18} aria-label={t('path.locked')} />
                          ) : (
                            <Circle className="lesson-row__state" size={20} aria-label={t('path.notCompleted')} />
                          )}
                          <span className="lesson-row__title">
                            {l.title}
                          </span>
                          <span className="lesson-row__meta">
                            {l.isBookmarked && <Bookmark size={14} aria-label={t('lesson.bookmarked')} />}
                            {l.quizCount > 0 && <span>{fmt.count('questions', l.quizCount)}</span>}
                            <span>{fmt.duration(l.estimatedMinutes)}</span>
                          </span>
                        </>
                      );
                      return (
                        <li key={l.id}>
                          {locked ? (
                            <span className="lesson-row is-locked" aria-disabled="true">
                              {inner}
                            </span>
                          ) : (
                            <Link
                              className="lesson-row"
                              to={user ? lessonHref(l.id) : '/login'}
                              state={user ? undefined : { from: lessonHref(l.id) }}
                            >
                              {inner}
                            </Link>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </li>
            );
          })}
        </ol>
      </section>
      )}
    </div>
  );
}
