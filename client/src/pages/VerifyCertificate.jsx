import { useParams } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext.jsx';
import { useFetch } from '../lib/useFetch.js';
import CertificateDocument from '../components/CertificateDocument.jsx';
import { Alert, ErrorState, PageSkeleton } from '../components/States.jsx';

// Public page: anyone with the link can check a certificate its owner chose to share
export default function VerifyCertificate() {
  const { code } = useParams();
  const { t } = useI18n();
  const { data, error, loading, reload } = useFetch(`/api/certificates/verify/${encodeURIComponent(code)}`);

  if (loading) return <PageSkeleton />;
  if (error)
    return (
      <div className="container page">
        <ErrorState
          error={error}
          title={error.status === 404 ? t('certificate.verifyNotFound') : undefined}
          onRetry={error.status === 404 ? null : reload}
        />
      </div>
    );

  const c = data.certificate;
  return (
    <div className="container page certificate-page">
      <div className="no-print">
        <Alert type="success">
          <span className="success-text">
            <ShieldCheck size={18} aria-hidden="true" /> {t('certificate.verified')}
          </span>
        </Alert>
      </div>
      <CertificateDocument certificate={c} credentialLabel={t('certificate.credentialId', { id: c.verificationCode })} />
    </div>
  );
}
