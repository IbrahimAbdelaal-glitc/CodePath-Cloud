import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowRight, Award, CheckCircle2, ClipboardCheck, History, Lock, RotateCcw, Send, SkipForward, XCircle } from 'lucide-react';
import { api } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { useI18n } from '../i18n/I18nContext.jsx';
import { useFetch } from '../lib/useFetch.js';
import { ProgressRing } from '../components/Badges.jsx';
import { Alert, ErrorState, PageSkeleton } from '../components/States.jsx';
import AnswerInput, { answerPayload, isAnswered } from '../components/AnswerInput.jsx';
import { PlayerFrame, ReadingList, courseSteps, stepPath } from './CoursePlayer.jsx';

// One sitting of a module's block quiz: questions drawn at random from the bank, graded on the server
function QuizSitting({ sitting, onSubmitted, onCancel }) {
  const { t, fmt } = useI18n();
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const answeredCount = sitting.questions.filter((q) => isAnswered(q, answers[q.id])).length;

  const submit = async (e) => {
    e.preventDefault();
    const missing = sitting.questions.length - answeredCount;
    if (missing > 0 && !window.confirm(t('blockQuiz.confirmUnanswered', { n: missing }))) return;
    setSubmitting(true);
    setError(null);
    try {
      const body = {
        answers: Object.fromEntries(
          sitting.questions.map((q) => [q.id, isAnswered(q, answers[q.id]) ? (q.questionType === 'MULTI_SELECT' ? answers[q.id] : answerPayload(q, answers[q.id])) : null]),
        ),
      };
      const result = await api(`/api/courses/quiz-attempts/${sitting.attempt.id}/submit`, { method: 'POST', body });
      onSubmitted(result);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <form className="block-quiz" onSubmit={submit} noValidate>
      <p className="block-quiz__progress" aria-live="polite">
        {t('blockQuiz.answered', { done: fmt.number(answeredCount), total: fmt.number(sitting.questions.length) })}
      </p>
      <ol className="block-quiz__list">
        {sitting.questions.map((q, i) => (
          <li key={q.id} className="quiz">
            <header className="quiz__head">
              <span className="quiz__num">{fmt.number(i + 1)}</span>
              <span className={`chip chip--${q.questionType.toLowerCase()}`}>{t(`questionType.${q.questionType}`)}</span>
              {q.lessonTitle && <span className="chip chip--topic">{q.lessonTitle}</span>}
            </header>
            <h2 className="quiz__question" id={`bq-${q.id}`}>
              {q.question}
            </h2>
            <AnswerInput question={q} value={answers[q.id]} name={`bq-${q.id}`} onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))} disabled={submitting} />
          </li>
        ))}
      </ol>
      {error && <Alert>{error}</Alert>}
      <div className="form-actions">
        <button className="btn btn--primary" disabled={submitting}>
          <Send size={16} aria-hidden="true" /> {submitting ? t('blockQuiz.submitting') : t('blockQuiz.submit')}
        </button>
        <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={submitting}>
          {t('common.cancel')}
        </button>
      </div>
    </form>
  );
}

