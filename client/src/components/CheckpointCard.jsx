import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Flag, Play, RotateCcw, Send, XCircle } from 'lucide-react';
import { api } from '../api/client.js';
import { useI18n } from '../i18n/I18nContext.jsx';
import AnswerInput, { answerPayload, isAnswered } from './AnswerInput.jsx';
import { Alert } from './States.jsx';

// An in-video checkpoint question. The answer and explanation arrive from the server only after submitting.
// In courses with a pass mark, a wrong answer reveals nothing: the student rewatches the section and tries again.
export default function CheckpointCard({ checkpoint, onAnswered, onContinue, onRewatch, overlay = false, showReview = false }) {
  const { t } = useI18n();
  const [value, setValue] = useState(checkpoint.questionType === 'MULTI_SELECT' ? [] : '');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const headingRef = useRef(null);

  // Move focus into the question when it interrupts the video
  useEffect(() => {
    if (overlay) headingRef.current?.focus();
  }, [overlay]);

  const tryAgain = () => {
    setResult(null);
    setValue(checkpoint.questionType === 'MULTI_SELECT' ? [] : '');
    headingRef.current?.focus();
  };
  const retry = result && !result.isCorrect && result.revealed === false;

  const submit = async (e) => {
    e.preventDefault();
    if (!isAnswered(checkpoint, value)) {
      setError(checkpoint.options?.length ? t('quiz.chooseFirst') : t('quiz.writeFirst'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { result: r } = await api(`/api/quizzes/${checkpoint.id}/attempts`, {
        method: 'POST',
        body: { answer: answerPayload(checkpoint, value) },
      });
      setResult(r);
      onAnswered?.(r);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      className={`checkpoint ${overlay ? 'checkpoint--overlay' : ''} ${result ? (result.isCorrect ? 'quiz--correct' : 'quiz--wrong') : ''}`}
      aria-labelledby={`cp-${checkpoint.id}`}
      role={overlay ? 'dialog' : undefined}
      aria-modal={overlay ? 'false' : undefined}
    >
      <p className="checkpoint__eyebrow">
        <Flag size={14} aria-hidden="true" /> {t('player.checkpoint')}
        {showReview && checkpoint.needsReview && <span className="chip chip--review">{t('player.needsReview')}</span>}
      </p>
      <h3 id={`cp-${checkpoint.id}`} tabIndex={-1} ref={headingRef} className="quiz__question">
        {checkpoint.question}
      </h3>
      <form onSubmit={submit} noValidate>
        <AnswerInput
          question={checkpoint}
          value={value}
          onChange={setValue}
          disabled={Boolean(result) || submitting}
          review={result && !retry ? { correctAnswer: result.correctAnswer } : null}
        />
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
            <strong>{result.isCorrect ? t('player.checkpointCorrect') : retry ? t('player.checkpointRetryTitle') : t('player.checkpointWrong')}</strong>
          </div>
          {retry ? (
            <>
              <p className="feedback__why">{t('player.checkpointRetry')}</p>
              <div className="row-actions">
                {onRewatch && (
                  <button className="btn btn--ghost btn--sm" onClick={onRewatch}>
                    <RotateCcw size={15} aria-hidden="true" /> {t('player.rewatch')}
                  </button>
                )}
                <button className="btn btn--primary btn--sm" onClick={tryAgain} autoFocus>
                  {t('player.tryAgain')}
                </button>
              </div>
            </>
          ) : (
            <p className="feedback__why">
              <strong>{t('quiz.why')} </strong>
              {result.explanation}
            </p>
          )}
          {onContinue && !retry && (
            <button className="btn btn--primary btn--sm" onClick={onContinue} autoFocus>
              <Play size={15} aria-hidden="true" /> {t('player.continueVideo')}
            </button>
          )}
        </div>
      )}
      {showReview && checkpoint.sourceNote && <p className="small muted">{t('player.source', { source: checkpoint.sourceNote })}</p>}
    </section>
  );
}
