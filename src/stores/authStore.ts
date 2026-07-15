import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';
import { getCurrentProfile, signOut } from '../services/authService';
import { enablePushNotifications } from '../services/notificationService';
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
  /** Cập nhật profile trong store sau khi driver sửa thông tin cá nhân */
  setProfile: (profile: Profile) => void;
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
          // Đăng ký FCM token sau khi chắc chắn là driver active
          // (nuốt lỗi bên trong — push lỗi không được chặn đăng nhập)
          enablePushNotifications(profile.id);
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

  setProfile: (profile) => set({ profile }),
}));
