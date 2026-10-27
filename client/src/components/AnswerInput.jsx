import { useId } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext.jsx';
import CodeBlock from './CodeBlock.jsx';

// Parses a multi-select answer (array or JSON array string) into an array
export function selection(value) {
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Value sent to the server for a question: a JSON array string for multi-select, otherwise a string
export const answerPayload = (question, value) =>
  question.questionType === 'MULTI_SELECT' ? JSON.stringify(selection(value)) : String(value ?? '');

export const isAnswered = (question, value) =>
  question.questionType === 'MULTI_SELECT' ? selection(value).length > 0 : String(value ?? '').trim().length > 0;

// Renders the input for any question type. With `review` ({ correctAnswer, yourAnswer }) it shows the marked result.
export default function AnswerInput({ question, value, onChange, disabled, review, name }) {
  const { t } = useI18n();
  const id = useId();
  const type = question.questionType;
  const hasOptions = question.options?.length > 0;
  const correct = review ? (type === 'MULTI_SELECT' ? selection(review.correctAnswer) : [review.correctAnswer]) : [];

  const mark = (opt, picked) => {
    if (!review) return picked ? 'is-picked' : '';
    if (correct.includes(opt)) return 'is-correct';
    return picked ? 'is-wrong' : '';
  };

  return (
    <>
      {question.codeSnippet && <CodeBlock code={question.codeSnippet} highlightBlank={type === 'FILL_IN_THE_BLANK'} />}
      {hasOptions ? (
        <fieldset className="options" disabled={disabled}>
          <legend className="sr-only">{type === 'MULTI_SELECT' ? t('quiz.selectAll') : t('quiz.choices')}</legend>
          {type === 'MULTI_SELECT' && <p className="hint">{t('quiz.selectAll')}</p>}
          {question.options.map((opt, i) => {
            const picked = type === 'MULTI_SELECT' ? selection(value).includes(opt) : value === opt;
            const state = mark(opt, picked);
            return (
              <label key={opt} className={`option ${state}`}>
                <input
                  type={type === 'MULTI_SELECT' ? 'checkbox' : 'radio'}
                  name={name || `${id}-opt`}
                  value={opt}
                  checked={picked}
                  onChange={() => {
                    if (type !== 'MULTI_SELECT') return onChange(opt);
                    const cur = selection(value);
                    onChange(cur.includes(opt) ? cur.filter((o) => o !== opt) : [...cur, opt]);
                  }}
                />
                <span className="option__key" aria-hidden="true">
                  {type === 'TRUE_FALSE' ? (opt === 'True' ? 'T' : 'F') : String.fromCharCode(65 + i)}
                </span>
                <bdi className="option__text">{opt}</bdi>
                {review && state === 'is-correct' && <CheckCircle2 size={16} className="option__mark" aria-label={t('quiz.correctOption')} />}
                {review && state === 'is-wrong' && <XCircle size={16} className="option__mark" aria-label={t('quiz.yourWrongOption')} />}
              </label>
            );
          })}
        </fieldset>
      ) : (
        <div className="field">
          <label htmlFor={`${id}-answer`}>{type === 'CODE_OUTPUT' ? t('quiz.outputLabel') : t('quiz.answerLabel')}</label>
          {type === 'CODE_OUTPUT' ? (
            <textarea
              id={`${id}-answer`}
              className="input input--code"
              dir="ltr"
              rows={3}
              spellCheck={false}
              value={value ?? ''}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
            />
          ) : (
            <input
              id={`${id}-answer`}
              className="input input--code"
              dir="ltr"
              spellCheck={false}
              autoComplete="off"
              value={value ?? ''}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
            />
          )}
          {review && (
            <p className="feedback__answer">
              {t('quiz.correctAnswer')}{' '}
              <code className="inline-code" dir="ltr">
                {review.correctAnswer}
              </code>
            </p>
          )}
        </div>
      )}
    </>
  );
}
