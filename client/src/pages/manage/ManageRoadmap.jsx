import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, ExternalLink, FilePlus2, PenSquare, Plus, Save, Trash2, X } from 'lucide-react';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { useFetch } from '../../lib/useFetch.js';
import { DifficultyBadge } from '../../components/Badges.jsx';
import { Alert, ErrorState, PageSkeleton } from '../../components/States.jsx';
import RoadmapForm, { FieldError, fieldErrors } from './RoadmapForm.jsx';

function ModuleForm({ initial, modules, onSubmit, onCancel, submitLabel }) {
  const { t } = useI18n();
  const [form, setForm] = useState({
    title: initial?.title || '',
    description: initial?.description || '',
    difficulty: initial?.difficulty || 'BEGINNER',
    estimatedMinutes: initial?.estimatedMinutes || '',
    prerequisiteIds: initial?.prerequisiteIds || [],
  });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const errs = fieldErrors(error);
  const others = modules.filter((m) => m.id !== initial?.id);

  const togglePrereq = (id) =>
    setForm((f) => ({
      ...f,
      prerequisiteIds: f.prerequisiteIds.includes(id) ? f.prerequisiteIds.filter((x) => x !== id) : [...f.prerequisiteIds, id],
    }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSubmit({ ...form, estimatedMinutes: form.estimatedMinutes ? Number(form.estimatedMinutes) : null });
    } catch (err) {
      setError(err);
      setSaving(false);
    }
  };

  return (
    <form className="form-grid module-form" onSubmit={submit} noValidate>
      {error && <Alert>{error.message}</Alert>}
      <div className="field">
        <label htmlFor={`mt-${initial?.id || 'new'}`}>{t('manage.moduleTitle')}</label>
        <input id={`mt-${initial?.id || 'new'}`} className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <FieldError errors={errs} name="title" />
      </div>
      <div className="field">
        <label htmlFor={`md-${initial?.id || 'new'}`}>{t('manage.difficulty')}</label>
        <select id={`md-${initial?.id || 'new'}`} className="input" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
          {['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].map((d) => (
            <option key={d} value={d}>
              {t(`difficulty.${d}`)}
            </option>
          ))}
        </select>
      </div>
      <div className="field field--full">
        <label htmlFor={`mdesc-${initial?.id || 'new'}`}>{t('manage.description')}</label>
        <textarea id={`mdesc-${initial?.id || 'new'}`} className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>
      {others.length > 0 && (
        <fieldset className="field field--full">
          <legend>{t('manage.modulePrereqs')}</legend>
          <span className="hint">{t('manage.modulePrereqsHint')}</span>
          <div className="checks">
            {others.map((m) => (
              <label key={m.id} className="check">
                <input type="checkbox" checked={form.prerequisiteIds.includes(m.id)} onChange={() => togglePrereq(m.id)} />
                <span>{m.title}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <div className="field--full form-actions">
        <button className="btn btn--primary btn--sm" disabled={saving}>
          <Save size={15} aria-hidden="true" /> {submitLabel}
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

function InstructorAssign({ roadmap, onSaved }) {
  const { t } = useI18n();
  const toast = useToast();
  const { data, loading } = useFetch('/api/admin/users?role=INSTRUCTOR');
  const [selected, setSelected] = useState(roadmap.instructors.map((i) => i.id));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await api(`/api/admin/roadmaps/${roadmap.id}/instructors`, { method: 'PUT', body: { userIds: selected } });
      toast.success(t('manage.instructorsSaved'));
      onSaved();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;
  const instructors = data?.users || [];
  return (
    <section className="panel" aria-labelledby="assign-title">
      <h2 id="assign-title">{t('manage.assignTitle')}</h2>
      {instructors.length === 0 ? (
        <p className="muted">{t('manage.noInstructors')}</p>
      ) : (
        <>
          <div className="checks">
            {instructors.map((u) => (
              <label key={u.id} className="check">
                <input
                  type="checkbox"
                  checked={selected.includes(u.id)}
                  onChange={() => setSelected((s) => (s.includes(u.id) ? s.filter((x) => x !== u.id) : [...s, u.id]))}
                />
                {u.name} <bdi dir="ltr" className="muted small">({u.email})</bdi>
              </label>
            ))}
          </div>
          <button className="btn btn--primary btn--sm" onClick={save} disabled={saving}>
            <Save size={15} aria-hidden="true" /> {t('common.save')}
          </button>
        </>
      )}
    </section>
  );
}

export default function ManageRoadmap() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const { t, fmt } = useI18n();
  const toast = useToast();
  const navigate = useNavigate();
  const { data, error, loading, reload } = useFetch(`/api/manage/roadmaps/${id}`);
  const [editing, setEditing] = useState(null);
  const [addingModule, setAddingModule] = useState(false);

  if (loading && !data) return <PageSkeleton />;
  if (error)
    return (
      <div className="container page">
        <ErrorState error={error} onRetry={reload} />
      </div>
    );

  const r = data.roadmap;

  const run = async (fn, success) => {
    try {
      await fn();
      if (success) toast.success(success);
      reload();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const saveDetails = async (body) => {
    await api(`/api/manage/roadmaps/${r.id}`, { method: 'PATCH', body });
    toast.success(t('common.savedOk'));
    reload();
  };

  const deleteRoadmap = () => {
    if (!window.confirm(t('manage.confirmDeletePath', { title: r.title }))) return;
    run(async () => {
      await api(`/api/manage/roadmaps/${r.id}`, { method: 'DELETE' });
      navigate('/manage');
    }, t('manage.deleted'));
  };

  return (
    <div className="container page">
      <nav className="crumbs" aria-label={t('common.breadcrumb')}>
        <Link to="/manage">{t('nav.manage')}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">
          {r.title}
        </span>
      </nav>
      <header className="page-head page-head--row">
        <div>
          <h1>{r.title}</h1>
          <p>
            {fmt.count('modules', r.modules.length)} · {r.isPublished ? t('manage.published') : t('paths.draft')}
          </p>
        </div>
        <div className="form-actions">
          <Link to={`/paths/${r.slug}`} className="btn btn--secondary btn--sm">
            <ExternalLink size={15} aria-hidden="true" /> {t('manage.viewAsStudent')}
          </Link>
          {isAdmin && (
            <button className="btn btn--danger btn--sm" onClick={deleteRoadmap}>
              <Trash2 size={15} aria-hidden="true" /> {t('manage.deletePath')}
            </button>
          )}
        </div>
      </header>

      {r.canEdit ? (
        <details className="panel">
          <summary>
            <h2>{t('manage.pathDetails')}</h2>
          </summary>
          <RoadmapForm key={r.updatedAt} initial={r} onSubmit={saveDetails} submitLabel={t('common.save')} />
        </details>
      ) : (
        <Alert type="info">{t('manage.addOnlyPath')}</Alert>
      )}

      {isAdmin && <InstructorAssign roadmap={r} onSaved={reload} />}

      <section className="panel" aria-labelledby="modules-h">
        <div className="panel__head">
          <h2 id="modules-h">{t('manage.modules')}</h2>
          {r.canEdit && (
            <button className="btn btn--primary btn--sm" onClick={() => setAddingModule((v) => !v)} aria-expanded={addingModule}>
              {addingModule ? <X size={15} aria-hidden="true" /> : <Plus size={15} aria-hidden="true" />}
              {addingModule ? t('common.cancel') : t('manage.addModule')}
            </button>
          )}
        </div>
        {addingModule && (
          <ModuleForm
            modules={r.modules}
            submitLabel={t('manage.addModule')}
            onSubmit={async (body) => {
              await api(`/api/manage/roadmaps/${r.id}/modules`, { method: 'POST', body });
              toast.success(t('manage.moduleAdded'));
              setAddingModule(false);
              reload();
            }}
          />
        )}
        {r.modules.length === 0 && <p className="muted">{t('manage.noModules')}</p>}
        <ol className="manage-modules">
          {r.modules.map((m, mi) => (
            <li key={m.id} className="manage-module">
              {editing === m.id ? (
                <ModuleForm
                  initial={m}
                  modules={r.modules}
                  submitLabel={t('common.save')}
                  onCancel={() => setEditing(null)}
                  onSubmit={async (body) => {
                    await api(`/api/manage/modules/${m.id}`, { method: 'PATCH', body });
                    toast.success(t('common.savedOk'));
                    setEditing(null);
                    reload();
                  }}
                />
              ) : (
                <div className="manage-module__head">
                  <div>
                    <strong>
                      {fmt.number(mi + 1)}. {m.title}
                    </strong>
                    <div className="small muted">
                      <DifficultyBadge level={m.difficulty} />{' '}
                      {m.prerequisiteIds.length > 0 &&
                        `${t('path.requires')} ${r.modules
                          .filter((x) => m.prerequisiteIds.includes(x.id))
                          .map((x) => x.title)
                          .join(t('common.listSep'))}`}
                    </div>
                  </div>
                  {r.canEdit && (
                    <div className="row-actions">
                      <button className="icon-btn" aria-label={t('manage.moveUp')} disabled={mi === 0} onClick={() => run(() => api(`/api/manage/modules/${m.id}/move`, { method: 'POST', body: { direction: 'up' } }))}>
                        <ArrowUp size={16} />
                      </button>
                      <button className="icon-btn" aria-label={t('manage.moveDown')} disabled={mi === r.modules.length - 1} onClick={() => run(() => api(`/api/manage/modules/${m.id}/move`, { method: 'POST', body: { direction: 'down' } }))}>
                        <ArrowDown size={16} />
                      </button>
                      <button className="icon-btn" aria-label={t('common.edit')} onClick={() => setEditing(m.id)}>
                        <PenSquare size={16} />
                      </button>
                      <button
                        className="icon-btn icon-btn--danger"
                        aria-label={t('common.delete')}
                        onClick={() =>
                          window.confirm(t('manage.confirmDeleteModule', { title: m.title })) &&
                          run(() => api(`/api/manage/modules/${m.id}`, { method: 'DELETE' }), t('manage.deleted'))
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              <ul className="manage-lessons">
                {m.lessons.map((l, li) => (
                  <li key={l.id}>
                    <span>{l.title}</span>
                    <span className="small muted">{fmt.count('questions', l.quizCount)}</span>
                    <div className="row-actions">
                      {r.canEdit && (
                        <>
                          <button className="icon-btn icon-btn--sm" aria-label={t('manage.moveUp')} disabled={li === 0} onClick={() => run(() => api(`/api/manage/lessons/${l.id}/move`, { method: 'POST', body: { direction: 'up' } }))}>
                            <ArrowUp size={14} />
                          </button>
                          <button className="icon-btn icon-btn--sm" aria-label={t('manage.moveDown')} disabled={li === m.lessons.length - 1} onClick={() => run(() => api(`/api/manage/lessons/${l.id}/move`, { method: 'POST', body: { direction: 'down' } }))}>
                            <ArrowDown size={14} />
                          </button>
                        </>
                      )}
                      <Link
                        to={`/manage/lessons/${l.id}`}
                        className="icon-btn icon-btn--sm"
                        aria-label={r.canEdit ? t('common.edit') : t('manage.addQuestion')}
                      >
                        {r.canEdit ? <PenSquare size={14} /> : <Plus size={14} />}
                      </Link>
                      {r.canEdit && (
                        <button
                          className="icon-btn icon-btn--sm icon-btn--danger"
                          aria-label={t('common.delete')}
                          onClick={() =>
                            window.confirm(t('manage.confirmDeleteLesson', { title: l.title })) &&
                            run(() => api(`/api/manage/lessons/${l.id}`, { method: 'DELETE' }), t('manage.deleted'))
                          }
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              <Link to={`/manage/modules/${m.id}/lessons/new`} className="btn btn--ghost btn--sm">
                <FilePlus2 size={15} aria-hidden="true" /> {t('manage.addLesson')}
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
