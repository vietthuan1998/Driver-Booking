import { supabase } from '../utils/supabase';
import { disablePushNotifications } from './notificationService';
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
  // Xóa FCM token TRƯỚC khi signOut — xóa row device_tokens cần session
  // còn hiệu lực; không xóa thì máy này vẫn nhận noti của tài khoản cũ.
  await disablePushNotifications();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error('Đăng xuất thất bại');
}

export interface ProfileUpdateInput {
  full_name: string;
  phone: string | null;
}

/**
 * Driver tự cập nhật thông tin cá nhân. RLS chỉ cho sửa dòng của chính mình
 * và khóa role/status; phone có unique constraint (DB tự normalize ''→NULL).
 */
export async function updateProfile(input: ProfileUpdateInput): Promise<Profile> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Không xác định được tài khoản hiện tại');

  const { data, error } = await supabase
    .from('profiles')
    .update({ full_name: input.full_name.trim(), phone: input.phone })
    .eq('id', userData.user.id)
    .select()
    .single();
  if (error) {
    if (error.code === '23505') {
      throw new Error('Số điện thoại này đã được dùng bởi tài khoản khác');
    }
    throw new Error('Cập nhật thông tin thất bại, vui lòng thử lại');
  }
  return data as Profile;
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
