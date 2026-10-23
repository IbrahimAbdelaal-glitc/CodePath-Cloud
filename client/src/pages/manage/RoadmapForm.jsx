import { useState } from 'react';
import { Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { Alert } from '../../components/States.jsx';

const lines = (s) => s.split('\n').map((x) => x.trim()).filter(Boolean);

export function fieldErrors(err) {
  const map = {};
  for (const d of err?.details || []) if (d.field && !map[d.field]) map[d.field] = d.message;
  return map;
}

// Also shows errors for items of list fields (e.g. "keyTakeaways.2")
export function FieldError({ errors, name }) {
  const message = errors[name] || Object.entries(errors).find(([k]) => k.startsWith(`${name}.`))?.[1];
  return message ? <span className="field-error">{message}</span> : null;
}

export default function RoadmapForm({ initial, onSubmit, submitLabel }) {
  const { isAdmin } = useAuth();
  const { t } = useI18n();
  const [form, setForm] = useState({
    title: initial?.title || '',
    slug: initial?.slug || '',
    category: initial?.category || '',
    difficulty: initial?.difficulty || 'BEGINNER',
    summary: initial?.summary || '',
    description: initial?.description || '',
    prerequisites: (initial?.prerequisites || []).join('\n'),
    isPublished: initial?.isPublished ?? true,
    isFeatured: initial?.isFeatured ?? false,
    order: initial?.order ?? 0,
  });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const errs = fieldErrors(error);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body = { ...form, prerequisites: lines(form.prerequisites), order: Number(form.order) || 0 };
      if (!isAdmin) delete body.isFeatured;
      await onSubmit(body);
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="form-grid" onSubmit={submit} noValidate>
      {error && <Alert>{error.message}</Alert>}
      <div className="field">
        <label htmlFor="rm-title">{t('manage.title')}</label>
        <input id="rm-title" className="input" value={form.title} onChange={set('title')} required />
        <FieldError errors={errs} name="title" />
      </div>
      <div className="field">
        <label htmlFor="rm-slug">{t('manage.slug')}</label>
        <input id="rm-slug" className="input" dir="ltr" value={form.slug} onChange={set('slug')} placeholder="web-basics" required />
        <span className="hint">{t('manage.slugHint')}</span>
        <FieldError errors={errs} name="slug" />
      </div>
      <div className="field">
        <label htmlFor="rm-cat">{t('manage.category')}</label>
        <input id="rm-cat" className="input" value={form.category} onChange={set('category')} required />
        <FieldError errors={errs} name="category" />
      </div>
      <div className="field">
        <label htmlFor="rm-diff">{t('manage.difficulty')}</label>
        <select id="rm-diff" className="input" value={form.difficulty} onChange={set('difficulty')}>
          {['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].map((d) => (
            <option key={d} value={d}>
              {t(`difficulty.${d}`)}
            </option>
          ))}
        </select>
      </div>
      <div className="field field--full">
        <label htmlFor="rm-sum">{t('manage.summary')}</label>
        <input id="rm-sum" className="input" value={form.summary} onChange={set('summary')} />
      </div>
      <div className="field field--full">
        <label htmlFor="rm-desc">{t('manage.description')}</label>
        <textarea id="rm-desc" className="input" rows={4} value={form.description} onChange={set('description')} required />
        <FieldError errors={errs} name="description" />
      </div>
      <div className="field field--full">
        <label htmlFor="rm-pre">{t('manage.pathPrereqs')}</label>
        <textarea id="rm-pre" className="input" rows={3} value={form.prerequisites} onChange={set('prerequisites')} />
        <span className="hint">{t('manage.onePerLine')}</span>
      </div>
      <div className="field">
        <label htmlFor="rm-order">{t('manage.order')}</label>
        <input id="rm-order" type="number" min="0" className="input" value={form.order} onChange={set('order')} />
      </div>
      <div className="field checks">
        <label className="check">
          <input type="checkbox" checked={form.isPublished} onChange={set('isPublished')} /> {t('manage.published')}
        </label>
        {isAdmin && (
          <label className="check">
            <input type="checkbox" checked={form.isFeatured} onChange={set('isFeatured')} /> {t('manage.featured')}
          </label>
        )}
      </div>
      <div className="field--full">
        <button className="btn btn--primary" disabled={saving}>
          <Save size={16} aria-hidden="true" /> {saving ? t('common.saving') : submitLabel}
        </button>
      </div>
    </form>
  );
}
