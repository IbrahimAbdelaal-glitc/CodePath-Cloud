import { useId, useState } from 'react';
import { CheckCircle2, History, RotateCcw, Send, XCircle } from 'lucide-react';
import { api } from '../api/client.js';
import { useI18n } from '../i18n/I18nContext.jsx';
import CodeBlock from './CodeBlock.jsx';
import { Alert } from './States.jsx';

// Interactive question: the correct answer only reaches the browser after the server grades an attempt
export default function QuizCard({ quiz, index, onResult }) {
  const { t, fmt } = useI18n();
  const id = useId();
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [attempts, setAttempts] = useState(quiz.attempts || []);

  const hasOptions = quiz.options.length > 0;
  const isCodeAnswer = !hasOptions && quiz.questionType !== 'MULTIPLE_CHOICE';

  const submit = async (e) => {
    e.preventDefault();
    if (!answer.trim()) {
      setError(hasOptions ? t('quiz.chooseFirst') : t('quiz.writeFirst'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { result: r } = await api(`/api/quizzes/${quiz.id}/attempts`, { method: 'POST', body: { answer } });
      setResult(r);
      setAttempts((a) => [r.attempt, ...a].slice(0, 10));
      onResult?.(r);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const retry = () => {
    setResult(null);
    setAnswer('');
    setError(null);
  };

  const correctCount = attempts.filter((a) => a.isCorrect).length;

  return (
    <article className={`quiz ${result ? (result.isCorrect ? 'quiz--correct' : 'quiz--wrong') : ''}`} aria-labelledby={`${id}-q`}>
      <header className="quiz__head">
        <span className="quiz__num">{fmt.number(index + 1)}</span>
        <span className={`chip chip--${quiz.questionType.toLowerCase()}`}>{t(`questionType.${quiz.questionType}`)}</span>
        <span className="chip chip--topic">
          {quiz.topic.name}
        </span>
        <span className="quiz__points">{t('quiz.points', { n: fmt.number(quiz.points) })}</span>
      </header>

      <h3 className="quiz__question" id={`${id}-q`}>
        {quiz.question}
      </h3>

      {quiz.codeSnippet && (
        <CodeBlock code={quiz.codeSnippet} highlightBlank={quiz.questionType === 'FILL_IN_THE_BLANK'} />
      )}

      <form onSubmit={submit} noValidate>
        {hasOptions ? (
          <fieldset className="options" disabled={Boolean(result) || submitting}>
            <legend className="sr-only">{t('quiz.choices')}</legend>
            {quiz.options.map((opt, i) => {
              const picked = answer === opt;
              const state = result
                ? opt === result.correctAnswer
                  ? 'is-correct'
                  : picked
                    ? 'is-wrong'
                    : ''
                : picked
                  ? 'is-picked'
                  : '';
              return (
                <label key={opt} className={`option ${state}`}>
                  <input
                    type="radio"
                    name={`${id}-opt`}
                    value={opt}
                    checked={picked}
                    onChange={() => setAnswer(opt)}
                  />
                  <span className="option__key" aria-hidden="true">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <bdi className="option__text">
                    {opt}
                  </bdi>
                </label>
              );
            })}
          </fieldset>
        ) : (
          <div className="field">
            <label htmlFor={`${id}-answer`}>
              {quiz.questionType === 'CODE_OUTPUT' ? t('quiz.outputLabel') : t('quiz.blankLabel')}
            </label>
            {quiz.questionType === 'CODE_OUTPUT' ? (
              <textarea
                id={`${id}-answer`}
                className="input input--code"
                dir="ltr"
                rows={3}
                spellCheck={false}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                disabled={Boolean(result) || submitting}
                placeholder={t('quiz.outputPlaceholder')}
              />
            ) : (
              <input
                id={`${id}-answer`}
                className="input input--code"
                dir="ltr"
                spellCheck={false}
                autoComplete="off"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                disabled={Boolean(result) || submitting}
                placeholder="___"
              />
            )}
            <small className="hint">{isCodeAnswer && t('quiz.caseHint')}</small>
          </div>
        )}

        {error && <Alert>{error}</Alert>}

        {!result && (
          <button className="btn btn--primary" type="submit" disabled={submitting}>
            <Send size={16} aria-hidden="true" />
            {submitting ? t('quiz.checking') : t('quiz.check')}
          </button>
        )}
      </form>

      {result && (
        <div className={`feedback ${result.isCorrect ? 'feedback--ok' : 'feedback--bad'}`} role="status" aria-live="polite">
          <div className="feedback__title">
            {result.isCorrect ? <CheckCircle2 size={22} aria-hidden="true" /> : <XCircle size={22} aria-hidden="true" />}
            <strong>
              {result.isCorrect ? t('quiz.correct', { n: fmt.number(result.score) }) : t('quiz.incorrect')}
            </strong>
          </div>
          {!result.isCorrect && (
            <p className="feedback__answer">
              {t('quiz.correctAnswer')}{' '}
              <code className="inline-code" dir="ltr">
                {result.correctAnswer}
              </code>
            </p>
          )}
          <p className="feedback__why">
            <strong>{t('quiz.why')} </strong>
            {result.explanation}
          </p>
          <p className="feedback__meta">
            {t('quiz.topicAccuracy', { name: result.topic.name, n: fmt.number(result.topic.accuracy) })}
            {' · '}
            {t(`topicStatus.${result.topic.status}`)}
            {' · '}
            {t('quiz.totalScore', { n: fmt.number(result.totalScore) })}
          </p>
          <button className="btn btn--secondary btn--sm" onClick={retry}>
            <RotateCcw size={15} aria-hidden="true" />
            {t('quiz.tryAgain')}
          </button>
        </div>
      )}

      {attempts.length > 0 && (
        <details className="attempts">
          <summary>
            <History size={15} aria-hidden="true" />
            {t('quiz.history', { n: fmt.number(attempts.length), c: fmt.number(correctCount) })}
          </summary>
          <ol>
            {attempts.map((a) => (
              <li key={a.id} className={a.isCorrect ? 'is-correct' : 'is-wrong'}>
                {a.isCorrect ? <CheckCircle2 size={14} aria-hidden="true" /> : <XCircle size={14} aria-hidden="true" />}
                <code className="inline-code" dir="ltr">
                  {a.userAnswer.length > 60 ? `${a.userAnswer.slice(0, 60)}…` : a.userAnswer}
                </code>
                <span className="muted">{fmt.timeAgo(a.createdAt)}</span>
              </li>
            ))}
          </ol>
        </details>
      )}
    </article>
  );
}
