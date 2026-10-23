import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FilePlus2, FolderPlus, PenSquare, Plus, X } from 'lucide-react';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { useFetch } from '../../lib/useFetch.js';
import { DifficultyBadge } from '../../components/Badges.jsx';
import { EmptyState, ErrorState, PageSkeleton } from '../../components/States.jsx';
import RoadmapForm from './RoadmapForm.jsx';

export default function ManageHome() {
  const { isAdmin } = useAuth();
  const { t, fmt } = useI18n();
  const toast = useToast();
  const navigate = useNavigate();
  const { data, error, loading, reload } = useFetch('/api/manage/roadmaps');
  const [creating, setCreating] = useState(false);

  if (loading) return <PageSkeleton />;

  const create = async (body) => {
    const { roadmap } = await api('/api/manage/roadmaps', { method: 'POST', body });
    toast.success(t('manage.pathCreated'));
    navigate(`/manage/roadmaps/${roadmap.id}`);
  };

  return (
    <div className="container page">
      <header className="page-head page-head--row">
        <div>
          <h1>{t('manage.homeTitle')}</h1>
          <p>{isAdmin ? t('manage.homeLeadAdmin') : t('manage.homeLeadInstructor')}</p>
        </div>
        <div className="row-actions">
          {data?.roadmaps.some((r) => r.modules.length > 0) && (
            <Link to="/manage/lessons/new" className="btn btn--secondary">
              <FilePlus2 size={16} aria-hidden="true" />
              {t('manage.newLesson')}
            </Link>
          )}
          <button className="btn btn--primary" onClick={() => setCreating((v) => !v)} aria-expanded={creating}>
            {creating ? <X size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
            {creating ? t('common.cancel') : t('manage.newPath')}
          </button>
        </div>
      </header>

      {creating && (
        <section className="panel" aria-labelledby="new-path">
          <h2 id="new-path">{t('manage.newPath')}</h2>
          <RoadmapForm onSubmit={create} submitLabel={t('manage.createPath')} />
        </section>
      )}

      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : data.roadmaps.length === 0 ? (
        <EmptyState icon={FolderPlus} title={t('manage.noPaths')}>
          {t('manage.noPathsText')}
        </EmptyState>
      ) : (
        <div className="table-wrap" tabIndex={0}>
          <table className="table">
            <thead>
              <tr>
                <th scope="col">{t('manage.title')}</th>
                <th scope="col">{t('manage.difficulty')}</th>
                <th scope="col">{t('manage.content')}</th>
                <th scope="col">{t('manage.status')}</th>
                <th scope="col">{t('manage.instructors')}</th>
                <th scope="col">
                  <span className="sr-only">{t('common.actions')}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {data.roadmaps.map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong>{r.title}</strong>
                    <small className="muted block" dir="ltr">
                      /{r.slug}
                    </small>
                  </td>
                  <td>
                    <DifficultyBadge level={r.difficulty} />
                  </td>
                  <td>
                    {fmt.count('modules', r.moduleCount)} · {fmt.count('lessons', r.lessonCount)}
                  </td>
                  <td>
                    <span className={`chip ${r.isPublished ? 'chip--ok' : 'chip--draft'}`}>
                      {r.isPublished ? t('manage.published') : t('paths.draft')}
                    </span>
                    {r.isFeatured && <span className="chip chip--featured">{t('manage.featured')}</span>}
                  </td>
                  <td className="small">{r.instructors.map((i) => i.name).join(t('common.listSep')) || '—'}</td>
                  <td>
                    <Link to={`/manage/roadmaps/${r.id}`} className="btn btn--secondary btn--sm">
                      <PenSquare size={15} aria-hidden="true" /> {t('common.edit')}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
