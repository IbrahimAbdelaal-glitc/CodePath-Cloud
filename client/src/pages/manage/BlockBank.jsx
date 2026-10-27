import { CheckCircle2 } from 'lucide-react';
import { api } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { useFetch } from '../../lib/useFetch.js';
import { ErrorState, Loading } from '../../components/States.jsx';

// A module's block-quiz question bank, with answers, sources and review flags (staff only)
export default function BlockBank({ moduleId }) {
  const { t, fmt } = useI18n();
  const toast = useToast();
  const { data, error, loading, reload } = useFetch(`/api/manage/modules/${moduleId}/block-questions`);
  if (loading && !data) return <Loading inline />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const toggle = async (q) => {
    try {
      await api(`/api/manage/block-questions/${q.id}/review`, { method: 'PATCH', body: { needsReview: !q.needsReview } });
      toast.success(q.needsReview ? t('manage.markedReviewed') : t('manage.markedForReview'));
      reload();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const flagged = data.questions.filter((q) => q.needsReview).length;
  return (
    <div className="block-bank">
      <p className="small muted">
        {t('manage.bankSummary', {
          n: fmt.number(data.questions.length),
          draw: fmt.number(data.module.quizQuestionCount),
          pass: data.module.quizPassPercent,
          flagged: fmt.number(flagged),
        })}
      </p>
      <ol className="manage-quizzes">
        {data.questions.map((q) => (
          <li key={q.id}>
            <div className="manage-quiz">
              <div>
                <span className={`chip chip--${q.questionType.toLowerCase()}`}>{t(`questionType.${q.questionType}`)}</span>{' '}
                {q.lessonTitle && <span className="chip chip--topic">{q.lessonTitle}</span>}{' '}
                {q.needsReview ? (
                  <span className="chip chip--review">{t('player.needsReview')}</span>
                ) : (
                  <span className="chip chip--ok">
                    <CheckCircle2 size={12} aria-hidden="true" /> {t('manage.reviewed')}
                  </span>
                )}
                <p>{q.question}</p>
                <small className="muted">
                  {t('manage.correctAnswer')}: <code className="inline-code">{q.correctAnswer}</code>
                </small>
                {q.sourceNote && <small className="muted block">{t('player.source', { source: q.sourceNote })}</small>}
              </div>
              {data.canEdit && (
                <div className="row-actions">
                  <button className="btn btn--ghost btn--sm" onClick={() => toggle(q)}>
                    {q.needsReview ? t('manage.markReviewed') : t('manage.flagReview')}
                  </button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
