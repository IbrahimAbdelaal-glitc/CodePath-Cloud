import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Compass,
  FlaskConical,
  Flag,
  Lock,
  PlayCircle,
  SkipForward,
} from 'lucide-react';
import { useI18n } from '../i18n/I18nContext.jsx';
import { ProgressBar } from './Badges.jsx';
import RoadmapDownload from './RoadmapDownload.jsx';
import { minutesOf } from '../lib/videoTimes.js';
import { useReducedMotion } from '../lib/useReducedMotion.js';

// The cybersecurity roadmap drawn as a winding road. Built only from the course outline API (/api/courses/:slug/outline),
// so every state shown here (done, locked, current) is the one the server enforces; nothing is stored twice.
// Each row draws its own S-shaped piece of road that starts and ends at the centre line, so the pieces join into one
// continuous road whatever each card's height. The road and circles are decorative; the list and its text carry meaning.

// A stage of the roadmap carries stage details (outcomes, practice, linked courses or specialties)
export const isStage = (m) => Boolean(m.learningOutcomes?.length || m.practice || m.linkedCourses?.length || m.specialties?.length);

// Milestone links such as #stage-<id> or #practice-<id> point into collapsed stage details: open the
// <details> that holds the target, then scroll to it (instantly when the device asks for reduced motion)
export function useHashTarget() {
  const reduced = useReducedMotion();
  useEffect(() => {
    const go = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      const el = id && document.getElementById(id);
      if (!el) return;
      const details = el.tagName === 'DETAILS' ? el : el.closest('details');
      if (details) details.open = true;
      el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    };
    go();
    window.addEventListener('hashchange', go);
    return () => window.removeEventListener('hashchange', go);
  }, [reduced]);
}

// Flattens the stages into milestones along the road, in the order a student meets them
function buildMilestones(course, signedIn) {
  const items = [];
  const stages = course.modules.filter(isStage);
  stages.forEach((m, si) => {
    const locked = signedIn && m.locked;
    const lessonsDone = m.progress.total > 0 && m.progress.completed === m.progress.total;
    const passed = m.quiz?.state === 'PASSED';
    const nextLesson = m.lessons.find((l) => l.state === 'AVAILABLE' || l.state === 'IN_PROGRESS') || m.lessons[0];
    const lessonHref = nextLesson ? `/learn/${course.slug}/${nextLesson.id}` : null;
    const base = { stage: m, stageNumber: si + 1 };
    const status = (done) => (!signedIn ? 'preview' : m.skipped && !done ? 'skipped' : done ? 'done' : locked ? 'locked' : 'open');

    items.push({ ...base, kind: 'stage', key: `stage-${m.id}`, status: status(passed || m.skipped), href: lessonHref });
    if (m.lessons.length) {
      items.push({ ...base, kind: 'lessons', key: `lessons-${m.id}`, status: status(lessonsDone), href: lessonHref, nextLesson });
    }
    for (const c of m.linkedCourses) {
      items.push({ ...base, kind: 'course', key: `course-${m.id}-${c.id}`, course: c, status: status(c.completed), href: `/learn/${c.slug}` });
    }
    if (m.practice) {
      items.push({ ...base, kind: 'practice', key: `practice-${m.id}`, status: status(lessonsDone), href: `#practice-${m.id}` });
    }
    if (m.quiz) {
      const examLocked = signedIn && !passed && m.quiz.state === 'LOCKED';
      items.push({
        ...base,
        kind: 'exam',
        key: `exam-${m.id}`,
        status: !signedIn ? 'preview' : passed ? (m.skipped ? 'skipped' : 'done') : examLocked ? 'locked' : 'open',
        href: `/learn/${course.slug}/quiz/${m.id}`,
      });
    }
    if (m.specialties.length) {
      items.push({ ...base, kind: 'specialties', key: `specialties-${m.id}`, status: status(false), href: null });
    }
  });
  // "You are here": the first milestone that is open
  const current = items.find((it) => it.status === 'open');
  if (current) current.status = 'current';
  return items;
}

const ICONS = { lessons: PlayCircle, course: BookOpen, practice: FlaskConical, exam: ClipboardCheck, specialties: Compass };

// One piece of road: from the top centre, out to the milestone's side, back to the bottom centre
const roadPath = (x) => `M50 0 C50 28 ${x} 22 ${x} 50 C${x} 78 50 72 50 100`;

