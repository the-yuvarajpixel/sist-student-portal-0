import { useCallback, useEffect, useState } from 'react';
import type { PublicUser } from './core/types';
import { portalApi } from './lib/api';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { WelcomePage } from './pages/WelcomePage';

type RoutePath = '/' | '/welcome' | '/login' | '/dashboard';

function normalizePath(pathname: string): RoutePath {
  if (pathname === '/login') return '/login';
  if (pathname === '/dashboard') return '/dashboard';
  if (pathname === '/welcome') return '/welcome';
  return '/';
}

function getInitialTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  try {
    const saved = window.localStorage.getItem('sist_portal_theme');
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    // Ignore storage access restrictions inside sandboxed iframes
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function App() {
  const [route, setRoute] = useState<RoutePath>(() =>
    normalizePath(window.location.pathname)
  );
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme);
  const [user, setUser] = useState<PublicUser | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      window.localStorage.setItem('sist_portal_theme', theme);
    } catch {
      // Ignore storage access errors
    }
  }, [theme]);

  const navigate = useCallback((nextPath: string) => {
    const normalized = normalizePath(nextPath);
    if (window.location.pathname !== normalized) {
      window.history.pushState({}, '', normalized);
    }
    setRoute(normalized);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setRoute(normalizePath(window.location.pathname));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    let active = true;
    portalApi
      .getSession()
      .then((res) => {
        if (!active) return;
        setUser(res.authenticated ? res.user : null);
      })
      .catch(() => {
        if (!active) return;
        setUser(null);
      })
      .finally(() => {
        if (active) setCheckingSession(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!checkingSession && route === '/dashboard' && !user) {
      navigate('/login');
    }
  }, [checkingSession, route, user, navigate]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  if (checkingSession && route === '/dashboard') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-400">
        Restoring portal session…
      </div>
    );
  }

  if (route === '/dashboard' && user) {
    return (
      <DashboardPage
        user={user}
        theme={theme}
        onToggleTheme={toggleTheme}
        onSignedOut={() => setUser(null)}
        onNavigate={navigate}
      />
    );
  }

  if (route === '/login') {
    return (
      <LoginPage
        theme={theme}
        onToggleTheme={toggleTheme}
        onAuthenticated={(authenticatedUser) => setUser(authenticatedUser)}
        onNavigate={navigate}
      />
    );
  }

  return (
    <WelcomePage
      user={user}
      theme={theme}
      onToggleTheme={toggleTheme}
      onNavigate={navigate}
    />
  );
}
