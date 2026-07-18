import { useEffect, useState } from 'react';
import type { SessionUser } from './types';
import { LoginScreen } from './components/LoginScreen';
import { SocialApp } from './components/SocialApp';
import { AdminApp } from './components/AdminApp';
import { BrandCursor } from './components/BrandCursor';

export function App() {
  const [user, setUser] = useState<SessionUser | null>(() => {
    try {
      const saved = localStorage.getItem('empathy-circle.user');
      return saved ? JSON.parse(saved) as SessionUser : null;
    } catch {
      return null;
    }
  });

  function login(nextUser: SessionUser) {
    localStorage.setItem('empathy-circle.user', JSON.stringify(nextUser));
    setUser(nextUser);
  }

  function logout() {
    localStorage.removeItem('empathy-circle.session');
    localStorage.removeItem('empathy-circle.user');
    setUser(null);
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('login')) {
      localStorage.removeItem('empathy-circle.session');
      localStorage.removeItem('empathy-circle.user');
      setUser(null);
    }
  }, []);

  const content = !user
    ? <LoginScreen onLogin={login} />
    : user.role !== '用户'
      ? <AdminApp user={user} onLogout={logout} />
      : <SocialApp user={user} onLogout={logout} />;

  return <><BrandCursor />{content}</>;
}