export default function RoadmapMap({ course, signedIn }) {
  const { t, fmt } = useI18n();
  const items = buildMilestones(course, signedIn);
  if (!items.length) return null;
  const stagesDone = course.modules.filter(isStage).filter((m) => m.quiz?.state === 'PASSED' || m.skipped).length;
  const stageCount = course.modules.filter(isStage).length;

  return (
    <section className="road-map" aria-labelledby="road-map-h">
      <div className="road-map__head">
        <h2 id="road-map-h">
          <Flag size={20} aria-hidden="true" /> {t('map.title')}
        </h2>
        <p className="muted">
          {signedIn ? t('map.summary', { done: fmt.number(stagesDone), total: fmt.number(stageCount) }) : t('map.signedOut')}
        </p>
        <RoadmapDownload slug={course.slug} />
        <ul className="road-map__legend" aria-label={t('map.legend')}>
          {['done', 'current', 'open', 'locked'].map((s) => (
            <li key={s} className={`is-${s}`}>
              <span className="road-map__dot" aria-hidden="true" /> {t(`map.status.${s}`)}
            </li>
          ))}
        </ul>
      </div>

      <ol className="road">
        {items.map((it, i) => {
          const side = i % 2 === 0 ? 'right' : 'left';
          const Icon = ICONS[it.kind];
          return (
            <li
              key={it.key}
              className={`road__stop road__stop--${it.kind} is-${it.status} is-${side}`}
              aria-current={it.status === 'current' ? 'step' : undefined}
            >
              <div className="road__track" aria-hidden="true">
                <svg className="road__svg" viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false">
                  <path className="road__asphalt" d={roadPath(side === 'right' ? 80 : 20)} vectorEffect="non-scaling-stroke" />
                  <path className="road__line" d={roadPath(side === 'right' ? 80 : 20)} vectorEffect="non-scaling-stroke" />
                </svg>
                <span className="road__node">
                  {it.status === 'done' || it.status === 'skipped' ? (
                    <CheckCircle2 size={it.kind === 'stage' ? 26 : 18} />
                  ) : it.status === 'locked' ? (
                    <Lock size={it.kind === 'stage' ? 22 : 16} />
                  ) : it.kind === 'stage' ? (
                    <span className="road__num">{it.stageNumber}</span>
                  ) : (
                    <Icon size={18} />
                  )}
                </span>
              </div>
              <div className="road__card">
                <Milestone item={it} course={course} signedIn={signedIn} />
              </div>
            </li>
          );
        })}
        <li className="road__finish" aria-hidden="true">
          <span className="road__node">
            <Flag size={20} />
          </span>
        </li>
      </ol>
    </section>
  );
}

function StatusChip({ status }) {
  const { t } = useI18n();
  if (status === 'preview') return null;
  return <span className={`chip road__chip is-${status}`}>{t(`map.status.${status}`)}</span>;
}

// A link, or plain text with the reason when the milestone is locked
function Go({ item, children, className = 'btn btn--secondary btn--sm' }) {
  if (!item.href || item.status === 'locked') return null;
  return item.href.startsWith('#') ? (
    <a href={item.href} className={className}>
      {children}
    </a>
  ) : (
    <Link to={item.href} className={className}>
      {children}
    </Link>
  );
}

