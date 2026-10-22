import { useState } from 'react';
import { Save } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { Alert } from '../../components/States.jsx';
import { FieldError, fieldErrors } from './RoadmapForm.jsx';

const lines = (s) => s.split('\n').map((x) => x.trim()).filter(Boolean);

// Create/edit question form. Only editors see the correct answer (the server checks permissions)
export default function QuizForm({ initial, topics, onSubmit, onCancel, submitLabel }) {
  const { t } = useI18n();
  const [form, setForm] = useState({
    question: initial?.question || '',
    questionType: initial?.questionType || 'MULTIPLE_CHOICE',
    codeSnippet: initial?.codeSnippet || '',
    options: (Array.isArray(initial?.options) ? initial.options : []).join('\n'),
    correctAnswer: initial?.correctAnswer || '',
    acceptedAnswers: (initial?.acceptedAnswers || []).join('\n'),
    explanation: initial?.explanation || '',
    topicTag: initial?.topicTag || topics[0]?.tag || '',
    topicName: '',
    points: initial?.points ?? 10,
  });
  const [newTopic, setNewTopic] = useState(topics.length === 0);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const errs = fieldErrors(error);
  const options = lines(form.options);
  const needsCode = form.questionType !== 'MULTIPLE_CHOICE';
  const uid = initial?.id || 'new';

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        question: form.question,
        questionType: form.questionType,
        codeSnippet: form.codeSnippet || null,
        options,
        correctAnswer: form.questionType === 'CODE_OUTPUT' && !options.length ? form.correctAnswer : form.correctAnswer.trim(),
        acceptedAnswers: lines(form.acceptedAnswers),
        explanation: form.explanation,
        topicTag: form.topicTag.trim(),
        ...(newTopic && form.topicName && { topicName: form.topicName.trim() }),
        points: Number(form.points) || 10,
      });
    } catch (err) {
      setError(err);
      setSaving(false);
    }
  };

  return (
    <form className="form-grid quiz-form" onSubmit={submit} noValidate>
      {error && <Alert>{error.message}</Alert>}
      <div className="field">
        <label htmlFor={`qt-${uid}`}>{t('manage.questionType')}</label>
        <select id={`qt-${uid}`} className="input" value={form.questionType} onChange={set('questionType')}>
          {['MULTIPLE_CHOICE', 'CODE_OUTPUT', 'FILL_IN_THE_BLANK'].map((x) => (
            <option key={x} value={x}>
              {t(`questionType.${x}`)}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor={`qp-${uid}`}>{t('manage.points')}</label>
        <input id={`qp-${uid}`} type="number" min="1" max="100" className="input" value={form.points} onChange={set('points')} />
      </div>
      <div className="field field--full">
        <label htmlFor={`qq-${uid}`}>{t('manage.questionText')}</label>
        <textarea id={`qq-${uid}`} className="input" rows={2} value={form.question} onChange={set('question')} />
        <FieldError errors={errs} name="question" />
      </div>
      {needsCode && (
        <div className="field field--full">
          <label htmlFor={`qc-${uid}`}>{t('manage.codeSnippet')}</label>
          <textarea id={`qc-${uid}`} className="input input--code" dir="ltr" rows={5} spellCheck={false} value={form.codeSnippet} onChange={set('codeSnippet')} />
          <span className="hint">{form.questionType === 'FILL_IN_THE_BLANK' ? t('manage.blankHint') : t('manage.outputHint')}</span>
          <FieldError errors={errs} name="codeSnippet" />
        </div>
      )}
      {form.questionType !== 'FILL_IN_THE_BLANK' && (
        <div className="field field--full">
          <label htmlFor={`qo-${uid}`}>
            {t('manage.options')} {form.questionType === 'CODE_OUTPUT' && <small className="muted">({t('common.optional')})</small>}
          </label>
          <textarea id={`qo-${uid}`} className="input" rows={4} value={form.options} onChange={set('options')} />
          <span className="hint">{t('manage.onePerLine')}</span>
          <FieldError errors={errs} name="options" />
        </div>
      )}
      <div className="field field--full">
        <label htmlFor={`qa-${uid}`}>{t('manage.correctAnswer')}</label>
        {options.length > 0 && form.questionType !== 'FILL_IN_THE_BLANK' ? (
          <select id={`qa-${uid}`} className="input" value={form.correctAnswer} onChange={set('correctAnswer')}>
            <option value="">{t('manage.pickCorrect')}</option>
            {options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        ) : form.questionType === 'CODE_OUTPUT' ? (
          <textarea id={`qa-${uid}`} className="input input--code" dir="ltr" rows={3} value={form.correctAnswer} onChange={set('correctAnswer')} />
        ) : (
          <input id={`qa-${uid}`} className="input input--code" dir="ltr" value={form.correctAnswer} onChange={set('correctAnswer')} />
        )}
        <FieldError errors={errs} name="correctAnswer" />
      </div>
      {needsCode && !options.length && (
        <div className="field field--full">
          <label htmlFor={`qx-${uid}`}>{t('manage.acceptedAnswers')}</label>
          <textarea id={`qx-${uid}`} className="input input--code" dir="ltr" rows={2} value={form.acceptedAnswers} onChange={set('acceptedAnswers')} />
          <span className="hint">{t('manage.acceptedHint')}</span>
        </div>
      )}
      <div className="field field--full">
        <label htmlFor={`qe-${uid}`}>{t('manage.explanation')}</label>
        <textarea id={`qe-${uid}`} className="input" rows={3} value={form.explanation} onChange={set('explanation')} />
        <FieldError errors={errs} name="explanation" />
      </div>
      <fieldset className="field field--full">
        <legend>{t('manage.topic')}</legend>
        <span className="hint">{t('manage.topicHint')}</span>
        <div className="checks">
          <label className="check">
            <input type="radio" checked={!newTopic} onChange={() => setNewTopic(false)} disabled={!topics.length} />
            {t('manage.existingTopic')}
          </label>
          <label className="check">
            <input type="radio" checked={newTopic} onChange={() => setNewTopic(true)} /> {t('manage.newTopic')}
          </label>
        </div>
        {newTopic ? (
          <div className="form-grid">
            <div className="field">
              <label htmlFor={`tt-${uid}`}>{t('manage.topicTag')}</label>
              <input id={`tt-${uid}`} className="input" dir="ltr" placeholder="js-closures" value={form.topicTag} onChange={set('topicTag')} />
              <FieldError errors={errs} name="topicTag" />
            </div>
            <div className="field">
              <label htmlFor={`tn-${uid}`}>{t('manage.topicName')}</label>
              <input id={`tn-${uid}`} className="input" value={form.topicName} onChange={set('topicName')} />
            </div>
          </div>
        ) : (
          <select className="input" aria-label={t('manage.topic')} value={form.topicTag} onChange={set('topicTag')}>
            {topics.map((tp) => (
              <option key={tp.tag} value={tp.tag}>
                {tp.name} ({tp.tag})
              </option>
            ))}
          </select>
        )}
      </fieldset>
      <div className="field--full form-actions">
        <button className="btn btn--primary btn--sm" disabled={saving}>
          <Save size={15} aria-hidden="true" /> {saving ? t('common.saving') : submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn btn--ghost btn--sm" onClick={onCancel}>
            {t('common.cancel')}
          </button>
        )}
      </div>
    </form>
  );
}
