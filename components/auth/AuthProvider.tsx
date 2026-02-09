'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAnonymous: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export interface AuthProviderProps {
  children: React.ReactNode;
  /** 서버에서 가져온 초기 사용자 (플래시 방지) */
  initialUser?: User | null;
}

export function AuthProvider({ children, initialUser = null }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser ?? null);
  const [isLoading, setIsLoading] = useState(!initialUser);

  useEffect(() => {
    const syncUser = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (currentUser) {
        setUser(currentUser);
        setIsLoading(false);
        return;
      }

      // 세션이 없으면 익명 로그인
      const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
      if (!anonError && anonData.user) {
        setUser(anonData.user);
      } else {
        console.error('Anonymous sign-in failed:', anonError);
        setUser(null);
      }
      setIsLoading(false);
    };

    syncUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value: AuthContextValue = {
    user,
    isLoading,
    isAnonymous: user?.is_anonymous ?? false,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    return {
      user: null,
      isLoading: false,
      isAnonymous: false,
    };
  }
  return ctx;
}