function Milestone({ item, course, signedIn }) {
  const { t, fmt } = useI18n();
  const m = item.stage;
  const go = !signedIn ? t('map.signInToStart') : null;

  if (item.kind === 'stage') {
    const testOut = m.quiz?.testOut;
    return (
      <>
        <p className="road__eyebrow">
          {t('map.stage', { n: item.stageNumber })} <StatusChip status={item.status} />
        </p>
        <h3 className="road__title">{m.title.replace(/^Stage \d+:\s*/, '')}</h3>
        {m.description && <p className="small">{m.description}</p>}
        {m.timeEstimate && (
          <p className="small muted">
            <Clock size={14} aria-hidden="true" /> {m.timeEstimate}
            {m.videoSeconds > 0 && <> · {t('video.total', { d: fmt.duration(minutesOf(m.videoSeconds)) })}</>}
          </p>
        )}
        {item.status === 'locked' && m.reasons.length > 0 && (
          <ul className="road__reasons small">
            {m.reasons.map((r) => (
              <li key={r}>
                <Lock size={13} aria-hidden="true" /> {r}
              </li>
            ))}
          </ul>
        )}
        <div className="road__actions">
          <a href={`#stage-${m.id}`} className="btn btn--ghost btn--sm">
            {t('map.details')}
          </a>
          {testOut?.available && item.status !== 'done' && (
            <Link to={`/learn/${course.slug}/quiz/${m.id}?mode=skip`} className="btn btn--ghost btn--sm">
              <SkipForward size={14} aria-hidden="true" /> {t('map.skip', { left: fmt.number(testOut.attemptsLeft) })}
            </Link>
          )}
        </div>
      </>
    );
  }

  if (item.kind === 'lessons') {
    const { completed, total } = m.progress;
    return (
      <>
        <h3 className="road__title road__title--sm">
          {t('map.lessons')} <StatusChip status={item.status} />
        </h3>
        <p className="small muted">{t('map.lessonsRule')}</p>
        {signedIn && (
          <ProgressBar value={total ? (completed / total) * 100 : 0} size="sm" label={t('map.lessonsDone', { done: completed, total })} />
        )}
        <p className="small">
          {signedIn ? t('map.lessonsDone', { done: fmt.number(completed), total: fmt.number(total) }) : fmt.count('lessons', total)}
        </p>
        <Go item={item}>
          <PlayCircle size={15} aria-hidden="true" />{' '}
          {go || (completed === total ? t('map.review') : completed ? t('map.continue', { title: item.nextLesson.title }) : t('map.start'))}
        </Go>
      </>
    );
  }

  if (item.kind === 'course') {
    const c = item.course;
    return (
      <>
        <h3 className="road__title road__title--sm">
          {c.title} <StatusChip status={item.status} />
        </h3>
        <p className="small muted">{t('map.courseLead')}</p>
        {signedIn && <ProgressBar value={c.percent} size="sm" label={t('player.coursePercent', { n: c.percent })} />}
        <Go item={item}>
          <BookOpen size={15} aria-hidden="true" /> {go || (c.completed ? t('map.review') : t('player.openCourse'))}
        </Go>
      </>
    );
  }

  if (item.kind === 'practice') {
    return (
      <>
        <h3 className="road__title road__title--sm">
          {t('map.practice')} <StatusChip status={item.status} />
        </h3>
        <p className="small muted">{t('map.practiceLead')}</p>
        <Go item={item}>
          <FlaskConical size={15} aria-hidden="true" /> {t('map.practiceOpen')}
        </Go>
      </>
    );
  }

  if (item.kind === 'exam') {
    const q = m.quiz;
    const lockedReason = !m.locked && q.state === 'LOCKED' ? (m.linkedCourses.some((c) => !c.completed) ? t('map.examNeedsCourses') : t('map.examNeedsLessons')) : null;
    return (
      <>
        <h3 className="road__title road__title--sm">
          {t('map.exam')} <StatusChip status={item.status} />
        </h3>
        <p className="small muted">{t('map.examRule', { n: fmt.number(q.questionCount), pass: fmt.number(q.passPercent) })}</p>
        {q.bestPercent != null && <p className="small">{t('map.best', { n: fmt.number(q.bestPercent) })}</p>}
        {item.status === 'locked' && lockedReason && (
          <p className="road__reasons small">
            <Lock size={13} aria-hidden="true" /> {lockedReason}
          </p>
        )}
        <Go item={item}>
          <ClipboardCheck size={15} aria-hidden="true" />{' '}
          {go || (q.state === 'PASSED' ? t('map.examReview') : q.state === 'FAILED' ? t('map.examRetake') : t('map.examStart'))}
        </Go>
      </>
    );
  }

  // specialties: the road forks into the four directions
  return (
    <>
      <h3 className="road__title road__title--sm">
        {t('map.specialties')} <StatusChip status={item.status} />
      </h3>
      <p className="small muted">{t('map.specialtiesLead')}</p>
      <ul className="road__fork">
        {m.specialties.map((sp) => (
          <li key={sp.key}>
            <Compass size={16} aria-hidden="true" />
            <div>
              <strong>{sp.title}</strong>
              {sp.courses.length > 0 && (
                <span className="small">
                  {' '}
                  {sp.courses.map((c, i) => (
                    <span key={c.slug}>
                      {i > 0 && ', '}
                      <Link to={`/learn/${c.slug}`}>{c.title}</Link>
                    </span>
                  ))}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
      <a href={`#stage-${m.id}`} className="btn btn--ghost btn--sm">
        {t('map.specialtiesMore')}
      </a>
    </>
  );
}
