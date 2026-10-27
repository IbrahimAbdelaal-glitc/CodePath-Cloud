import { useState } from 'react';
import { Activity, BookCopy, CheckCircle2, HardDrive, Mail, Send, XCircle } from 'lucide-react';
import { api } from '../../api/client.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { useFetch } from '../../lib/useFetch.js';
import { Alert, ErrorState, PageSkeleton } from '../../components/States.jsx';

// Shows which integrations are configured (never their secret values) and sends a test email to the admin
export default function AdminSystem() {
  const { t, fmt } = useI18n();
  const { data, error, loading, reload } = useFetch('/api/admin/system');
  const [sending, setSending] = useState(false);
  const [mailResult, setMailResult] = useState(null);

  if (loading && !data) return <PageSkeleton />;
  if (error)
    return (
      <div className="container page">
        <ErrorState error={error} onRetry={reload} />
      </div>
    );

  const mailReady = !['disabled', 'dev-outbox'].includes(data.mail.mode);
  const sendTest = async () => {
    setSending(true);
    setMailResult(null);
    try {
      const r = await api('/api/admin/system/test-email', { method: 'POST' });
      setMailResult({ ok: true, message: t('system.testSent', { email: r.to }) });
    } catch (err) {
      setMailResult({ ok: false, message: err.message });
    } finally {
      setSending(false);
    }
  };

  const Status = ({ ok }) =>
    ok ? (
      <span className="success-text">
        <CheckCircle2 size={16} aria-hidden="true" /> {t('system.ready')}
      </span>
    ) : (
      <span className="warn-text">
        <XCircle size={16} aria-hidden="true" /> {t('system.notReady')}
      </span>
    );

  return (
    <div className="container page page--narrow">
      <header className="page-head">
        <h1>
          <Activity size={26} aria-hidden="true" /> {t('system.title')}
        </h1>
        <p className="muted">{t('system.lead')}</p>
      </header>

      <section className="panel" aria-labelledby="mail-h">
        <div className="panel__head">
          <h2 id="mail-h">
            <Mail size={18} aria-hidden="true" /> {t('system.email')}
          </h2>
          <Status ok={mailReady} />
        </div>
        <dl className="kv">
          <dt>{t('system.provider')}</dt>
          <dd>{t(`system.mailMode.${data.mail.mode}`)}</dd>
          <dt>{t('system.sender')}</dt>
          <dd>{data.mail.from ? <code className="inline-code">{data.mail.from}</code> : t('system.senderAppsScript')}</dd>
          <dt>{t('system.appUrl')}</dt>
          <dd>
            <code className="inline-code">{data.appUrl}</code>
          </dd>
        </dl>
        {!mailReady && <Alert type="info">{t('system.mailHelp')}</Alert>}
        <button className="btn btn--primary btn--sm" onClick={sendTest} disabled={sending}>
          <Send size={15} aria-hidden="true" /> {sending ? t('system.sending') : t('system.sendTest')}
        </button>
        {mailResult && <Alert type={mailResult.ok ? 'success' : 'error'}>{mailResult.message}</Alert>}
      </section>

      <section className="panel" aria-labelledby="storage-h">
        <div className="panel__head">
          <h2 id="storage-h">
            <HardDrive size={18} aria-hidden="true" /> {t('system.storage')}
          </h2>
          <Status ok={data.storage.configured} />
        </div>
        <dl className="kv">
          <dt>{t('system.bucket')}</dt>
          <dd>
            <code className="inline-code">{data.storage.bucket}</code>
          </dd>
          <dt>{t('system.maxUpload')}</dt>
          <dd>{fmt.number(data.storage.maxVideoMb)} MB</dd>
          <dt>{t('system.videos')}</dt>
          <dd>{fmt.number(data.uploadedVideos)}</dd>
        </dl>
        {!data.storage.configured && <Alert type="info">{t('system.storageHelp')}</Alert>}
      </section>

      <CatalogPanel />

      <section className="panel" aria-labelledby="review-h">
        <h2 id="review-h">{t('system.review')}</h2>
        <p>{t('system.reviewCount', { n: fmt.number(data.questionsAwaitingReview) })}</p>
      </section>
    </div>
  );
}

