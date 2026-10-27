import { useState } from 'react';
import { Activity, CheckCircle2, HardDrive, Mail, Send, XCircle } from 'lucide-react';
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
          <dd>
            <code className="inline-code">{data.mail.from}</code>
          </dd>
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

      <section className="panel" aria-labelledby="review-h">
        <h2 id="review-h">{t('system.review')}</h2>
        <p>{t('system.reviewCount', { n: fmt.number(data.questionsAwaitingReview) })}</p>
      </section>
    </div>
  );
}
