import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';
import { getCurrentProfile, signOut } from '../services/authService';
import type { Profile } from '../types';

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  /** Lỗi hiển thị khi tài khoản không phải driver / bị khóa */
  authError: string | null;
  initializeAuth: () => void;
  cleanup: () => void;
  clearAuthError: () => void;
}

let unsubscribe: (() => void) | null = null;

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  profile: null,
  isLoading: true,
  authError: null,

  initializeAuth: () => {
    if (unsubscribe) return; // guard: chỉ subscribe 1 lần (giống web admin)

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      // Không await trực tiếp trong callback onAuthStateChange (deadlock supabase-js)
      setTimeout(async () => {
        if (!session) {
          set({ session: null, profile: null, isLoading: false });
          return;
        }
        try {
          const profile = await getCurrentProfile();
          // App này chỉ dành cho tài xế đang hoạt động
          if (!profile || profile.role !== 'driver' || profile.status !== 'active') {
            await signOut();
            set({
              session: null,
              profile: null,
              isLoading: false,
              authError:
                profile && profile.role !== 'driver'
                  ? 'Tài khoản này không phải tài xế. Vui lòng dùng web quản trị.'
                  : 'Tài khoản đã bị khóa. Liên hệ quản trị viên.',
            });
            return;
          }
          set({ session, profile, isLoading: false, authError: null });
        } catch {
          set({ session: null, profile: null, isLoading: false, authError: 'Không tải được thông tin tài khoản' });
        }
      }, 0);
    });
    unsubscribe = () => data.subscription.unsubscribe();
  },

  cleanup: () => {
    unsubscribe?.();
    unsubscribe = null;
  },

  clearAuthError: () => set({ authError: null }),
}));
