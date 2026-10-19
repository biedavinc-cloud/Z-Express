import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api, isBackendConfigured } from '@/api/client';

const AuthContext = createContext(null);

// Single source of truth for "who is signed in". It never blocks the public
// site: pages that need a session are guarded by <ProtectedRoute>, everything
// else renders immediately.
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(isBackendConfigured);
  const [authChecked, setAuthChecked] = useState(!isBackendConfigured);
  const [authError, setAuthError] = useState(null);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const mounted = useRef(true);

  const checkUserAuth = useCallback(async () => {
    if (!isBackendConfigured) {
      setUser(null);
      setIsLoadingAuth(false);
      setAuthChecked(true);
      return null;
    }
    try {
      const current = await api.auth.me();
      if (!mounted.current) return current;
      setUser(current);
      setAuthError(null);
      return current;
    } catch (error) {
      if (!mounted.current) return null;
      setUser(null);
      // A missing session is normal for visitors; anything else is worth surfacing.
      setAuthError(error?.status === 401 ? null : { type: 'unknown', message: error?.message || 'Authentication failed' });
      return null;
    } finally {
      if (mounted.current) {
        setIsLoadingAuth(false);
        setAuthChecked(true);
      }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    checkUserAuth();

    if (!isBackendConfigured) return undefined;

    // The callback runs inside the auth client's lock: never await Supabase calls
    // in it directly (that deadlocks) — defer to the next tick instead.
    const unsubscribe = api.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setIsPasswordRecovery(true);
      setTimeout(() => {
        if (!mounted.current) return;
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsPasswordRecovery(false);
          setAuthChecked(true);
          setIsLoadingAuth(false);
        } else {
          checkUserAuth();
        }
      }, 0);
    });

    return () => {
      mounted.current = false;
      unsubscribe();
    };
  }, [checkUserAuth]);

  const logout = useCallback(async (redirectTo = '/') => {
    setUser(null);
    await api.auth.logout(redirectTo);
  }, []);

  const navigateToLogin = useCallback((returnTo) => {
    api.auth.redirectToLogin(returnTo ?? `${window.location.pathname}${window.location.search}`);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoadingAuth,
      authChecked,
      authError,
      isPasswordRecovery,
      logout,
      navigateToLogin,
      checkUserAuth,
    }),
    [user, isLoadingAuth, authChecked, authError, isPasswordRecovery, logout, navigateToLogin, checkUserAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