// Preview (dry run) and one-time apply of the built-in course catalog. The server re-checks everything.
function CatalogPanel() {
  const { t, fmt } = useI18n();
  const { data, error, loading, reload } = useFetch('/api/admin/catalog');
  const [confirmed, setConfirmed] = useState(false);
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState(null);

  if (loading && !data) return <section className="panel" aria-busy="true" />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const apply = async () => {
    setApplying(true);
    setResult(null);
    try {
      const r = await api('/api/admin/catalog/sync', { method: 'POST', body: { confirm: true } });
      if (r.status === 'up-to-date') setResult({ ok: true, message: t('system.catalogUpToDate') });
      else if (r.lost?.length) setResult({ ok: false, message: t('system.catalogLost', { list: r.lost.map((k) => t(`system.learnerKeys.${k}`)).join(', ') }) });
      else setResult({ ok: true, message: t('system.catalogDone') });
      setConfirmed(false);
      reload();
    } catch (err) {
      setResult({ ok: false, message: err.code === 'CATALOG_BUSY' ? t('system.catalogBusy') : err.message });
    } finally {
      setApplying(false);
    }
  };

  return (
    <section className="panel" aria-labelledby="catalog-h">
      <div className="panel__head">
        <h2 id="catalog-h">
          <BookCopy size={18} aria-hidden="true" /> {t('system.catalog')}
        </h2>
        {data.pending ? <span className="warn-text">{t('system.catalogPending')}</span> : <span className="success-text">{t('system.catalogUpToDate')}</span>}
      </div>
      <p className="small muted">{t('system.catalogLead')}</p>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">{t('system.catalogCourse')}</th>
              <th scope="col">{t('system.catalogStored')}</th>
              <th scope="col">{t('system.catalogCode')}</th>
              <th scope="col">{t('system.catalogAction')}</th>
            </tr>
          </thead>
          <tbody>
            {data.steps.map((s) => (
              <tr key={s.key}>
                <td>{s.title}</td>
                <td>{s.stored == null ? '—' : `v${s.stored}`}</td>
                <td>v{s.code}</td>
                <td>{t(`system.catalogActions.${s.action}`)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3>{t('system.catalogLearner')}</h3>
      <dl className="kv">
        {Object.entries(data.learner).map(([k, n]) => (
          <div key={k} className="kv__row">
            <dt>{t(`system.learnerKeys.${k}`)}</dt>
            <dd>{fmt.number(n)}</dd>
          </div>
        ))}
      </dl>

      {data.archivedPaths.length > 0 && (
        <>
          <h3>{t('system.catalogArchived')}</h3>
          <p className="small muted">{t('system.catalogArchivedLead')}</p>
          <ul>
            {data.archivedPaths.map((p) => (
              <li key={p.slug}>
                {p.title} (<code className="inline-code">{p.slug}</code>): {p.published ? t('system.catalogVisible') : t('system.catalogHidden')}
                {' · '}
                {t('system.catalogCerts', { n: fmt.number(p.certificates) })}
              </li>
            ))}
          </ul>
        </>
      )}

      {data.pending && (
        <>
          <label className="check">
            <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} disabled={applying} /> {t('system.catalogConfirm')}
          </label>
          <button className="btn btn--primary btn--sm" onClick={apply} disabled={!confirmed || applying}>
            {applying ? t('system.catalogApplying') : t('system.catalogApply')}
          </button>
        </>
      )}
      {applying && <p className="small muted" role="status">{t('system.catalogApplying')}</p>}
      {result && <Alert type={result.ok ? 'success' : 'error'}>{result.message}</Alert>}
    </section>
  );
}
