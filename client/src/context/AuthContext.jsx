import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, tokenStore } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(tokenStore.get() ? 'loading' : 'ready');

  useEffect(() => {
    if (!tokenStore.get()) return;
    api('/api/auth/me')
      .then((d) => setUser(d.user))
      .catch(() => setUser(null))
      .finally(() => setStatus('ready'));
  }, []);

  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener('codepath:unauthorized', onUnauthorized);
    return () => window.removeEventListener('codepath:unauthorized', onUnauthorized);
  }, []);

  const login = useCallback(async (email, password) => {
    const d = await api('/api/auth/login', { method: 'POST', body: { email, password } });
    tokenStore.set(d.token);
    setUser(d.user);
    return d.user;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const d = await api('/api/auth/register', { method: 'POST', body: { name, email, password } });
    tokenStore.set(d.token);
    setUser(d.user);
    return d.user;
  }, []);

  const logout = useCallback(() => {
    tokenStore.set(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      setUser,
      ready: status === 'ready',
      isStaff: user?.role === 'ADMIN' || user?.role === 'INSTRUCTOR',
      isAdmin: user?.role === 'ADMIN',
      login,
      register,
      logout,
    }),
    [user, status, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
