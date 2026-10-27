import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  Award,
  BookMarked,
  Compass,
  GraduationCap,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  PenSquare,
  UserCircle2,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useI18n } from '../i18n/I18nContext.jsx';
import Logo from './Logo.jsx';
import ThemeControl from './ThemeControl.jsx';
import MatrixRain from './MatrixRain.jsx';
import MotionToggle from './MotionToggle.jsx';

function NavItems({ onNavigate }) {
  const { user, isStaff, isAdmin } = useAuth();
  const { t } = useI18n();
  const items = [
    { to: '/paths', label: t('nav.paths'), icon: Compass },
    ...(user
      ? [
          { to: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
          { to: '/bookmarks', label: t('nav.bookmarks'), icon: BookMarked },
        ]
      : []),
    // Only students earn certificates
    ...(user?.role === 'STUDENT' ? [{ to: '/certificates', label: t('nav.certificates'), icon: Award }] : []),
    ...(isStaff ? [{ to: '/manage', label: t('nav.manage'), icon: PenSquare }] : []),
    ...(isAdmin
      ? [
          { to: '/admin/users', label: t('nav.users'), icon: Users },
          { to: '/admin/system', label: t('nav.system'), icon: Activity },
        ]
      : []),
  ];
  return items.map(({ to, label, icon: Icon }) => (
    <NavLink key={to} to={to} className="nav-link" onClick={onNavigate}>
      <Icon size={18} aria-hidden="true" />
      <span>{label}</span>
    </NavLink>
  ));
}

export default function Layout() {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setOpen(false);
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="app-shell">
      <MatrixRain />
      <a className="skip-link" href="#main">
        {t('nav.skip')}
      </a>
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" className="brand" aria-label={t('nav.homeLabel')}>
            <Logo />
            <span className="brand-name" dir="ltr">
              CodePath
            </span>
          </Link>

          <nav className={`main-nav ${open ? 'is-open' : ''}`} id="main-nav" aria-label={t('nav.main')}>
            <NavItems onNavigate={() => setOpen(false)} />
            <div className="nav-account">
              <MotionToggle />
              <ThemeControl />
              {user ? (
                <>
                  <Link to="/profile" className="nav-link nav-user" title={t('nav.profile')}>
                    <UserCircle2 size={18} aria-hidden="true" />
                    <span>
                      {user.name}
                      <small className="role-chip">{t(`role.${user.role}`)}</small>
                    </span>
                  </Link>
                  <button className="btn btn--ghost btn--sm" onClick={handleLogout}>
                    <LogOut size={16} aria-hidden="true" />
                    {t('nav.logout')}
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn btn--ghost btn--sm">
                    <LogIn size={16} aria-hidden="true" />
                    {t('nav.login')}
                  </Link>
                  <Link to="/register" className="btn btn--primary btn--sm">
                    <GraduationCap size={16} aria-hidden="true" />
                    {t('nav.startFree')}
                  </Link>
                </>
              )}
            </div>
          </nav>

          <button
            className="icon-btn menu-toggle"
            aria-expanded={open}
            aria-controls="main-nav"
            aria-label={open ? t('nav.closeMenu') : t('nav.openMenu')}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <div className="brand brand--footer">
            <Logo />
            <span className="brand-name" dir="ltr">
              CodePath <span>Cloud</span>
            </span>
          </div>
          <p>{t('footer.tagline')}</p>
          <nav className="footer-links" aria-label={t('footer.links')}>
            <Link to="/paths">{t('nav.paths')}</Link>
            <Link to="/dashboard">{t('nav.dashboard')}</Link>
            <Link to="/register">{t('footer.register')}</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
