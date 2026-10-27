import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Circle,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Lightbulb,
  ListChecks,
  PlayCircle,
  ScrollText,
  Target,
  Eye,
} from 'lucide-react';
import { api } from '../api/client.js';
import { useI18n } from '../i18n/I18nContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useActivityHeartbeat } from '../lib/useActivityHeartbeat.js';
import { useFetch } from '../lib/useFetch.js';
import { DifficultyBadge } from '../components/Badges.jsx';
import LockNotice from '../components/LockNotice.jsx';
import Markdown from '../components/Markdown.jsx';
import QuizCard from '../components/QuizCard.jsx';
import { ErrorState, PageSkeleton } from '../components/States.jsx';

const resourceIcons = { ARTICLE: FileText, VIDEO: PlayCircle, DOCUMENTATION: ScrollText };

export default function Lesson() {
  const { id } = useParams();
  const { t, fmt, dir } = useI18n();
  const toast = useToast();
  const { user } = useAuth();
  const { data, error, loading, reload, mutate } = useFetch(`/api/lessons/${id}`);
  const [busy, setBusy] = useState(null);
  const [topics, setTopics] = useState([]);
  const [earned, setEarned] = useState(null);
  useActivityHeartbeat(id, Boolean(data?.lesson) && user?.role === 'STUDENT');

  useEffect(() => setEarned(null), [id]);

  useEffect(() => {
    if (data?.lesson) setTopics(data.lesson.topics);
  }, [data]);

  if (loading) return <PageSkeleton />;

  if (error) {
    return (
      <div className="container page page--narrow">
        {error.code === 'MODULE_LOCKED' ? (
          <div className="locked-page">
            <h1>{t('lesson.lockedTitle')}</h1>
            <LockNotice access={error.details} roadmapSlug={error.details?.roadmapSlug} />
            {error.details?.roadmapSlug && (
              <Link to={`/paths/${error.details.roadmapSlug}`} className="btn btn--secondary">
                {t('lesson.backToPath')}
              </Link>
            )}
          </div>
        ) : (
          <ErrorState error={error} onRetry={error.status === 404 ? null : reload} />
        )}
      </div>
    );
  }

  const lesson = data.lesson;
  // Video courses are taken in the course player, which enforces their sequence
  if (lesson.roadmap.isSequential) return <Navigate to={`/learn/${lesson.roadmap.slug}/${lesson.id}`} replace />;
  const Prev = dir === 'rtl' ? ArrowRight : ArrowLeft;
  const Next = dir === 'rtl' ? ArrowLeft : ArrowRight;

  const toggleComplete = async () => {
    setBusy('complete');
    try {
      const { progress, certificate } = await api(`/api/lessons/${id}/progress`, {
        method: 'PUT',
        body: { isCompleted: !lesson.isCompleted },
      });
      mutate((d) => ({ ...d, lesson: { ...d.lesson, isCompleted: progress.isCompleted } }));
      if (certificate) setEarned(certificate);
      toast.success(
        certificate ? t('certificate.earned') : progress.isCompleted ? t('lesson.markedDone') : t('lesson.markedUndone'),
      );
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  };

  const toggleBookmark = async () => {
    setBusy('bookmark');
    try {
      const { bookmarked } = await api(`/api/lessons/${id}/bookmark`, { method: lesson.isBookmarked ? 'DELETE' : 'PUT' });
      mutate((d) => ({ ...d, lesson: { ...d.lesson, isBookmarked: bookmarked } }));
      toast.success(bookmarked ? t('lesson.bookmarkAdded') : t('lesson.bookmarkRemoved'));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  };

  const markReviewed = async (tag) => {
    setBusy(`review-${tag}`);
    try {
      const { topic } = await api(`/api/me/weaknesses/${encodeURIComponent(tag)}/review`, { method: 'POST' });
      setTopics((ts) => ts.map((x) => (x.tag === tag ? { ...x, status: topic.status, accuracy: topic.accuracy } : x)));
      toast.success(topic.status === 'OK' ? t('lesson.reviewResolved') : t('lesson.reviewRecorded'));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  };

  const onQuizResult = (r) => {
    setTopics((ts) => ts.map((x) => (x.tag === r.topic.tag ? { ...x, status: r.topic.status, accuracy: r.topic.accuracy } : x)));
  };

  const weak = topics.filter((x) => x.status !== 'OK');

  return (
    <div className="container page lesson-layout">
      <article className="lesson">
        <nav className="crumbs" aria-label={t('common.breadcrumb')}>
          <Link to="/paths">{t('nav.paths')}</Link>
          <span aria-hidden="true">/</span>
          <Link to={`/paths/${lesson.roadmap.slug}`}>
            {lesson.roadmap.title}
          </Link>
          <span aria-hidden="true">/</span>
          <Link to={`/paths/${lesson.roadmap.slug}#module-${lesson.module.id}`}>
            {lesson.module.title}
          </Link>
        </nav>

        <header className="lesson__head">
          <p className="lesson__position">
            {t('lesson.position', { n: fmt.number(lesson.navigation.position), total: fmt.number(lesson.navigation.total) })}
          </p>
          <h1>{lesson.title}</h1>
          {lesson.summary && (
            <p className="lesson__summary">
              {lesson.summary}
            </p>
          )}
          <div className="lesson__meta">
            <DifficultyBadge level={lesson.difficulty} />
            <span>
              <Clock size={15} aria-hidden="true" /> {fmt.duration(lesson.estimatedMinutes)}
            </span>
            {lesson.quizzes.length > 0 && (
              <span>
                <ListChecks size={15} aria-hidden="true" /> {fmt.count('questions', lesson.quizzes.length)}
              </span>
            )}
          </div>
          <div className="lesson__actions">
            <button
              className={`btn ${lesson.isCompleted ? 'btn--success' : 'btn--primary'}`}
              onClick={toggleComplete}
              disabled={busy === 'complete'}
              aria-pressed={lesson.isCompleted}
            >
              {lesson.isCompleted ? <CheckCircle2 size={18} aria-hidden="true" /> : <Circle size={18} aria-hidden="true" />}
              {lesson.isCompleted ? t('lesson.completed') : t('lesson.markComplete')}
            </button>
            <button
              className="btn btn--secondary"
              onClick={toggleBookmark}
              disabled={busy === 'bookmark'}
              aria-pressed={lesson.isBookmarked}
            >
              {lesson.isBookmarked ? <BookmarkCheck size={18} aria-hidden="true" /> : <Bookmark size={18} aria-hidden="true" />}
              {lesson.isBookmarked ? t('lesson.bookmarked') : t('lesson.bookmark')}
            </button>
          </div>
          {earned && (
            <section className="certificate-earned" role="status" aria-labelledby="earned-title">
              <Award size={28} aria-hidden="true" className="certificate-earned__icon" />
              <div>
                <h2 id="earned-title">{t('certificate.earnedTitle')}</h2>
                <p>{t('certificate.earnedText', { title: lesson.roadmap.title })}</p>
                <div className="certificate-earned__actions">
                  <Link to={`/certificates/${earned.id}`} className="btn btn--primary btn--sm">
                    <Award size={16} aria-hidden="true" />
                    {t('certificate.view')}
                  </Link>
                  <Link to={`/certificates/${earned.id}?download=1`} className="btn btn--secondary btn--sm">
                    <Download size={16} aria-hidden="true" />
                    {t('certificate.download')}
                  </Link>
                </div>
              </div>
            </section>
          )}
          {lesson.preview && (
            <p className="preview-note">
              <Eye size={15} aria-hidden="true" /> {t('path.staffPreview')}
            </p>
          )}
        </header>

        {weak.length > 0 && (
          <section className="review-banner" aria-labelledby="review-title">
            <h2 id="review-title">
              <Target size={18} aria-hidden="true" /> {t('lesson.reviewTitle')}
            </h2>
            <ul>
              {weak.map((x) => (
                <li key={x.tag}>
                  <div>
                    <strong>{x.name}</strong>
                    <span>
                      {t('lesson.accuracy', { n: fmt.number(x.accuracy ?? 0) })} · {t(`topicStatus.${x.status}`)}
                    </span>
                  </div>
                  {x.status === 'NEEDS_REVIEW' && (
                    <button
                      className="btn btn--accent btn--sm"
                      onClick={() => markReviewed(x.tag)}
                      disabled={busy === `review-${x.tag}`}
                    >
                      <CheckCircle2 size={16} aria-hidden="true" />
                      {t('lesson.markReviewed')}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        <Markdown>{lesson.content}</Markdown>

        {lesson.keyTakeaways.length > 0 && (
          <section className="takeaways" aria-labelledby="takeaways-title">
            <h2 id="takeaways-title">
              <Lightbulb size={20} aria-hidden="true" /> {t('lesson.takeaways')}
            </h2>
            <ul>
              {lesson.keyTakeaways.map((k) => (
                <li key={k}>
                  {k}
                </li>
              ))}
            </ul>
          </section>
        )}

        {lesson.quizzes.length > 0 && (
          <section className="quizzes" aria-labelledby="quiz-title">
            <h2 id="quiz-title">{t('lesson.quizTitle')}</h2>
            <p className="muted">{t('lesson.quizLead')}</p>
            {lesson.quizzes.map((q, i) => (
              <QuizCard key={q.id} quiz={q} index={i} onResult={onQuizResult} />
            ))}
          </section>
        )}

        <nav className="lesson-nav" aria-label={t('lesson.navLabel')}>
          {lesson.navigation.previous ? (
            <Link to={`/lessons/${lesson.navigation.previous.id}`} className="lesson-nav__link">
              <Prev size={18} aria-hidden="true" />
              <span>
                <small>{t('lesson.previous')}</small>
                <span>{lesson.navigation.previous.title}</span>
              </span>
            </Link>
          ) : (
            <span />
          )}
          {lesson.navigation.next && (
            <Link to={`/lessons/${lesson.navigation.next.id}`} className="lesson-nav__link lesson-nav__link--next">
              <span>
                <small>{t('lesson.next')}</small>
                <span>{lesson.navigation.next.title}</span>
              </span>
              <Next size={18} aria-hidden="true" />
            </Link>
          )}
        </nav>
      </article>

      <aside className="lesson-aside" aria-label={t('lesson.resources')}>
        <div className="aside-card">
          <h2>{t('lesson.resources')}</h2>
          {lesson.resources.length === 0 ? (
            <p className="muted">{t('lesson.noResources')}</p>
          ) : (
            <ul className="resources">
              {lesson.resources.map((res) => {
                const Icon = resourceIcons[res.type] || FileText;
                return (
                  <li key={res.id}>
                    <a href={res.url} target="_blank" rel="noopener noreferrer">
                      <Icon size={18} aria-hidden="true" />
                      <span>
                        <span>{res.title}</span>
                        <small>{t(`resourceType.${res.type}`)}</small>
                      </span>
                      <ExternalLink size={14} aria-hidden="true" className="ext" />
                      <span className="sr-only">{t('common.opensNewTab')}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}
