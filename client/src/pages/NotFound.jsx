import { Link } from 'react-router-dom';
import { MapPinOff } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext.jsx';
import { EmptyState } from '../components/States.jsx';

export default function NotFound() {
  const { t } = useI18n();
  return (
    <div className="container page">
      <EmptyState
        icon={MapPinOff}
        title={t('notFound.title')}
        action={
          <Link to="/" className="btn btn--primary">
            {t('notFound.home')}
          </Link>
        }
      >
        {t('notFound.text')}
      </EmptyState>
    </div>
  );
}
