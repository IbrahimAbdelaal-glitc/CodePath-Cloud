import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  Circle,
  ClipboardCheck,
  Clock,
  ExternalLink,
  Flag,
  Library,
  ListChecks,
  Lock,
  Menu,
  PlayCircle,
  SkipForward,
  Upload,
  X,
} from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useI18n } from '../i18n/I18nContext.jsx';
import { useFetch } from '../lib/useFetch.js';
import { useActivityHeartbeat } from '../lib/useActivityHeartbeat.js';
import { DifficultyBadge, ProgressBar, ProgressRing } from '../components/Badges.jsx';
import { Alert, ErrorState, PageSkeleton } from '../components/States.jsx';
import Markdown from '../components/Markdown.jsx';
import VideoPlayer from '../components/VideoPlayer.jsx';
import CheckpointCard from '../components/CheckpointCard.jsx';
import RoadmapMap, { isStage, useHashTarget } from '../components/RoadmapMap.jsx';
import { clockTime, minutesOf, videoLabel, videoShort } from '../lib/videoTimes.js';
import VideoUploadDialog from '../components/VideoUploadDialog.jsx';


const STATE_ICON = {
  COMPLETED: CheckCircle2,
  IN_PROGRESS: CircleDot,
  AVAILABLE: Circle,
  LOCKED: Lock,
  PASSED: CheckCircle2,
  FAILED: CircleDot,
};

// The sequence of steps in the course: every lesson, then each module's block quiz
export function courseSteps(course) {
  return course.modules.flatMap((m) => [
    ...m.lessons.map((l) => ({ type: 'LESSON', id: l.id, title: l.title, module: m, state: l.state })),
    ...(m.quiz ? [{ type: 'QUIZ', id: m.id, title: m.title, module: m, state: m.quiz.state }] : []),
  ]);
}

export const stepPath = (slug, step) => (step.type === 'QUIZ' ? `/learn/${slug}/quiz/${step.id}` : `/learn/${slug}/${step.id}`);

