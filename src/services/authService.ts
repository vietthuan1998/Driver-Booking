import { supabase } from '../utils/supabase';
import type { Profile } from '../types';

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error('Email hoặc mật khẩu không đúng');
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const email = userData.user?.email;
  if (!email) throw new Error('Không xác định được tài khoản hiện tại');

  // Xác thực lại mật khẩu hiện tại trước khi cho đổi
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email,
    password: currentPassword,
  });
  if (verifyError) throw new Error('Mật khẩu hiện tại không đúng');

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    if (error.message.includes('different from the old password')) {
      throw new Error('Mật khẩu mới phải khác mật khẩu hiện tại');
    }
    throw new Error('Đổi mật khẩu thất bại, vui lòng thử lại');
  }
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error('Đăng xuất thất bại');
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userData.user.id)
    .single();
  if (error) throw new Error('Không tải được thông tin tài khoản');
  return data as Profile;
}
