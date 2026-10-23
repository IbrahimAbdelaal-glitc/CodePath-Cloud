import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Copy, Download, Briefcase, ExternalLink, ShieldCheck } from 'lucide-react';
import { api } from '../api/client.js';
import { useI18n } from '../i18n/I18nContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useFetch } from '../lib/useFetch.js';
import CertificateDocument from '../components/CertificateDocument.jsx';
import { ErrorState, PageSkeleton } from '../components/States.jsx';

const ORGANIZATION = 'CodePath';

export const verificationUrl = (code) => `${window.location.origin}/verify/${code}`;

// LinkedIn's Add to Profile flow: opens a pre-filled form that the student reviews and saves on LinkedIn
function linkedInUrl(c) {
  const date = new Date(c.completedAt);
  const params = new URLSearchParams({
    startTask: 'CERTIFICATION_NAME',
    name: c.roadmapTitle,
    organizationName: ORGANIZATION,
    issueYear: String(date.getFullYear()),
    issueMonth: String(date.getMonth() + 1),
  });
  if (c.verificationCode) {
    params.set('certUrl', verificationUrl(c.verificationCode));
    params.set('certId', c.verificationCode);
  }
  return `https://www.linkedin.com/profile/add?${params}`;
}

export default function Certificate() {
  const { id } = useParams();
  const [search] = useSearchParams();
  const { t, fmt, dir } = useI18n();
  const toast = useToast();
  const { data, error, loading, reload, mutate } = useFetch(`/api/me/certificates/${id}`);
  const [busy, setBusy] = useState(false);
  const Back = dir === 'rtl' ? ArrowRight : ArrowLeft;
  const autoDownload = search.get('download') === '1';

  // "Download PDF" links elsewhere open this page and go straight to the print dialog
  useEffect(() => {
    if (autoDownload && data?.certificate) {
      const timer = setTimeout(() => window.print(), 300);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [autoDownload, data]);

  if (loading) return <PageSkeleton />;
  if (error)
    return (
      <div className="container page">
        <ErrorState error={error} onRetry={error.status === 404 ? null : reload} />
      </div>
    );

  const c = data.certificate;
  const shareUrl = c.verificationCode ? verificationUrl(c.verificationCode) : null;

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t('certificate.copied'));
    } catch {
      toast.error(t('certificate.copyFailed'));
    }
  };

  const setSharing = async (isPublic) => {
    setBusy(true);
    try {
      const { certificate } = await api(`/api/me/certificates/${id}/sharing`, { method: 'PUT', body: { isPublic } });
      mutate((d) => ({ ...d, certificate }));
      toast.success(isPublic ? t('certificate.shareOn') : t('certificate.shareOff'));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const linkedInFields = [
    [t('certificate.liName'), c.roadmapTitle],
    [t('certificate.liOrg'), ORGANIZATION],
    [t('certificate.liIssueDate'), new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(new Date(c.completedAt))],
    ...(c.verificationCode
      ? [
          [t('certificate.liCredentialId'), c.verificationCode],
          [t('certificate.liCredentialUrl'), shareUrl],
        ]
      : []),
  ];

  return (
    <div className="container page certificate-page">
      <div className="certificate-toolbar no-print">
        <Link to="/dashboard" className="btn btn--ghost btn--sm">
          <Back size={16} aria-hidden="true" />
          {t('certificate.back')}
        </Link>
        <div className="certificate-toolbar__actions">
          <span className="muted small">{t('certificate.downloadHint')}</span>
          <button className="btn btn--primary" onClick={() => window.print()}>
            <Download size={18} aria-hidden="true" />
            {t('certificate.download')}
          </button>
        </div>
      </div>

      <CertificateDocument
        certificate={c}
        credentialLabel={c.verificationCode ? t('certificate.credentialId', { id: c.verificationCode }) : null}
      />

      <div className="certificate-share no-print">
        <section className="panel" aria-labelledby="verify-title">
          <h2 id="verify-title">
            <ShieldCheck size={20} aria-hidden="true" /> {t('certificate.verifyTitle')}
          </h2>
          <p className="muted small">{t('certificate.verifyLead')}</p>
          <label className="check">
            <input type="checkbox" checked={Boolean(c.verificationCode)} disabled={busy} onChange={(e) => setSharing(e.target.checked)} />
            <span>{t('certificate.verifyConsent')}</span>
          </label>
          {shareUrl && (
            <div className="copy-row">
              <input className="input input--sm" readOnly value={shareUrl} aria-label={t('certificate.verifyLink')} />
              <button className="btn btn--secondary btn--sm" onClick={() => copy(shareUrl)}>
                <Copy size={15} aria-hidden="true" />
                {t('certificate.copy')}
              </button>
            </div>
          )}
        </section>

        <section className="panel" aria-labelledby="linkedin-title">
          <h2 id="linkedin-title">
            <Briefcase size={20} aria-hidden="true" /> {t('certificate.linkedInTitle')}
          </h2>
          <p className="muted small">{t('certificate.linkedInLead')}</p>
          <dl className="li-fields">
            {linkedInFields.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>
                  <span>{value}</span>
                  <button className="btn btn--ghost btn--sm" onClick={() => copy(value)} aria-label={t('certificate.copyField', { field: label })}>
                    <Copy size={14} aria-hidden="true" />
                  </button>
                </dd>
              </div>
            ))}
          </dl>
          {!c.verificationCode && <p className="muted small">{t('certificate.linkedInNoUrl')}</p>}
          <a className="btn btn--accent" href={linkedInUrl(c)} target="_blank" rel="noopener noreferrer">
            <ExternalLink size={16} aria-hidden="true" />
            {t('certificate.linkedInOpen')}
            <span className="sr-only">{t('common.opensNewTab')}</span>
          </a>
          <p className="muted small">{t('certificate.linkedInNote', { date: fmt.date(c.completedAt) })}</p>
        </section>
      </div>
    </div>
  );
}