// ── Sidebar outline ─────────────────────────────────────────────
export function CourseOutline({ course, currentId, onNavigate }) {
  const { t, fmt } = useI18n();
  const currentModule = course.modules.find((m) => m.id === currentId || m.lessons.some((l) => l.id === currentId));
  const [open, setOpen] = useState(() => new Set(currentModule ? [currentModule.id] : [course.modules[0]?.id]));
  useEffect(() => {
    if (currentModule) setOpen((s) => new Set(s).add(currentModule.id));
  }, [currentModule]);

  const toggle = (id) =>
    setOpen((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <nav className="outline" aria-label={t('player.contents')}>
      <ol className="outline__modules">
        {course.modules.map((m, mi) => {
          const expanded = open.has(m.id);
          return (
            <li key={m.id} className={`outline__module ${m.locked ? 'is-locked' : ''}`}>
              <button
                type="button"
                className="outline__module-head"
                aria-expanded={expanded}
                aria-controls={`outline-${m.id}`}
                onClick={() => toggle(m.id)}
              >
                <span className="outline__module-num">{m.locked ? <Lock size={14} aria-label={t('player.locked')} /> : mi + 1}</span>
                <span className="outline__module-title">
                  {m.title}
                  {m.skipped && <span className="chip chip--done">{t('player.skipped')}</span>}
                </span>
                <span className="outline__module-meta">
                  {fmt.number(m.progress.completed)}/{fmt.number(m.progress.total)}
                </span>
                <ChevronDown size={16} className="outline__chevron" aria-hidden="true" />
              </button>
              {expanded && (
                <ol className="outline__items" id={`outline-${m.id}`}>
                  {m.lessons.map((l) => {
                    const Icon = STATE_ICON[l.state];
                    const inner = (
                      <>
                        <Icon size={17} className="outline__icon" aria-hidden="true" />
                        <span className="outline__title">{l.title}</span>
                        <span className="outline__meta">
                          {l.hasVideo ? (
                            <span title={videoLabel(t, fmt, { seconds: l.durationSeconds, runtimeSeconds: l.videoRuntimeSeconds, isClip: l.isClip })}>
                              {videoShort(t, fmt, { seconds: l.durationSeconds, runtimeSeconds: l.videoRuntimeSeconds, isClip: l.isClip })}
                            </span>
                          ) : null}
                          {l.state === 'IN_PROGRESS' && l.watchedPercent > 0 ? ` · ${l.watchedPercent}%` : ''}
                        </span>
                        <span className="sr-only">{t(`player.state.${l.state}`)}</span>
                      </>
                    );
                    return (
                      <li key={l.id}>
                        {l.state === 'LOCKED' ? (
                          <span className={`outline__item is-${l.state.toLowerCase()}`} aria-disabled="true" title={t('player.lockedHint')}>
                            {inner}
                          </span>
                        ) : (
                          <Link
                            to={`/learn/${course.slug}/${l.id}`}
                            className={`outline__item is-${l.state.toLowerCase()} ${currentId === l.id ? 'is-current' : ''}`}
                            aria-current={currentId === l.id ? 'page' : undefined}
                            onClick={onNavigate}
                          >
                            {inner}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                  {m.linkedCourses.map((c) => (
                    <li key={c.id}>
                      {m.locked ? (
                        <span className="outline__item is-locked" aria-disabled="true">
                          <Lock size={17} className="outline__icon" aria-hidden="true" />
                          <span className="outline__title">{c.title}</span>
                        </span>
                      ) : (
                        <Link to={`/learn/${c.slug}`} className="outline__item outline__item--course" onClick={onNavigate}>
                          {c.completed ? (
                            <CheckCircle2 size={17} className="outline__icon" aria-hidden="true" />
                          ) : (
                            <BookOpen size={17} className="outline__icon" aria-hidden="true" />
                          )}
                          <span className="outline__title">{c.title}</span>
                          <span className="outline__meta">{c.completed ? t('player.courseDone') : t('player.coursePercent', { n: c.percent })}</span>
                        </Link>
                      )}
                    </li>
                  ))}
                  {m.quiz?.testOut?.available && (
                    <li>
                      <Link to={`/learn/${course.slug}/quiz/${m.id}?mode=skip`} className="outline__item outline__item--skip" onClick={onNavigate}>
                        <SkipForward size={17} className="outline__icon" aria-hidden="true" />
                        <span className="outline__title">{t('player.skipTest')}</span>
                        <span className="outline__meta">{m.quiz.testOut.attemptsLeft}/{m.quiz.testOut.attemptsAllowed}</span>
                      </Link>
                    </li>
                  )}
                  {m.quiz && (
                    <li>
                      {(() => {
                        const Icon = m.quiz.state === 'AVAILABLE' ? ClipboardCheck : STATE_ICON[m.quiz.state];
                        const inner = (
                          <>
                            <Icon size={17} className="outline__icon" aria-hidden="true" />
                            <span className="outline__title">{t('player.blockQuiz')}</span>
                            <span className="outline__meta">
                              {m.quiz.bestPercent != null ? t('player.bestScore', { n: m.quiz.bestPercent }) : t('player.questionsShort', { n: m.quiz.questionCount })}
                            </span>
                            <span className="sr-only">{t(`player.quizState.${m.quiz.state}`)}</span>
                          </>
                        );
                        return m.quiz.state === 'LOCKED' ? (
                          <span className="outline__item outline__item--quiz is-locked" aria-disabled="true" title={t('player.quizLockedHint')}>
                            {inner}
                          </span>
                        ) : (
                          <Link
                            to={`/learn/${course.slug}/quiz/${m.id}`}
                            className={`outline__item outline__item--quiz is-${m.quiz.state.toLowerCase()} ${currentId === m.id ? 'is-current' : ''}`}
                            aria-current={currentId === m.id ? 'page' : undefined}
                            onClick={onNavigate}
                          >
                            {inner}
                          </Link>
                        );
                      })()}
                    </li>
                  )}
                  {m.readings.length > 0 && (
                    <li>
                      <Link to={`/learn/${course.slug}?module=${m.id}#readings-${m.id}`} className="outline__item outline__item--readings" onClick={onNavigate}>
                        <Library size={17} className="outline__icon" aria-hidden="true" />
                        <span className="outline__title">{t('player.readings')}</span>
                        <span className="outline__meta">{fmt.number(m.readings.length)}</span>
                      </Link>
                    </li>
                  )}
                </ol>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// Shared frame: header with course progress, sidebar outline and the main area
export function PlayerFrame({ course, currentId, children }) {
  const { t, fmt } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="player">
      <div className="player__bar">
        <Link to={`/paths/${course.slug}`} className="player__back">
          <ArrowLeft size={16} aria-hidden="true" /> <span className="player__course">{course.title}</span>
        </Link>
        {course.progress && (
          <div className="player__progress" aria-label={t('player.courseProgress')}>
            <ProgressBar value={course.progress.percent} size="sm" label={t('player.courseProgressLabel', { n: course.progress.percent })} />
            <span>{t('player.percentDone', { n: fmt.number(course.progress.percent) })}</span>
          </div>
        )}
        <button
          type="button"
          className="icon-btn player__menu"
          aria-expanded={menuOpen}
          aria-controls="player-sidebar"
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
          <span className="sr-only">{menuOpen ? t('player.hideContents') : t('player.showContents')}</span>
        </button>
      </div>
      <div className="player__body">
        <aside id="player-sidebar" className={`player__sidebar ${menuOpen ? 'is-open' : ''}`}>
          <CourseOutline course={course} currentId={currentId} onNavigate={() => setMenuOpen(false)} />
        </aside>
        <div className="player__main">{children}</div>
      </div>
    </div>
  );
}

// ── Course home (no lesson selected) ───────────────────────────
function CourseHome({ course }) {
  const { t, fmt } = useI18n();
  const target = course.nextStep
    ? course.nextStep.type === 'QUIZ'
      ? `/learn/${course.slug}/quiz/${course.nextStep.moduleId}`
      : course.nextStep.type === 'COURSE'
        ? `/learn/${course.nextStep.slug}`
        : `/learn/${course.slug}/${course.nextStep.lessonId}`
    : null;
  const stages = course.modules.filter(isStage);
  const resumeTarget = course.resume && !course.resume.completed ? `/learn/${course.slug}/${course.resume.lessonId}` : null;
  useHashTarget();

  return (
    <div className="course-home">
      <section className="course-home__hero panel">
        <div>
          <p className="eyebrow">{t('player.courseEyebrow')}</p>
          <h1>{course.title}</h1>
          <p className="lead">{course.description}</p>
          <div className="path-hero__meta">
            <DifficultyBadge level={course.difficulty} />
          </div>
        </div>
        {course.progress && (
          <div className="course-home__status">
            <ProgressRing value={course.progress.percent} label={t('player.courseProgressLabel', { n: course.progress.percent })} />
            <p className="small">
              {t('player.lessonsDone', { done: fmt.number(course.progress.lessonsCompleted), total: fmt.number(course.progress.lessonsTotal) })}
              <br />
              {t('player.quizzesPassed', { done: fmt.number(course.progress.quizzesPassed), total: fmt.number(course.progress.quizzesTotal) })}
            </p>
            {course.certificateId ? (
              <Link to={`/certificates/${course.certificateId}`} className="btn btn--accent">
                <Award size={18} aria-hidden="true" /> {t('certificate.view')}
              </Link>
            ) : target ? (
              <Link to={resumeTarget || target} className="btn btn--primary">
                <PlayCircle size={18} aria-hidden="true" />
                {resumeTarget ? t('player.resume', { title: course.resume.title }) : course.progress.percent ? t('player.continue') : t('player.start')}
              </Link>
            ) : null}
          </div>
        )}
      </section>

      {course.nextStep && (
        <section className="panel next-step" aria-labelledby="next-step-h">
          <h2 id="next-step-h">
            <Flag size={18} aria-hidden="true" /> {t('player.nextStep')}
          </h2>
          <p>
            {course.nextStep.type === 'QUIZ'
              ? t(course.nextStep.retake ? 'player.nextRetake' : 'player.nextQuiz', { module: course.nextStep.moduleTitle })
              : course.nextStep.type === 'COURSE'
                ? t('player.nextCourse', { title: course.nextStep.title, module: course.nextStep.moduleTitle })
                : t('player.nextLesson', { title: course.nextStep.title, module: course.nextStep.moduleTitle })}
          </p>
          {course.nextStep.type === 'COURSE' && (
            <Link to={target} className="btn btn--secondary btn--sm">
              <BookOpen size={15} aria-hidden="true" /> {t('player.openCourse')}
            </Link>
          )}
        </section>
      )}

      {stages.length > 1 && <RoadmapMap course={course} signedIn />}

      {stages.length > 0 && (
        <section aria-labelledby="stages-h" className="stages">
          <h2 id="stages-h">{t(stages.length > 1 ? 'player.stageDetails' : 'player.stages')}</h2>
          {stages.map((m) => (
            <StageCard key={m.id} course={course} stage={m} open={stages.length === 1 || m === stages.find((x) => !x.locked && x.quiz?.state !== 'PASSED')} />
          ))}
        </section>
      )}

      {course.learningOutcomes.length > 0 && (
        <section className="panel" aria-labelledby="outcomes-h">
          <h2 id="outcomes-h">{t('player.outcomes')}</h2>
          <ul className="checklist">
            {course.learningOutcomes.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        </section>
      )}

      {course.prerequisites.length > 0 && (
        <section className="panel" aria-labelledby="prereq-h">
          <h2 id="prereq-h">{t('path.prerequisites')}</h2>
          <ul>
            {course.prerequisites.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="panel" aria-labelledby="readings-h">
        <h2 id="readings-h">
          <Library size={18} aria-hidden="true" /> {t('player.allReadings')}
        </h2>
        {course.modules.map((m) =>
          m.readings.length ? (
            <div key={m.id} id={`readings-${m.id}`} className="readings-group">
              <h3>{m.title}</h3>
              <ReadingList readings={m.readings} />
            </div>
          ) : null,
        )}
      </section>

      {course.sources.length > 0 && <SourceList sources={course.sources} />}
    </div>
  );
}

// One roadmap stage: time, prerequisites, outcomes, linked courses, skip test, exercises, specialties and next steps
export function StageCard({ course, stage: m, open }) {
  const { t, fmt } = useI18n();
  const testOut = m.quiz?.testOut;
  return (
    <details id={`stage-${m.id}`} className={`panel stage ${m.locked ? 'is-locked' : ''}`} open={open}>
      <summary className="stage__head">
        <span className="stage__title">
          {m.locked && <Lock size={16} aria-label={t('player.locked')} />} {m.title}
        </span>
        {m.quiz?.state === 'PASSED' && <span className="chip chip--done">{m.skipped ? t('player.skipped') : t('player.quizState.PASSED')}</span>}
      </summary>
      {m.description && <p>{m.description}</p>}
      {m.timeEstimate && (
        <p className="small">
          <Clock size={15} aria-hidden="true" /> <strong>{t('player.stageTime')}:</strong> {m.timeEstimate}
        </p>
      )}
      {m.videoSeconds > 0 && (
        <p className="small">
          <PlayCircle size={15} aria-hidden="true" /> {t('video.total', { d: fmt.duration(minutesOf(m.videoSeconds)) })}
        </p>
      )}
      {m.locked && m.reasons.length > 0 && (
        <Alert type="info">
          <ul>
            {m.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </Alert>
      )}
      <div className="stage__grid">
        {m.prerequisiteNotes.length > 0 && (
          <div>
            <h3>{t('player.stagePrereqs')}</h3>
            <ul>
              {m.prerequisiteNotes.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        )}
        {m.learningOutcomes.length > 0 && (
          <div>
            <h3>{t('player.stageOutcomes')}</h3>
            <ul className="checklist">
              {m.learningOutcomes.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {m.linkedCourses.length > 0 && (
        <div className="stage__courses">
          <h3>{t('player.stageCourses')}</h3>
          <p className="small muted">{t('player.stageCoursesLead')}</p>
          <ul className="stage__course-list">
            {m.linkedCourses.map((c) => (
              <li key={c.id} className="stage__course">
                <div>
                  <strong>{c.title}</strong>
                  {c.summary && <p className="small muted">{c.summary}</p>}
                  <ProgressBar value={c.percent} size="sm" label={t('player.coursePercent', { n: c.percent })} />
                </div>
                {m.locked ? (
                  <span className="chip">
                    <Lock size={13} aria-hidden="true" /> {t('player.locked')}
                  </span>
                ) : (
                  <Link to={`/learn/${c.slug}`} className="btn btn--secondary btn--sm">
                    {c.completed ? <CheckCircle2 size={15} aria-hidden="true" /> : <BookOpen size={15} aria-hidden="true" />}{' '}
                    {c.completed ? t('player.courseDone') : t('player.openCourse')}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {testOut?.available && (
        <div className="stage__skip">
          <p>
            {t('player.skipTestLead', {
              n: fmt.number(m.quiz.questionCount),
              pass: fmt.number(m.quiz.passPercent),
              left: fmt.number(testOut.attemptsLeft),
              total: fmt.number(testOut.attemptsAllowed),
            })}
          </p>
          <Link to={`/learn/${course.slug}/quiz/${m.id}?mode=skip`} className="btn btn--secondary btn--sm">
            <SkipForward size={15} aria-hidden="true" /> {t('player.takeSkipTest')}
          </Link>
        </div>
      )}
      {m.practice && (
        <div id={`practice-${m.id}`} className="stage__practice">
          <h3>{t('player.stagePractice')}</h3>
          <Markdown>{m.practice}</Markdown>
        </div>
      )}
      {m.specialties.length > 0 && (
        <div className="stage__specialties">
          <h3>{t('player.specialties')}</h3>
          <p className="small muted">{t('player.accessLegend')}</p>
          <ul className="specialty-list">
            {m.specialties.map((sp) => (
              <li key={sp.key} className="specialty">
                <h4>
                  <Briefcase size={16} aria-hidden="true" /> {sp.title}
                </h4>
                <p className="small">{sp.summary}</p>
                {sp.roles.length > 0 && (
                  <p className="small muted">
                    {t('player.specialtyRoles')}: {sp.roles.join(', ')}
                  </p>
                )}
                {sp.courses.length > 0 && (
                  <p className="small">
                    {t('player.specialtyCourses')}:{' '}
                    {sp.courses.map((c, i) => (
                      <span key={c.slug}>
                        {i > 0 && ', '}
                        <Link to={`/learn/${c.slug}`}>{c.title}</Link>
                      </span>
                    ))}
                  </p>
                )}
                {sp.resources.length > 0 && (
                  <ul className="reading-list">
                    {sp.resources.map((r) => (
                      <li key={r.url}>
                        <AccessChip access={r.access} />
                        <a href={r.url} target="_blank" rel="noopener noreferrer">
                          {r.title} <ExternalLink size={13} aria-label={t('common.opensNewTab')} />
                        </a>
                        <span className="reading-list__meta">{[r.publisher, r.note].filter(Boolean).join(' · ')}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {m.nextSteps && (
        <div className="stage__next">
          <h3>{t('player.stageNext')}</h3>
          <Markdown>{m.nextSteps}</Markdown>
        </div>
      )}
    </details>
  );
}

// Free, Free account or Paid
export function AccessChip({ access }) {
  const { t } = useI18n();
  if (!access) return null;
  return <span className={`chip chip--access chip--access-${access.toLowerCase()}`}>{t(`access.${access}`)}</span>;
}

export function ReadingList({ readings }) {
  const { t } = useI18n();
  return (
    <ul className="reading-list">
      {readings.map((r) => (
        <li key={r.id}>
          <span className={`chip chip--reading`}>{t(`readingKind.${r.kind}`)}</span>
          <AccessChip access={r.access} />
          <a href={r.url} target="_blank" rel="noopener noreferrer">
            {r.title} <ExternalLink size={13} aria-label={t('common.opensNewTab')} />
          </a>
          <span className="reading-list__meta">
            {[r.authors, r.publisher, r.year].filter(Boolean).join(' · ')}
          </span>
          {r.note && <span className="reading-list__note">{r.note}</span>}
        </li>
      ))}
    </ul>
  );
}

function SourceList({ sources }) {
  const { t } = useI18n();
  return (
    <section className="panel" aria-labelledby="sources-h">
      <h2 id="sources-h">{t('player.sources')}</h2>
      <p className="small muted">{t('player.sourcesLead')}</p>
      <ul className="reading-list">
        {sources.map((s) => (
          <li key={s.url}>
            <a href={s.url} target="_blank" rel="noopener noreferrer">
              {s.title} <ExternalLink size={13} aria-label={t('common.opensNewTab')} />
            </a>
            <span className="reading-list__meta">{[s.author, s.license].filter(Boolean).join(' · ')}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ── Lesson view ─────────────────────────────────────────────────
function LessonView({ course, lessonId, onCourseChanged }) {
  const { t, fmt } = useI18n();
  const { user, isStaff } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { data, error, loading, reload } = useFetch(`/api/lessons/${lessonId}`);
  const playerRef = useRef(null);
  const [watch, setWatch] = useState(null);
  const [completion, setCompletion] = useState(null);
  const [answered, setAnswered] = useState(() => new Set());
  const [active, setActive] = useState(null);
  const [tab, setTab] = useState('overview');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [completing, setCompleting] = useState(false);
  const dismissed = useRef(new Set());
  const lesson = data?.lesson;
  // With a pass mark, a question counts as done only when answered correctly; otherwise answering is enough
  const gated = course.checkpointPassPercent != null;

  useActivityHeartbeat(lessonId, Boolean(lesson) && user?.role === 'STUDENT');

  useEffect(() => {
    if (!lesson) return;
    setWatch(lesson.videoProgress);
    setCompletion(lesson.completion);
    setAnswered(new Set(lesson.checkpoints.filter((c) => (gated ? c.correct : c.answered)).map((c) => c.id)));
    setActive(null);
    dismissed.current = new Set();
  }, [lesson, gated]);

  const steps = useMemo(() => courseSteps(course), [course]);
  const index = steps.findIndex((s) => s.type === 'LESSON' && s.id === lessonId);
  const next = index >= 0 ? steps[index + 1] : null;
  const previous = index > 0 ? steps[index - 1] : null;
  const module = steps[index]?.module;
  const completed = Boolean(lesson?.isCompleted) || steps[index]?.state === 'COMPLETED';

  const handleCompletion = useCallback(
    (res) => {
      if (res?.completion) setCompletion(res.completion);
      if (res?.lessonCompleted) {
        toast.success(t('player.lessonComplete'));
        onCourseChanged();
        reload();
      }
      if (res?.certificate) toast.success(t('certificate.earned'));
    },
    [onCourseChanged, reload, t, toast],
  );

  const reportProgress = useCallback(
    async (body) => {
      try {
        const res = await api(`/api/lessons/${lessonId}/video-progress`, { method: 'POST', body });
        setWatch(res.videoProgress);
        handleCompletion(res);
      } catch {
        /* progress reports are retried with the next interval */
      }
    },
    [lessonId, handleCompletion],
  );

  const onTime = useCallback(
    (position) => {
      if (!lesson || active) return;
      const due = lesson.checkpoints.find(
        (c) => !answered.has(c.id) && !dismissed.current.has(c.id) && c.triggerSeconds != null && position >= c.triggerSeconds,
      );
      if (due) {
        playerRef.current?.pause();
        setActive(due);
      }
    },
    [lesson, answered, active],
  );

  const onCheckpointAnswered = (cp, result) => {
    if (result.isCorrect || !gated) setAnswered((s) => new Set(s).add(cp.id));
    handleCompletion(result);
  };

  // Wrong answer in a gated course: go back to the previous question (or the start) and watch that part again.
  // The question is not dismissed, so it appears again when the video reaches it.
  const rewatch = () => {
    const earlier = lesson.checkpoints.filter((c) => c.triggerSeconds != null && c.triggerSeconds < (active?.triggerSeconds ?? 0));
    const from = earlier.length ? Math.max(...earlier.map((c) => c.triggerSeconds)) + 1 : 0;
    setActive(null);
    playerRef.current?.seek(from);
    playerRef.current?.play();
  };

  const continueVideo = () => {
    if (active) dismissed.current.add(active.id);
    setActive(null);
    playerRef.current?.play();
  };

  const markComplete = async () => {
    setCompleting(true);
    try {
      const res = await api(`/api/lessons/${lessonId}/progress`, { method: 'PUT', body: { isCompleted: true } });
      toast.success(t('player.lessonComplete'));
      if (res.certificate) toast.success(t('certificate.earned'));
      onCourseChanged();
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCompleting(false);
    }
  };

  if (loading && !lesson) return <PageSkeleton />;
  if (error) {
    if (error.code === 'LESSON_LOCKED' || error.code === 'MODULE_LOCKED') {
      return (
        <div className="locked-page panel">
          <Lock size={32} aria-hidden="true" />
          <h1>{t('player.lockedTitle')}</h1>
          <p>{error.message}</p>
          {error.details?.reasons?.length > 0 && (
            <ul>
              {error.details.reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          )}
          {error.details?.previousLessonId ? (
            <Link className="btn btn--primary" to={`/learn/${course.slug}/${error.details.previousLessonId}`}>
              <ArrowLeft size={16} aria-hidden="true" /> {t('player.goToPrevious')}
            </Link>
          ) : (
            <Link className="btn btn--primary" to={`/learn/${course.slug}`}>
              {t('player.backToCourse')}
            </Link>
          )}
        </div>
      );
    }
    return <ErrorState error={error} onRetry={reload} />;
  }

  const unanswered = lesson.checkpoints.filter((c) => !answered.has(c.id));
  const canMarkComplete = !completed && completion?.canComplete;

  return (
    <article className="lesson-player" aria-labelledby="lesson-title">
      <div className="lesson-player__stage">
        {lesson.video ? (
          <VideoPlayer
            key={lesson.id}
            ref={playerRef}
            video={lesson.video}
            startAt={watch && !watch.completed ? watch.position : 0}
            onProgress={reportProgress}
            onTime={onTime}
            title={lesson.title}
          />
        ) : (
          <div className="video-frame video-frame--empty">
            <p>{t('player.noVideo')}</p>
          </div>
        )}
        {active && (
          <div className="lesson-player__overlay">
            <CheckpointCard
              key={active.id}
              checkpoint={active}
              overlay
              showReview={isStaff}
              onAnswered={(r) => onCheckpointAnswered(active, r)}
              onContinue={continueVideo}
              onRewatch={lesson.video ? rewatch : undefined}
            />
          </div>
        )}
      </div>

      <header className="lesson-player__head">
        <div>
          <p className="eyebrow">
            {module?.title} · {t('player.lessonOf', { n: fmt.number(index + 1), total: fmt.number(steps.length) })}
          </p>
          <h1 id="lesson-title">{lesson.title}</h1>
          {lesson.video && (
            <p className="small video-runtime">
              {videoLabel(t, fmt, { seconds: lesson.video.duration, runtimeSeconds: lesson.video.runtimeSeconds, isClip: lesson.video.isClip })}
              {lesson.video.isClip && lesson.video.end != null && (
                <> · {t('video.plays', { from: clockTime(lesson.video.start ?? 0), to: clockTime(lesson.video.end) })}</>
              )}
            </p>
          )}
          {lesson.video?.credit && (
            <p className="small muted video-credit">
              {t('player.videoBy', { credit: lesson.video.credit })}{' '}
              {lesson.video.sourceUrl && (
                <a href={lesson.video.sourceUrl} target="_blank" rel="noopener noreferrer">
                  {t('player.watchOnSource')} <ExternalLink size={12} aria-label={t('common.opensNewTab')} />
                </a>
              )}
            </p>
          )}
        </div>
        {isStaff && (
          <button type="button" className="btn btn--secondary btn--sm" onClick={() => setUploadOpen(true)}>
            <Upload size={15} aria-hidden="true" /> {t('upload.button')}
          </button>
        )}
      </header>

      <section className={`completion-card ${completed ? 'is-done' : ''}`} aria-live="polite">
        {completed ? (
          <p className="success-text">
            <CheckCircle2 size={18} aria-hidden="true" /> {t('player.completed')}
          </p>
        ) : (
          <>
            <div className="completion-card__rows">
              {lesson.video && (
                <div>
                  <span className="small">{t('player.watched', { n: fmt.number(watch?.percent ?? 0) })}</span>
                  <ProgressBar value={watch?.percent ?? 0} size="sm" label={t('player.watchedLabel')} />
                </div>
              )}
              {lesson.checkpoints.length > 0 && (
                <p className="small">
                  {gated
                    ? t('player.checkpointsCorrect', {
                        done: fmt.number(answered.size),
                        total: fmt.number(lesson.checkpoints.length),
                        pass: fmt.number(course.checkpointPassPercent),
                      })
                    : t('player.checkpointsAnswered', { done: fmt.number(answered.size), total: fmt.number(lesson.checkpoints.length) })}
                </p>
              )}
            </div>
            {completion?.blockers?.length > 0 && <p className="small muted">{t('player.toComplete', { list: completion.blockers.join('; ') })}</p>}
            {canMarkComplete && (
              <button className="btn btn--primary btn--sm" onClick={markComplete} disabled={completing}>
                <CheckCircle2 size={15} aria-hidden="true" /> {t('player.markComplete')}
              </button>
            )}
          </>
        )}
        <div className="completion-card__nav">
          {previous && (
            <Link className="btn btn--ghost btn--sm" to={stepPath(course.slug, previous)}>
              <ArrowLeft size={15} aria-hidden="true" /> {t('player.previous')}
            </Link>
          )}
          {next &&
            (completed || isStaff ? (
              <button className="btn btn--primary btn--sm" onClick={() => navigate(stepPath(course.slug, next))}>
                {next.type === 'QUIZ' ? t('player.toQuiz') : t('player.next')} <ArrowRight size={15} aria-hidden="true" />
              </button>
            ) : (
              <button className="btn btn--primary btn--sm" disabled aria-describedby="next-locked">
                <Lock size={15} aria-hidden="true" /> {next.type === 'QUIZ' ? t('player.toQuiz') : t('player.next')}
              </button>
            ))}
          {next && !completed && !isStaff && (
            <span id="next-locked" className="sr-only">
              {t('player.nextLockedHint')}
            </span>
          )}
        </div>
      </section>

      <div className="tabs" role="tablist" aria-label={t('player.lessonSections')}>
        {[
          ['overview', BookOpen, t('player.overview')],
          ['questions', ListChecks, t('player.questionsTab', { n: lesson.checkpoints.length })],
          ['readings', Library, t('player.readings')],
        ].map(([key, Icon, label]) => (
          <button key={key} type="button" role="tab" id={`tab-${key}`} aria-selected={tab === key} aria-controls={`panel-${key}`} onClick={() => setTab(key)}>
            <Icon size={14} aria-hidden="true" /> {label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="lesson-player__panel">
        {tab === 'overview' && (
          <>
            <Markdown>{lesson.content}</Markdown>
            {lesson.keyTakeaways.length > 0 && (
              <div className="takeaways">
                <h2>{t('lesson.takeaways')}</h2>
                <ul>
                  {lesson.keyTakeaways.map((k) => (
                    <li key={k}>{k}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
        {tab === 'questions' && (
          <>
            {lesson.checkpoints.length === 0 && <p className="muted">{t('player.noCheckpoints')}</p>}
            {unanswered.length > 0 && <Alert type="info">{t('player.checkpointsHint')}</Alert>}
            {lesson.checkpoints.map((c) => (
              <div key={c.id} className="checkpoint-row">
                <p className="small muted">{t('player.appearsAt', { time: formatClock(c.triggerSeconds) })}</p>
                {answered.has(c.id) ? (
                  <p className="success-text">
                    <CheckCircle2 size={16} aria-hidden="true" /> {c.question}
                  </p>
                ) : (
                  <CheckpointCard checkpoint={c} showReview={isStaff} onAnswered={(r) => onCheckpointAnswered(c, r)} />
                )}
              </div>
            ))}
          </>
        )}
        {tab === 'readings' && (module?.readings.length ? <ReadingList readings={module.readings} /> : <p className="muted">{t('player.noReadings')}</p>)}
      </div>

      {uploadOpen && (
        <VideoUploadDialog
          initial={{ roadmapId: course.id, moduleId: module?.id, lessonId }}
          onClose={() => setUploadOpen(false)}
          onUploaded={() => {
            setUploadOpen(false);
            reload();
            onCourseChanged();
          }}
        />
      )}
    </article>
  );
}

export function formatClock(seconds) {
  if (seconds == null) return '';
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}

export default function CoursePlayer() {
  const { slug, lessonId } = useParams();
  const { data, error, loading, reload } = useFetch(`/api/courses/${encodeURIComponent(slug)}/outline`);

  if (loading && !data) return <PageSkeleton />;
  if (error)
    return (
      <div className="container page">
        <ErrorState error={error} onRetry={error.status === 404 ? null : reload} />
      </div>
    );
  const course = data.course;
  if (!course.isSequential) return <Navigate to={`/paths/${slug}`} replace />;

  return (
    <PlayerFrame course={course} currentId={lessonId}>
      {lessonId ? <LessonView course={course} lessonId={lessonId} onCourseChanged={reload} /> : <CourseHome course={course} />}
    </PlayerFrame>
  );
}
