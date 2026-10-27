import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import { apiUrl } from '../api/client.js';
import { useI18n } from '../i18n/I18nContext.jsx';
import { useFetch } from '../lib/useFetch.js';
import Markdown from '../components/Markdown.jsx';
import { ErrorState, PageSkeleton } from '../components/States.jsx';

// Print-friendly roadmap. Built from the same handout data as the PDF (/api/courses/:slug/handout), so the two match.
// On paper it prints black on white without the site header, footer or animation (see .print-doc in player.css).
const ACCESS = { FREE: 'Free', ACCOUNT: 'Free account', PAID: 'Paid' };

export default function RoadmapPrint() {
  const { slug } = useParams();
  const { t } = useI18n();
  const { data, error, loading, reload } = useFetch(`/api/courses/${encodeURIComponent(slug)}/handout`);

  if (loading) return <PageSkeleton />;
  if (error)
    return (
      <div className="container page">
        <ErrorState error={error} onRetry={error.status === 404 ? null : reload} />
      </div>
    );
  const h = data.handout;

  return (
    <article className="container page print-doc">
      <div className="print-doc__toolbar">
        <Link to={`/paths/${h.slug}`} className="btn btn--ghost btn--sm">
          <ArrowLeft size={16} aria-hidden="true" /> {t('print.back')}
        </Link>
        <button type="button" className="btn btn--primary btn--sm" onClick={() => window.print()}>
          <Printer size={16} aria-hidden="true" /> {t('print.print')}
        </button>
        <a href={apiUrl(`/api/courses/${encodeURIComponent(h.slug)}/roadmap.pdf`)} className="btn btn--secondary btn--sm" download>
          <Download size={16} aria-hidden="true" /> {t('map.download')}
        </a>
      </div>

      <header className="print-doc__head">
        <p className="eyebrow">{t('print.eyebrow')}</p>
        <h1>{h.title}</h1>
        <p className="lead">{h.summary}</p>
        <p className="small">
          {t('print.online')} <a href={h.url}>{h.url}</a>
        </p>
      </header>
      <p>{h.description}</p>

      <ol className="mini-route print-doc__route" aria-label={t('print.overview')}>
        {h.stages.map((s) => (
          <li key={s.number} className="mini-route__stop">
            <span className="mini-route__node" aria-hidden="true">
              {s.number}
            </span>
            <span className="mini-route__text">
              <strong>{s.title.replace(/^Stage \d+:\s*/, '')}</strong>
              {s.time && <span className="small muted">{s.time.split(/[:,]/)[0]}</span>}
            </span>
          </li>
        ))}
      </ol>

      <section>
        <h2>{t('print.how')}</h2>
        <ul>
          <li>{t('print.rule1', { n: h.videoPassPercent })}</li>
          <li>{t('print.rule2')}</li>
          <li>{t('print.rule3')}</li>
          <li>{t('print.rule4')}</li>
          <li>
            <strong>{t('print.safe')}</strong>
          </li>
        </ul>
      </section>

      {h.stages.map((s) => (
        <section key={s.number} className="print-doc__stage">
          <h2>
            <span className="print-doc__num">{s.number}</span> {s.title}
          </h2>
          {s.description && <p className="muted">{s.description}</p>}
          {s.time && (
            <p>
              <strong>{t('player.stageTime')}:</strong> {s.time}
            </p>
          )}
          {s.prerequisites.length > 0 && (
            <>
              <h3>{t('player.stagePrereqs')}</h3>
              <ul>
                {s.prerequisites.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </>
          )}
          {s.outcomes.length > 0 && (
            <>
              <h3>{t('player.stageOutcomes')}</h3>
              <ul>
                {s.outcomes.map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ul>
            </>
          )}
          {s.selfAssessment && (
            <>
              <h3>{t('print.selfAssessment')}</h3>
              <p>{t('print.selfAssessmentText', { pass: s.exam?.passPercent ?? 80 })}</p>
            </>
          )}
          {s.lessons.length > 0 && (
            <>
              <h3>{t('print.lessons')}</h3>
              <ol>
                {s.lessons.map((l) => (
                  <li key={l.url}>
                    <a href={l.url}>{l.title}</a>
                    {l.minutes ? ` · ${l.minutes} min` : ''}
                    {l.video ? ` · ${t('print.questions', { n: l.questions })}` : ` · ${t('print.reading')}`}
                    {l.credit && (
                      <span className="small muted print-doc__credit">
                        {t('print.video')}: {l.credit}
                        {l.sourceUrl && (
                          <>
                            {' '}
                            (<a href={l.sourceUrl}>{t('print.youtube')}</a>)
                          </>
                        )}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </>
          )}
          {s.courses.length > 0 && (
            <>
              <h3>{t('player.stageCourses')}</h3>
              <ul>
                {s.courses.map((c) => (
                  <li key={c.url}>
                    <a href={c.url}>{c.title}</a>
                  </li>
                ))}
              </ul>
            </>
          )}
          {s.practice && (
            <>
              <h3>{t('player.stagePractice')}</h3>
              <Markdown>{s.practice}</Markdown>
            </>
          )}
          {s.exam && (
            <>
              <h3>{t('print.exam')}</h3>
              <p>{t('print.examText', { n: s.exam.questions, pass: s.exam.passPercent })}</p>
            </>
          )}
          {s.specialties.length > 0 && (
            <>
              <h3>{t('player.specialties')}</h3>
              {s.specialties.map((sp) => (
                <div key={sp.title} className="print-doc__specialty">
                  <h4>{sp.title}</h4>
                  <p>{sp.summary}</p>
                  {sp.roles.length > 0 && (
                    <p className="small">
                      {t('player.specialtyRoles')}: {sp.roles.join(', ')}
                    </p>
                  )}
                  <ul>
                    {sp.courses.map((c) => (
                      <li key={c.url}>
                        <a href={c.url}>{c.title}</a>
                      </li>
                    ))}
                    {sp.resources.map((r) => (
                      <li key={r.url}>
                        <a href={r.url}>{r.title}</a> {[r.publisher, ACCESS[r.access], r.note].filter(Boolean).join(' · ')}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </>
          )}
          {s.readings.length > 0 && (
            <>
              <h3>{t('print.readings')}</h3>
              <ul>
                {s.readings.map((r) => (
                  <li key={r.url}>
                    <a href={r.url}>{r.title}</a>
                    <span className="small muted print-doc__credit">{[...new Set([r.authors, r.publisher, r.year, ACCESS[r.access]].filter(Boolean))].join(' · ')}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
          {s.nextSteps && (
            <>
              <h3>{t('player.stageNext')}</h3>
              <Markdown>{s.nextSteps}</Markdown>
            </>
          )}
        </section>
      ))}
    </article>
  );
}
