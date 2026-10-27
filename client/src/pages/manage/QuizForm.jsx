import { useState } from 'react';
import { Save } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { Alert } from '../../components/States.jsx';
import { FieldError, fieldErrors } from './RoadmapForm.jsx';

const lines = (s) => s.split('\n').map((x) => x.trim()).filter(Boolean);
const TYPES = ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'MULTI_SELECT', 'CODE_OUTPUT', 'FILL_IN_THE_BLANK'];
const parseList = (v) => {
  try {
    const a = JSON.parse(v);
    return Array.isArray(a) ? a : [];
  } catch {
    return [];
  }
};

// Create/edit question form. Only editors see the correct answer (the server checks permissions)
export default function QuizForm({ initial, topics, onSubmit, onCancel, submitLabel, defaultOrder }) {
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
    order: initial?.order || defaultOrder || '',
    placement: initial?.placement || 'LESSON',
    triggerSeconds: initial?.triggerSeconds ?? '',
    needsReview: Boolean(initial?.needsReview),
  });
  const [multiAnswer, setMultiAnswer] = useState(() => (initial?.questionType === 'MULTI_SELECT' ? parseList(initial.correctAnswer) : []));
  const [newTopic, setNewTopic] = useState(topics.length === 0);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const errs = fieldErrors(error);
  const isTF = form.questionType === 'TRUE_FALSE';
  const isMulti = form.questionType === 'MULTI_SELECT';
  const options = isTF ? ['True', 'False'] : lines(form.options);
  const needsCode = form.questionType === 'CODE_OUTPUT' || form.questionType === 'FILL_IN_THE_BLANK';
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
        correctAnswer: isMulti
          ? JSON.stringify(multiAnswer.filter((o) => options.includes(o)))
          : form.questionType === 'CODE_OUTPUT' && !options.length
            ? form.correctAnswer
            : form.correctAnswer.trim(),
        placement: form.placement,
        triggerSeconds: form.placement === 'CHECKPOINT' && form.triggerSeconds !== '' ? Number(form.triggerSeconds) : null,
        needsReview: form.needsReview,
        acceptedAnswers: lines(form.acceptedAnswers),
        explanation: form.explanation,
        topicTag: form.topicTag.trim(),
        ...(newTopic && form.topicName && { topicName: form.topicName.trim() }),
        points: Number(form.points) || 10,
        ...(form.order !== '' && { order: Number(form.order) }),
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
          {TYPES.map((x) => (
            <option key={x} value={x}>
              {t(`questionType.${x}`)}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor={`qp-${uid}`}>{t('manage.points')}</label>
        <input id={`qp-${uid}`} type="number" min="1" max="100" className="input" value={form.points} onChange={set('points')} />
        <FieldError errors={errs} name="points" />
      </div>
      <div className="field">
        <label htmlFor={`qn-${uid}`}>{t('manage.questionOrder')}</label>
        <input id={`qn-${uid}`} type="number" min="1" className="input" value={form.order} onChange={set('order')} />
        <span className="hint">{t('manage.questionOrderHint')}</span>
        <FieldError errors={errs} name="order" />
      </div>
      <div className="field">
        <label htmlFor={`qpl-${uid}`}>{t('manage.placement')}</label>
        <select id={`qpl-${uid}`} className="input" value={form.placement} onChange={set('placement')}>
          <option value="LESSON">{t('manage.placementLesson')}</option>
          <option value="CHECKPOINT">{t('manage.placementCheckpoint')}</option>
        </select>
      </div>
      {form.placement === 'CHECKPOINT' && (
        <div className="field">
          <label htmlFor={`qts-${uid}`}>{t('manage.triggerSeconds')}</label>
          <input id={`qts-${uid}`} type="number" min="0" className="input" value={form.triggerSeconds} onChange={set('triggerSeconds')} />
          <span className="hint">{t('manage.triggerHint')}</span>
          <FieldError errors={errs} name="triggerSeconds" />
        </div>
      )}
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
      {form.questionType !== 'FILL_IN_THE_BLANK' && !isTF && (
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
        <label htmlFor={`qa-${uid}`} id={`qa-${uid}-l`}>
          {isMulti ? t('manage.correctAnswers') : t('manage.correctAnswer')}
        </label>
        {isMulti ? (
          <div className="checks" role="group" aria-labelledby={`qa-${uid}-l`}>
            {options.map((o) => (
              <label key={o} className="check">
                <input
                  type="checkbox"
                  checked={multiAnswer.includes(o)}
                  onChange={() => setMultiAnswer((a) => (a.includes(o) ? a.filter((x) => x !== o) : [...a, o]))}
                />{' '}
                {o}
              </label>
            ))}
            {!options.length && <span className="hint">{t('manage.addOptionsFirst')}</span>}
          </div>
        ) : options.length > 0 && form.questionType !== 'FILL_IN_THE_BLANK' ? (
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
          <FieldError errors={errs} name="acceptedAnswers" />
        </div>
      )}
      <div className="field field--full">
        <label htmlFor={`qe-${uid}`}>{t('manage.explanation')}</label>
        <textarea id={`qe-${uid}`} className="input" rows={3} value={form.explanation} onChange={set('explanation')} />
        <FieldError errors={errs} name="explanation" />
      </div>
      <label className="check field--full">
        <input type="checkbox" checked={form.needsReview} onChange={(e) => setForm({ ...form, needsReview: e.target.checked })} />{' '}
        {t('manage.needsReviewCheck')}
      </label>
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
              <FieldError errors={errs} name="topicName" />
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