function QuizResults({ result, onRetake, nextTo, module, skip }) {
  const { t, fmt } = useI18n();
  const { attempt, passPercent, results } = result;
  return (
    <div className="block-quiz-results">
      <section className={`panel result-summary ${attempt.passed ? 'is-pass' : 'is-fail'}`} role="status" aria-live="polite">
        <ProgressRing value={attempt.percent} label={t('blockQuiz.scoreLabel', { n: attempt.percent })} />
        <div>
          <h2>{attempt.passed ? t('blockQuiz.passedTitle') : t('blockQuiz.failedTitle')}</h2>
          <p>
            {t('blockQuiz.scoreLine', { correct: fmt.number(attempt.correct), total: fmt.number(attempt.total), pass: passPercent })}
          </p>
          <div className="form-actions">
            {attempt.passed && nextTo && (
              <Link className="btn btn--primary" to={nextTo}>
                {t('blockQuiz.continue')} <ArrowRight size={16} aria-hidden="true" />
              </Link>
            )}
            {result.certificate && (
              <Link className="btn btn--accent" to={`/certificates/${result.certificate.id}`}>
                <Award size={16} aria-hidden="true" /> {t('certificate.view')}
              </Link>
            )}
            {onRetake && (
              <button className="btn btn--secondary" onClick={onRetake}>
                <RotateCcw size={16} aria-hidden="true" /> {attempt.passed ? t('blockQuiz.practiceAgain') : t('blockQuiz.retake')}
              </button>
            )}
          </div>
          {!attempt.passed && <p className="small muted">{skip ? t('blockQuiz.skipFailedHint') : t('blockQuiz.failedHint')}</p>}
        </div>
      </section>

      <h2>{t('blockQuiz.review')}</h2>
      <ol className="block-quiz__list">
        {results.map((q, i) => (
          <li key={q.id} className={`quiz ${q.isCorrect ? 'quiz--correct' : 'quiz--wrong'}`}>
            <header className="quiz__head">
              <span className="quiz__num">{fmt.number(i + 1)}</span>
              {q.isCorrect ? (
                <span className="success-text">
                  <CheckCircle2 size={16} aria-hidden="true" /> {t('blockQuiz.correct')}
                </span>
              ) : (
                <span className="warn-text">
                  <XCircle size={16} aria-hidden="true" /> {q.yourAnswer == null ? t('blockQuiz.unanswered') : t('blockQuiz.incorrect')}
                </span>
              )}
              {q.lessonTitle && <span className="chip chip--topic">{q.lessonTitle}</span>}
            </header>
            <h3 className="quiz__question">{q.question}</h3>
            <AnswerInput question={q} value={q.yourAnswer ?? ''} onChange={() => {}} disabled review={{ correctAnswer: q.correctAnswer }} />
            <p className="feedback__why">
              <strong>{t('quiz.why')} </strong>
              {q.explanation}
            </p>
          </li>
        ))}
      </ol>
      {module?.readings?.length > 0 && (
        <section className="panel" aria-labelledby="quiz-readings">
          <h2 id="quiz-readings">{t('player.readings')}</h2>
          <ReadingList readings={module.readings} />
        </section>
      )}
    </div>
  );
}

