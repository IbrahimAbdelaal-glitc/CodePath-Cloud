import { useEffect, useState } from 'react';
import { Search, Trash2, Users } from 'lucide-react';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { useFetch } from '../../lib/useFetch.js';
import { EmptyState, ErrorState, Loading } from '../../components/States.jsx';

const ROLES = ['STUDENT', 'INSTRUCTOR', 'ADMIN'];

export default function AdminUsers() {
  const { user: me } = useAuth();
  const { t, fmt } = useI18n();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const h = setTimeout(() => {
      setDebounced(q.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(h);
  }, [q]);

  const params = new URLSearchParams({ page: String(page), ...(debounced && { q: debounced }), ...(role && { role }) });
  const { data, error, loading, reload, mutate } = useFetch(`/api/admin/users?${params}`);
  const stats = useFetch('/api/admin/stats');

  const changeRole = async (u, newRole) => {
    if (!window.confirm(t('admin.confirmRole', { name: u.name, role: t(`role.${newRole}`) }))) return;
    try {
      const { user } = await api(`/api/admin/users/${u.id}/role`, { method: 'PATCH', body: { role: newRole } });
      mutate((d) => ({ ...d, users: d.users.map((x) => (x.id === u.id ? { ...x, role: user.role } : x)) }));
      toast.success(t('admin.roleChanged'));
      stats.reload();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const remove = async (u) => {
    if (!window.confirm(t('admin.confirmDelete', { name: u.name }))) return;
    try {
      await api(`/api/admin/users/${u.id}`, { method: 'DELETE' });
      toast.success(t('admin.deleted'));
      reload();
      stats.reload();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const s = stats.data?.stats;
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="container page">
      <header className="page-head">
        <h1>{t('admin.title')}</h1>
        <p>{t('admin.lead')}</p>
      </header>

      {s && (
        <section className="stats stats--compact" aria-label={t('admin.stats')}>
          {ROLES.map((r) => (
            <div key={r} className="stat">
              <span className="stat__label">{t(`admin.count${r}`)}</span>
              <strong className="stat__value">{fmt.number(s.users[r] || 0)}</strong>
            </div>
          ))}
          <div className="stat">
            <span className="stat__label">{t('admin.content')}</span>
            <strong className="stat__value">{fmt.count('lessons', s.lessons)}</strong>
            <span className="stat__hint">
              {fmt.count('questions', s.quizzes)} · {t('admin.attempts', { n: fmt.number(s.attempts) })}
            </span>
          </div>
        </section>
      )}

      <div className="toolbar" role="search">
        <label className="search">
          <Search size={18} aria-hidden="true" />
          <span className="sr-only">{t('admin.search')}</span>
          <input type="search" className="input" placeholder={t('admin.search')} value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <select
          className="input input--auto"
          aria-label={t('admin.filterRole')}
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setPage(1);
          }}
        >
          <option value="">{t('admin.allRoles')}</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {t(`role.${r}`)}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : !data ? (
        <Loading />
      ) : data.users.length === 0 ? (
        <EmptyState icon={Users} title={t('admin.empty')} />
      ) : (
        <>
          <div className="table-wrap" tabIndex={0} aria-busy={loading}>
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">{t('admin.user')}</th>
                  <th scope="col">{t('admin.role')}</th>
                  <th scope="col">{t('admin.activity')}</th>
                  <th scope="col">{t('admin.joined')}</th>
                  <th scope="col">
                    <span className="sr-only">{t('common.actions')}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <strong>{u.name}</strong>
                      <small className="muted block" dir="ltr">
                        {u.email}
                      </small>
                      {u.assignedRoadmaps.length > 0 && (
                        <small className="muted block">
                          {u.assignedRoadmaps.map((r) => r.title).join(t('common.listSep'))}
                        </small>
                      )}
                    </td>
                    <td>
                      <select
                        className="input input--auto input--sm"
                        aria-label={t('admin.roleOf', { name: u.name })}
                        value={u.role}
                        disabled={u.id === me.id}
                        onChange={(e) => changeRole(u, e.target.value)}
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {t(`role.${r}`)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="small">
                      {fmt.count('lessons', u.completedLessons)} · {t('admin.attempts', { n: fmt.number(u.attempts) })}
                    </td>
                    <td className="small muted">{fmt.date(u.createdAt)}</td>
                    <td>
                      {u.id !== me.id && (
                        <button className="icon-btn icon-btn--danger" aria-label={t('admin.deleteUser', { name: u.name })} onClick={() => remove(u)}>
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <nav className="pager" aria-label={t('admin.pages')}>
              <button className="btn btn--ghost btn--sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                {t('admin.prev')}
              </button>
              <span>{t('admin.pageOf', { n: fmt.number(page), total: fmt.number(pages) })}</span>
              <button className="btn btn--ghost btn--sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                {t('admin.next')}
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
