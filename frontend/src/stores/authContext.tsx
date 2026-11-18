import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { PortalType, SystemRole, VerificationStatus } from '@hausco/shared';
import { apiFetch, getStoredToken, setStoredToken } from '../services/api';

export interface AuthUser {
  id: string;
  email: string;
  phoneE164: string;
  fullName: string;
  role: SystemRole;
  portal: PortalType;
  verificationStatus: VerificationStatus;
  phoneVerified: boolean;
}

export interface UserEntitlement {
  id: string;
  entitlementType: string;
  resourceId: string;
  createdAt: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  entitlements: UserEntitlement[];
  loading: boolean;
  demoNotice: string | null;
  selectedRoleForAuth: SystemRole;
  setSelectedRoleForAuth: (role: SystemRole) => void;
  refreshMe: () => Promise<void>;
  loginWithCredentials: (email: string, password: string, expectedRole?: SystemRole) => Promise<AuthUser>;
  registerUser: (payload: {
    email: string;
    phoneE164: string;
    fullName: string;
    password: string;
    role: SystemRole;
  }) => Promise<AuthUser>;
  demoLogin: (role: SystemRole) => Promise<AuthUser>;
  setSessionFromToken: (token: string, user: AuthUser) => void;
  logout: () => void;
  hasEntitlement: (type: string, resourceId: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [entitlements, setEntitlements] = useState<UserEntitlement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [demoNotice, setDemoNotice] = useState<string | null>(null);
  const [selectedRoleForAuth, setSelectedRoleForAuth] = useState<SystemRole>('HOME_BUILDER');

  const refreshMe = useCallback(async () => {
    if (!getStoredToken()) {
      setUser(null);
      setEntitlements([]);
      setLoading(false);
      return;
    }
    try {
      const res = await apiFetch<{ user: AuthUser; entitlements: UserEntitlement[] }>('/auth/me');
      setUser(res.user);
      setEntitlements(res.entitlements ?? []);
    } catch {
      setStoredToken(null);
      setUser(null);
      setEntitlements([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshMe();
  }, [refreshMe]);

  const loginWithCredentials = async (email: string, password: string, expectedRole?: SystemRole) => {
    const res = await apiFetch<{ token: string; user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, expectedRole }),
    });
    setStoredToken(res.token);
    setUser(res.user);
    setDemoNotice(null);
    await refreshMe();
    return res.user;
  };

  const registerUser = async (payload: {
    email: string;
    phoneE164: string;
    fullName: string;
    password: string;
    role: SystemRole;
  }) => {
    const res = await apiFetch<{ token: string; user: AuthUser }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setStoredToken(res.token);
    setUser(res.user);
    await refreshMe();
    return res.user;
  };

  const demoLogin = async (role: SystemRole) => {
    const res = await apiFetch<{ token: string; user: AuthUser; demoNotice?: string }>('/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
    setStoredToken(res.token);
    setUser(res.user);
    setDemoNotice(res.demoNotice ?? null);
    await refreshMe();
    return res.user;
  };

  const setSessionFromToken = (token: string, nextUser: AuthUser) => {
    setStoredToken(token);
    setUser(nextUser);
    void refreshMe();
  };

  const logout = () => {
    setStoredToken(null);
    setUser(null);
    setEntitlements([]);
    setDemoNotice(null);
  };

  const hasEntitlement = useCallback(
    (type: string, resourceId: string) =>
      entitlements.some(
        (e) =>
          (e.entitlementType === type && e.resourceId === resourceId) ||
          (type === 'FURNITURE_PREMIUM_PLAN' && e.entitlementType === 'FURNITURE_MONTHLY_PASS')
      ),
    [entitlements]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        entitlements,
        loading,
        demoNotice,
        selectedRoleForAuth,
        setSelectedRoleForAuth,
        refreshMe,
        loginWithCredentials,
        registerUser,
        demoLogin,
        setSessionFromToken,
        logout,
        hasEntitlement,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