// mode=skip in the URL opens the skip test (taken before the lessons) instead of the exam
function QuizView({ course, moduleId, onCourseChanged }) {
  const { t, fmt } = useI18n();
  const [params] = useSearchParams();
  const skip = params.get('mode') === 'skip';
  const toast = useToast();
  const navigate = useNavigate();
  const overview = useFetch(`/api/courses/modules/${moduleId}/quiz`);
  const [sitting, setSitting] = useState(null);
  const [result, setResult] = useState(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);

  const steps = courseSteps(course);
  const index = steps.findIndex((s) => s.type === 'QUIZ' && s.id === moduleId);
  const next = index >= 0 ? steps[index + 1] : null;
  const module = course.modules.find((m) => m.id === moduleId);

  const start = async () => {
    setStarting(true);
    setError(null);
    try {
      setResult(null);
      setSitting(await api(`/api/courses/modules/${moduleId}/quiz/attempts`, { method: 'POST', body: { mode: skip ? 'TEST_OUT' : 'EXAM' } }));
      window.scrollTo({ top: 0 });
    } catch (err) {
      setError(err.message);
    } finally {
      setStarting(false);
    }
  };

  const openReview = async (attemptId) => {
    try {
      setResult(await api(`/api/courses/quiz-attempts/${attemptId}`));
      setSitting(null);
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (overview.loading && !overview.data) return <PageSkeleton />;
  if (overview.error) return <ErrorState error={overview.error} onRetry={overview.reload} />;
  const o = overview.data;
  // In skip mode the gate, the lead text and the retake rule come from the skip test
  const gate = skip ? o.testOut || { locked: true, reasons: [], attemptsLeft: 0, attemptsAllowed: 0 } : o;

  return (
    <article className="quiz-page" aria-labelledby="quiz-title">
      <header className="lesson-player__head">
        <div>
          <p className="eyebrow">{o.module.title}</p>
          <h1 id="quiz-title">
            {skip ? <SkipForward size={24} aria-hidden="true" /> : <ClipboardCheck size={24} aria-hidden="true" />}{' '}
            {skip ? t('blockQuiz.skipTitle') : t('blockQuiz.title')}
          </h1>
          <p className="muted">
            {t(skip ? 'blockQuiz.skipLead' : 'blockQuiz.lead', { n: fmt.number(o.module.questionCount), bank: fmt.number(o.module.bankSize), pass: o.module.passPercent })}
          </p>
        </div>
      </header>

      {sitting ? (
        <QuizSitting
          sitting={sitting}
          onCancel={() => setSitting(null)}
          onSubmitted={(r) => {
            setSitting(null);
            setResult(r);
            window.scrollTo({ top: 0 });
            if (r.attempt.passed) toast.success(skip ? t('blockQuiz.skipPassedToast') : t('blockQuiz.passedToast'));
            if (r.certificate) toast.success(t('certificate.earned'));
            overview.reload();
            onCourseChanged();
          }}
        />
      ) : result ? (
        <QuizResults
          result={result}
          module={module}
          skip={skip}
          onRetake={skip && (result.attempt.passed || !(o.testOut?.attemptsLeft > 0)) ? null : start}
          nextTo={next ? stepPath(course.slug, next) : `/learn/${course.slug}`}
        />
      ) : (
        <section className="panel quiz-intro">
          {gate.locked ? (
            <>
              <p className="warn-text">
                <Lock size={16} aria-hidden="true" /> {skip ? t('blockQuiz.skipLocked') : t('blockQuiz.locked')}
              </p>
              <ul>
                {gate.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </>
          ) : (
            <>
              {o.passed && (
                <p className="success-text">
                  <CheckCircle2 size={18} aria-hidden="true" /> {t('blockQuiz.alreadyPassed', { n: o.bestPercent })}
                </p>
              )}
              <ul className="quiz-intro__rules">
                <li>{t('blockQuiz.rule1', { n: fmt.number(o.module.questionCount) })}</li>
                <li>{t('blockQuiz.rule2', { pass: o.module.passPercent })}</li>
                <li>
                  {skip
                    ? t('blockQuiz.skipRule', { left: fmt.number(gate.attemptsLeft), total: fmt.number(gate.attemptsAllowed) })
                    : t('blockQuiz.rule3')}
                </li>
              </ul>
              {error && <Alert>{error}</Alert>}
              <div className="form-actions">
                <button className="btn btn--primary" onClick={start} disabled={starting}>
                  {skip ? <SkipForward size={16} aria-hidden="true" /> : <ClipboardCheck size={16} aria-hidden="true" />}{' '}
                  {skip ? t('blockQuiz.skipStart') : o.attempts.length ? t('blockQuiz.startAgain') : t('blockQuiz.start')}
                </button>
                {o.passed && next && (
                  <button className="btn btn--secondary" onClick={() => navigate(stepPath(course.slug, next))}>
                    {t('blockQuiz.continue')} <ArrowRight size={16} aria-hidden="true" />
                  </button>
                )}
              </div>
            </>
          )}
        </section>
      )}

      {!sitting && o.attempts.length > 0 && (
        <section className="panel" aria-labelledby="attempts-h">
          <h2 id="attempts-h">
            <History size={18} aria-hidden="true" /> {t('blockQuiz.history')}
          </h2>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">{t('blockQuiz.date')}</th>
                  <th scope="col">{t('blockQuiz.mode')}</th>
                  <th scope="col">{t('blockQuiz.score')}</th>
                  <th scope="col">{t('blockQuiz.result')}</th>
                  <th scope="col">
                    <span className="sr-only">{t('blockQuiz.review')}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {o.attempts.map((a) => (
                  <tr key={a.id}>
                    <td>{fmt.date(a.submittedAt)}</td>
                    <td>{a.mode === 'TEST_OUT' ? t('blockQuiz.modeSkip') : t('blockQuiz.modeExam')}</td>
                    <td>
                      {fmt.number(a.correct)}/{fmt.number(a.total)} ({a.percent}%)
                    </td>
                    <td>{a.passed ? <span className="success-text">{t('blockQuiz.pass')}</span> : <span className="warn-text">{t('blockQuiz.fail')}</span>}</td>
                    <td>
                      <button className="btn btn--ghost btn--sm" onClick={() => openReview(a.id)}>
                        {t('blockQuiz.review')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </article>
  );
}

export default function BlockQuiz() {
  const { slug, moduleId } = useParams();
  const { data, error, loading, reload } = useFetch(`/api/courses/${encodeURIComponent(slug)}/outline`);
  if (loading && !data) return <PageSkeleton />;
  if (error)
    return (
      <div className="container page">
        <ErrorState error={error} onRetry={reload} />
      </div>
    );
  return (
    <PlayerFrame course={data.course} currentId={moduleId}>
      <QuizView key={moduleId} course={data.course} moduleId={moduleId} onCourseChanged={reload} />
    </PlayerFrame>
  );
}
