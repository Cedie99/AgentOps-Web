import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface AuthState {
  user: SupabaseUser | null;
  dbUser: {
    id: number;
    email: string;
    name: string;
    role: 'SUPER_ADMIN' | 'ADMIN';
    status: string;
    avatar?: string | null;
  } | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: SupabaseUser | null) => void;
  setDbUser: (dbUser: AuthState['dbUser']) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      dbUser: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) => set({
        user,
        isAuthenticated: !!user,
        isLoading: false
      }),

      setDbUser: (dbUser) => set({ dbUser }),

      logout: () => set({
        user: null,
        dbUser: null,
        isAuthenticated: false
      }),

      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        dbUser: state.dbUser,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
);
