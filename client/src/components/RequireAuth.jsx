import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useI18n } from '../i18n/I18nContext.jsx';
import { EmptyState, PageSkeleton } from './States.jsx';

// Client-side route guard for UX only; the server enforces the real permissions
export default function RequireAuth({ roles }) {
  const { user, ready } = useAuth();
  const { t } = useI18n();
  const location = useLocation();

  if (!ready) return <PageSkeleton />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (roles && !roles.includes(user.role)) {
    return (
      <div className="container page">
        <EmptyState icon={ShieldAlert} title={t('states.forbiddenTitle')}>
          {t('states.forbiddenText')}
        </EmptyState>
      </div>
    );
  }
  return <Outlet />;
}
