import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  Compass,
  Download,
  Flame,
  Lock,
  PlayCircle,
  Target,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import { useI18n } from '../i18n/I18nContext.jsx';
import { useFetch } from '../lib/useFetch.js';
import { ProgressBar, ProgressRing } from '../components/Badges.jsx';
import { EmptyState, ErrorState, PageSkeleton } from '../components/States.jsx';

const tz = new Date().getTimezoneOffset();

export default function Dashboard() {
  const { t, fmt, dir } = useI18n();
  const { data, error, loading, reload } = useFetch(`/api/me/dashboard?tz=${tz}`);
  const { data: certData } = useFetch('/api/me/certificates');
  const Arrow = dir === 'rtl' ? ArrowLeft : ArrowRight;

  if (loading) return <PageSkeleton />;
  if (error)
    return (
      <div className="container page">
        <ErrorState error={error} onRetry={reload} />
      </div>
    );

  const d = data.dashboard;
  const started = d.paths.filter((p) => p.completed > 0);
  const maxActivity = Math.max(1, ...d.streak.last14.map((x) => x.count));

  return (
    <div className="container page dashboard">
      <header className="page-head">
        <h1>{t('dashboard.greeting', { name: d.user.name })}</h1>
        <p>{d.overall.completed ? t('dashboard.leadActive') : t('dashboard.leadNew')}</p>
      </header>

      <section className="stats" aria-label={t('dashboard.summary')}>
        <div className="stat stat--ring">
          <ProgressRing value={d.overall.percent} size={96} stroke={9} label={t('dashboard.overall')} />
          <div>
            <span className="stat__label">{t('dashboard.overall')}</span>
            <strong className="stat__value">
              {fmt.number(d.overall.completed)} / {fmt.number(d.overall.total)}
            </strong>
            <span className="stat__hint">{t('dashboard.lessonsCompleted')}</span>
          </div>
        </div>
        <div className="stat">
          <Flame className="stat__icon stat__icon--flame" size={26} aria-hidden="true" />
          <span className="stat__label">{t('dashboard.streak')}</span>
          <strong className="stat__value">{fmt.count('days', d.streak.current)}</strong>
          <span className="stat__hint">
            {d.streak.activeToday ? t('dashboard.activeToday') : d.streak.current ? t('dashboard.keepStreak') : t('dashboard.startStreak')} ·{' '}
            {t('dashboard.longest', { n: fmt.count('days', d.streak.longest) })}
          </span>
        </div>
        <div className="stat">
          <TrendingUp className="stat__icon" size={26} aria-hidden="true" />
          <span className="stat__label">{t('dashboard.accuracy')}</span>
          <strong className="stat__value">{d.quizStats.accuracy === null ? '—' : `${fmt.number(d.quizStats.accuracy)}%`}</strong>
          <span className="stat__hint">
            {t('dashboard.attempts', { n: fmt.number(d.quizStats.totalAttempts), c: fmt.number(d.quizStats.correct) })}
          </span>
        </div>
        <div className="stat">
          <Award className="stat__icon stat__icon--gold" size={26} aria-hidden="true" />
          <span className="stat__label">{t('dashboard.score')}</span>
          <strong className="stat__value">{fmt.number(d.quizStats.totalScore)}</strong>
          <span className="stat__hint">{t('dashboard.points')}</span>
        </div>
      </section>

      <div className="dash-grid">
        <section className="panel" aria-labelledby="next-title">
          <h2 id="next-title">
            <PlayCircle size={20} aria-hidden="true" /> {t('dashboard.nextTitle')}
          </h2>
          {d.nextLessons.length === 0 ? (
            <EmptyState icon={Compass} title={t('dashboard.nextEmpty')} action={<Link to="/paths" className="btn btn--primary">{t('home.ctaPaths')}</Link>} />
          ) : (
            <ul className="next-list">
              {d.nextLessons.map((l) => (
                <li key={l.id}>
                  <div>
                    <span className="muted">
                      {l.roadmapTitle} · {l.moduleTitle}
                    </span>
                    <strong>{l.title}</strong>
                    {l.locked && (
                      <span className="warn-text">
                        <Lock size={14} aria-hidden="true" /> {t('dashboard.lockedHint')}
                      </span>
                    )}
                  </div>
                  <Link
                    to={l.locked ? `/paths/${l.roadmapSlug}` : `/lessons/${l.id}`}
                    className={`btn btn--sm ${l.locked ? 'btn--secondary' : 'btn--primary'}`}
                  >
                    {l.locked ? t('dashboard.howUnlock') : t('dashboard.startLesson')}
                    <Arrow size={15} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel panel--warn" aria-labelledby="weak-title">
          <h2 id="weak-title">
            <Target size={20} aria-hidden="true" /> {t('dashboard.weakTitle')}
          </h2>
          <p className="muted small">{t('dashboard.weakRule', { n: d.threshold })}</p>
          {d.weakTopics.length === 0 ? (
            <EmptyState icon={CheckCircle2} title={t('dashboard.weakEmpty')}>
              {t('dashboard.weakEmptyText')}
            </EmptyState>
          ) : (
            <ul className="weak-list">
              {d.weakTopics.map((w) => (
                <li key={w.tag}>
                  <div className="weak-list__head">
                    <strong>{w.name}</strong>
                    <span className="weak-list__acc">{fmt.number(w.accuracy)}%</span>
                  </div>
                  <ProgressBar value={w.accuracy} size="sm" label={t('lesson.accuracy', { n: w.accuracy })} />
                  <p className="small">
                    {t(`topicStatus.${w.status}`)} · {t('dashboard.failures', { n: fmt.number(w.failureCount) })}
                  </p>
                  {w.lessons.length > 0 && (
                    <div className="weak-list__lessons">
                      <span>{t('lock.suggested')}</span>
                      {w.lessons.map((l) => (
                        <Link key={l.id} to={`/lessons/${l.id}`} className="pill-link">
                          {l.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel" aria-labelledby="paths-progress-title">
          <h2 id="paths-progress-title">{t('dashboard.pathsTitle')}</h2>
          <ul className="path-progress">
            {(started.length ? started : d.paths).map((p) => (
              <li key={p.id}>
                <div className="path-progress__head">
                  <Link to={`/paths/${p.slug}`}>
                    {p.title}
                  </Link>
                  <span>
                    {fmt.number(p.completed)}/{fmt.number(p.total)} · {fmt.number(p.percent)}%
                  </span>
                </div>
                <ProgressBar value={p.percent} label={t('paths.progressIn', { title: p.title })} />
              </li>
            ))}
          </ul>
        </section>

        <section className="panel" aria-labelledby="activity-title">
          <h2 id="activity-title">
            <Flame size={20} aria-hidden="true" /> {t('dashboard.activityTitle')}
          </h2>
          <div className="activity" role="list">
            {d.streak.last14.map((day) => (
              <div
                key={day.date}
                role="listitem"
                className="activity__day"
                style={{ '--level': day.count ? 0.25 + (day.count / maxActivity) * 0.75 : 0 }}
                title={`${fmt.date(day.date)}: ${fmt.count('activities', day.count)}`}
                aria-label={`${fmt.date(day.date)}: ${fmt.count('activities', day.count)}`}
              />
            ))}
          </div>
          {d.topicMastery.length > 0 && (
            <>
              <h3 className="panel__sub">{t('dashboard.masteryTitle')}</h3>
              <ul className="mastery">
                {d.topicMastery.slice(0, 8).map((m) => (
                  <li key={m.tag}>
                    <span>{m.name}</span>
                    <span className={`mastery__bar ${m.accuracy < d.threshold ? 'is-low' : ''}`}>
                      <i style={{ width: `${m.accuracy}%` }} />
                    </span>
                    <span>{fmt.number(m.accuracy)}%</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        {d.user.role === 'STUDENT' && certData && (
          <section id="certificates" className="panel panel--wide" aria-labelledby="certificates-title">
            <h2 id="certificates-title">
              <Award size={20} aria-hidden="true" /> {t('dashboard.certificatesTitle')}
            </h2>
            {certData.certificates.length === 0 ? (
              <p className="muted">{t('dashboard.certificatesEmpty')}</p>
            ) : (
              <ul className="done-list cert-list">
                {certData.certificates.map((c) => (
                  <li key={c.id}>
                    <div>
                      <Link to={`/certificates/${c.id}`}>{c.roadmapTitle}</Link>
                      <span className="muted block small">{t('dashboard.completedOn', { date: fmt.date(c.completedAt) })}</span>
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
          </section>
        )}

        <section className="panel panel--wide" aria-labelledby="attempts-title">
          <h2 id="attempts-title">{t('dashboard.attemptsTitle')}</h2>
          {d.recentAttempts.length === 0 ? (
            <EmptyState title={t('dashboard.attemptsEmpty')}>{t('dashboard.attemptsEmptyText')}</EmptyState>
          ) : (
            <div className="table-wrap" tabIndex={0}>
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">{t('dashboard.colQuestion')}</th>
                    <th scope="col">{t('dashboard.colTopic')}</th>
                    <th scope="col">{t('dashboard.colResult')}</th>
                    <th scope="col">{t('dashboard.colWhen')}</th>
                  </tr>
                </thead>
                <tbody>
                  {d.recentAttempts.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <Link to={`/lessons/${a.lesson.id}`}>
                          {a.question.length > 70 ? `${a.question.slice(0, 70)}…` : a.question}
                        </Link>
                        <small className="muted block">{t(`questionType.${a.questionType}`)}</small>
                      </td>
                      <td>{a.topic.name}</td>
                      <td>
                        <span className={`result ${a.isCorrect ? 'is-correct' : 'is-wrong'}`}>
                          {a.isCorrect ? <CheckCircle2 size={15} aria-hidden="true" /> : <XCircle size={15} aria-hidden="true" />}
                          {fmt.number(a.score)}/{fmt.number(a.maxScore)}
                        </span>
                      </td>
                      <td className="muted">{fmt.timeAgo(a.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel panel--wide" aria-labelledby="done-title">
          <h2 id="done-title">
            <CheckCircle2 size={20} aria-hidden="true" /> {t('dashboard.completedTitle')}
          </h2>
          {d.completedLessons.length === 0 ? (
            <p className="muted">{t('dashboard.completedEmpty')}</p>
          ) : (
            <ul className="done-list">
              {d.completedLessons.map((l) => (
                <li key={l.id}>
                  <Link to={`/lessons/${l.id}`}>
                    {l.title}
                  </Link>
                  <span className="muted">
                    {l.roadmapTitle} · {fmt.timeAgo(l.completedAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
