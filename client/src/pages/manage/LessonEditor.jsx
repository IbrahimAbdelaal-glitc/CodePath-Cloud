import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Eye, PenSquare, Plus, Save, Trash2, X } from 'lucide-react';
import { api } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { useFetch } from '../../lib/useFetch.js';
import Markdown from '../../components/Markdown.jsx';
import { Alert, ErrorState, PageSkeleton } from '../../components/States.jsx';
import { FieldError, fieldErrors } from './RoadmapForm.jsx';
import QuizForm from './QuizForm.jsx';

const lines = (s) => s.split('\n').map((x) => x.trim()).filter(Boolean);
const emptyResource = { title: '', url: '', type: 'ARTICLE' };

function toForm(lesson) {
  return {
    title: lesson?.title || '',
    summary: lesson?.summary || '',
    content: lesson?.content || '',
    keyTakeaways: (lesson?.keyTakeaways || []).join('\n'),
    difficulty: lesson?.difficulty || 'BEGINNER',
    estimatedMinutes: lesson?.estimatedMinutes || '',
    resources: (lesson?.resources || []).map(({ title, url, type }) => ({ title, url, type })),
  };
}

export default function LessonEditor() {
  const { id, moduleId } = useParams();
  const isNew = !id;
  const { t, fmt } = useI18n();
  const toast = useToast();
  const navigate = useNavigate();
  const lessonReq = useFetch(isNew ? null : `/api/manage/lessons/${id}`);
  const topicsReq = useFetch('/api/manage/topics');
  // Paths this user can manage, with their modules, to choose where a new lesson goes
  const roadmapsReq = useFetch(isNew ? '/api/manage/roadmaps' : null);
  const [target, setTarget] = useState({ roadmapId: '', moduleId: moduleId || '' });
  const [form, setForm] = useState(toForm(null));
  const [tab, setTab] = useState('write');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [quizEdit, setQuizEdit] = useState(null);

  const lesson = lessonReq.data?.lesson;
  useEffect(() => {
    if (lesson) setForm(toForm(lesson));
  }, [lesson]);

  const roadmaps = roadmapsReq.data?.roadmaps;
  useEffect(() => {
    if (!roadmaps || !moduleId) return;
    const owner = roadmaps.find((r) => r.modules.some((m) => m.id === moduleId));
    if (owner) setTarget({ roadmapId: owner.id, moduleId });
  }, [roadmaps, moduleId]);

  if ((!isNew && lessonReq.loading && !lesson) || topicsReq.loading || (isNew && roadmapsReq.loading)) return <PageSkeleton />;
  const loadError = lessonReq.error || roadmapsReq.error;
  if (loadError)
    return (
      <div className="container page">
        <ErrorState error={loadError} onRetry={lessonReq.error ? lessonReq.reload : roadmapsReq.reload} />
      </div>
    );
  const targetRoadmap = roadmaps?.find((r) => r.id === target.roadmapId);

  const errs = fieldErrors(error);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const setResource = (i, k, v) =>
    setForm((f) => ({ ...f, resources: f.resources.map((r, j) => (j === i ? { ...r, [k]: v } : r)) }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const body = {
      ...form,
      keyTakeaways: lines(form.keyTakeaways),
      estimatedMinutes: form.estimatedMinutes ? Number(form.estimatedMinutes) : null,
      resources: form.resources.filter((r) => r.title || r.url),
    };
    try {
      if (isNew) {
        if (!target.moduleId) {
          setError({ message: t('manage.chooseModule'), details: [{ field: 'moduleId', message: t('manage.chooseModule') }] });
          return;
        }
        const { lesson: created } = await api(`/api/manage/modules/${target.moduleId}/lessons`, { method: 'POST', body });
        toast.success(t('manage.lessonCreated'));
        navigate(`/manage/lessons/${created.id}`, { replace: true });
      } else {
        await api(`/api/manage/lessons/${id}`, { method: 'PATCH', body });
        toast.success(t('common.savedOk'));
        lessonReq.reload();
      }
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  const topics = topicsReq.data?.topics || [];
  const saveQuiz = async (quiz, body) => {
    if (quiz) await api(`/api/manage/quizzes/${quiz.id}`, { method: 'PATCH', body });
    else await api(`/api/manage/lessons/${id}/quizzes`, { method: 'POST', body });
    toast.success(quiz ? t('common.savedOk') : t('manage.questionAdded', { title: lesson.title }));
    setQuizEdit(null);
    lessonReq.reload();
    topicsReq.reload();
  };
  const deleteQuiz = async (quiz) => {
    if (!window.confirm(t('manage.confirmDeleteQuiz'))) return;
    try {
      await api(`/api/manage/quizzes/${quiz.id}`, { method: 'DELETE' });
      toast.success(t('manage.deleted'));
      lessonReq.reload();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div className="container page">
      <nav className="crumbs" aria-label={t('common.breadcrumb')}>
        <Link to="/manage">{t('nav.manage')}</Link>
        {(lesson?.module.roadmap || targetRoadmap) && (
          <>
            <span aria-hidden="true">/</span>
            <Link to={`/manage/roadmaps/${(lesson?.module.roadmap || targetRoadmap).id}`}>
              {(lesson?.module.roadmap || targetRoadmap).title}
            </Link>
          </>
        )}
      </nav>
      <header className="page-head page-head--row">
        <h1>{isNew ? t('manage.newLesson') : lesson.title}</h1>
        {!isNew && (
          <Link to={`/lessons/${id}`} className="btn btn--secondary btn--sm">
            <Eye size={15} aria-hidden="true" /> {t('manage.viewAsStudent')}
          </Link>
        )}
      </header>

      <form className="panel form-grid" onSubmit={save} noValidate>
        {error && <Alert>{error.message}</Alert>}
        {isNew && (
          <div className="field field--full field--split">
            <div>
              <label htmlFor="l-path">{t('manage.lessonPath')}</label>
              <select
                id="l-path"
                className="input"
                value={target.roadmapId}
                onChange={(e) => setTarget({ roadmapId: e.target.value, moduleId: '' })}
              >
                <option value="">{t('manage.choosePath')}</option>
                {roadmaps.map((r) => (
                  <option key={r.id} value={r.id} disabled={!r.modules.length}>
                    {r.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="l-module">{t('manage.lessonModule')}</label>
              <select
                id="l-module"
                className="input"
                value={target.moduleId}
                disabled={!targetRoadmap}
                onChange={(e) => setTarget((x) => ({ ...x, moduleId: e.target.value }))}
              >
                <option value="">{t('manage.chooseModule')}</option>
                {(targetRoadmap?.modules || []).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
              <FieldError errors={errs} name="moduleId" />
            </div>
          </div>
        )}
        <div className="field">
          <label htmlFor="l-title">{t('manage.lessonTitle')}</label>
          <input id="l-title" className="input" value={form.title} onChange={set('title')} />
          <FieldError errors={errs} name="title" />
        </div>
        <div className="field field--split">
          <div>
            <label htmlFor="l-diff">{t('manage.difficulty')}</label>
            <select id="l-diff" className="input" value={form.difficulty} onChange={set('difficulty')}>
              {['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].map((d) => (
                <option key={d} value={d}>
                  {t(`difficulty.${d}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="l-min">{t('manage.minutes')}</label>
            <input id="l-min" type="number" min="1" className="input" value={form.estimatedMinutes} onChange={set('estimatedMinutes')} />
            <FieldError errors={errs} name="estimatedMinutes" />
          </div>
        </div>
        <div className="field field--full">
          <label htmlFor="l-sum">{t('manage.summary')}</label>
          <input id="l-sum" className="input" value={form.summary} onChange={set('summary')} />
          <FieldError errors={errs} name="summary" />
        </div>
        <div className="field field--full">
          <div className="tabs" role="tablist" aria-label={t('manage.content')}>
            <button type="button" role="tab" aria-selected={tab === 'write'} onClick={() => setTab('write')}>
              <PenSquare size={14} aria-hidden="true" /> {t('manage.write')}
            </button>
            <button type="button" role="tab" aria-selected={tab === 'preview'} onClick={() => setTab('preview')}>
              <Eye size={14} aria-hidden="true" /> {t('manage.preview')}
            </button>
          </div>
          {tab === 'write' ? (
            <>
              <label htmlFor="l-content" className="sr-only">
                {t('manage.content')}
              </label>
              <textarea id="l-content" className="input input--editor" rows={18} value={form.content} onChange={set('content')} />
              <span className="hint">{t('manage.markdownHint')}</span>
            </>
          ) : (
            <div className="preview-box">
              <Markdown>{form.content}</Markdown>
            </div>
          )}
          <FieldError errors={errs} name="content" />
        </div>
        <div className="field field--full">
          <label htmlFor="l-take">{t('lesson.takeaways')}</label>
          <textarea id="l-take" className="input" rows={4} value={form.keyTakeaways} onChange={set('keyTakeaways')} />
          <span className="hint">{t('manage.onePerLine')}</span>
          <FieldError errors={errs} name="keyTakeaways" />
        </div>

        <fieldset className="field field--full">
          <legend>{t('lesson.resources')}</legend>
          {form.resources.map((r, i) => (
            <div key={i} className="resource-row">
              <input className="input" aria-label={t('manage.resourceTitle')} placeholder={t('manage.resourceTitle')} value={r.title} onChange={(e) => setResource(i, 'title', e.target.value)} />
              <input className="input" dir="ltr" aria-label={t('manage.resourceUrl')} placeholder="https://" value={r.url} onChange={(e) => setResource(i, 'url', e.target.value)} />
              <select className="input" aria-label={t('manage.resourceType')} value={r.type} onChange={(e) => setResource(i, 'type', e.target.value)}>
                {['ARTICLE', 'VIDEO', 'DOCUMENTATION'].map((x) => (
                  <option key={x} value={x}>
                    {t(`resourceType.${x}`)}
                  </option>
                ))}
              </select>
              <button type="button" className="icon-btn icon-btn--danger" aria-label={t('common.delete')} onClick={() => setForm((f) => ({ ...f, resources: f.resources.filter((_, j) => j !== i) }))}>
                <X size={16} />
              </button>
            </div>
          ))}
          {Object.keys(errs).some((k) => k.startsWith('resources')) && (
            <span className="field-error">{Object.entries(errs).find(([k]) => k.startsWith('resources'))[1]}</span>
          )}
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setForm((f) => ({ ...f, resources: [...f.resources, { ...emptyResource }] }))}>
            <Plus size={15} aria-hidden="true" /> {t('manage.addResource')}
          </button>
        </fieldset>

        <div className="field--full">
          <button className="btn btn--primary" disabled={saving}>
            <Save size={16} aria-hidden="true" /> {saving ? t('common.saving') : isNew ? t('manage.createLesson') : t('common.save')}
          </button>
        </div>
      </form>

      {!isNew && (
        <section className="panel" aria-labelledby="quizzes-h">
          <div className="panel__head">
            <h2 id="quizzes-h">
              {t('lesson.quizTitle')} ({fmt.number(lesson.quizzes.length)})
            </h2>
            {quizEdit !== 'new' && (
              <button className="btn btn--primary btn--sm" onClick={() => setQuizEdit('new')}>
                <Plus size={15} aria-hidden="true" /> {t('manage.addQuestion')}
              </button>
            )}
          </div>
          {quizEdit === 'new' && (
            <QuizForm
              topics={topics}
              defaultOrder={lesson.quizzes.length + 1}
              submitLabel={t('manage.addQuestion')}
              onCancel={() => setQuizEdit(null)}
              onSubmit={(body) => saveQuiz(null, body)}
            />
          )}
          {lesson.quizzes.length === 0 && quizEdit !== 'new' && <p className="muted">{t('manage.noQuestions')}</p>}
          <ol className="manage-quizzes">
            {lesson.quizzes.map((q) => (
              <li key={q.id}>
                {quizEdit === q.id ? (
                  <QuizForm initial={q} topics={topics} submitLabel={t('common.save')} onCancel={() => setQuizEdit(null)} onSubmit={(body) => saveQuiz(q, body)} />
                ) : (
                  <div className="manage-quiz">
                    <div>
                      <span className={`chip chip--${q.questionType.toLowerCase()}`}>{t(`questionType.${q.questionType}`)}</span>{' '}
                      <span className="chip chip--topic">{q.topic.name}</span>
                      <p>{q.question}</p>
                      <small className="muted">
                        {t('manage.correctAnswer')}: <code className="inline-code" dir="ltr">{q.correctAnswer}</code>
                      </small>
                    </div>
                    <div className="row-actions">
                      <button className="icon-btn" aria-label={t('common.edit')} onClick={() => setQuizEdit(q.id)}>
                        <PenSquare size={16} />
                      </button>
                      <button className="icon-btn icon-btn--danger" aria-label={t('common.delete')} onClick={() => deleteQuiz(q)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
