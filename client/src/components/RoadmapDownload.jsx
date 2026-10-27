import { Link } from 'react-router-dom';
import { Download, Printer } from 'lucide-react';
import { apiUrl } from '../api/client.js';
import { useI18n } from '../i18n/I18nContext.jsx';

// "Download roadmap" (a PDF the API builds from the live roadmap) and the print-friendly page
export default function RoadmapDownload({ slug, print = true }) {
  const { t } = useI18n();
  return (
    <div className="roadmap-download">
      <a href={apiUrl(`/api/courses/${encodeURIComponent(slug)}/roadmap.pdf`)} className="btn btn--primary btn--sm" download>
        <Download size={16} aria-hidden="true" /> {t('map.download')}
      </a>
      {print && (
        <Link to={`/paths/${slug}/print`} className="btn btn--ghost btn--sm">
          <Printer size={16} aria-hidden="true" /> {t('map.printable')}
        </Link>
      )}
    </div>
  );
}
