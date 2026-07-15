// Đăng ký nhận FCM push notification từ hệ thống (edge fn gửi khi có
// chuyến mới / khách đặt / booking hủy trên xe của tài xế).
//
// Token thiết bị lưu ở bảng device_tokens (RLS: mỗi user chỉ thấy token của
// mình). Token FCM xoay vòng nên phải upsert lại khi onTokenRefresh; logout
// phải xóa token khỏi DB, không thì máy này vẫn nhận noti của tài khoản cũ.
//
// Mọi hàm ở đây nuốt lỗi (console.warn): push là tính năng phụ, không được
// làm hỏng luồng đăng nhập/đăng xuất.

import { Platform } from 'react-native';
import {
  getInitialNotification,
  getMessaging,
  getToken,
  deleteToken,
  onMessage,
  onNotificationOpenedApp,
  onTokenRefresh,
  type FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import { requestNotifications, RESULTS } from 'react-native-permissions';
import { supabase } from '../utils/supabase';

let refreshUnsubscribe: (() => void) | null = null;

async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await requestNotifications(['alert', 'sound', 'badge']);
  return status === RESULTS.GRANTED || status === RESULTS.LIMITED;
}

async function upsertDeviceToken(userId: string, token: string): Promise<void> {
  const { error } = await supabase.from('device_tokens').upsert(
    {
      user_id: userId,
      token,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'token' },
  );
  if (error) throw new Error(error.message);
}

/**
 * Gọi sau khi login thành công (profile driver active): xin quyền,
 * lấy token đẩy lên device_tokens và theo dõi token xoay vòng.
 */
export async function enablePushNotifications(userId: string): Promise<void> {
  try {
    const granted = await requestNotificationPermission();
    if (!granted) return; // tài xế từ chối → thôi, không chặn app

    const messaging = getMessaging();
    const token = await getToken(messaging);
    await upsertDeviceToken(userId, token);

    refreshUnsubscribe?.();
    refreshUnsubscribe = onTokenRefresh(messaging, newToken => {
      upsertDeviceToken(userId, newToken).catch(err =>
        console.warn('[push] upsert token refresh thất bại:', err),
      );
    });
  } catch (err) {
    console.warn('[push] enablePushNotifications thất bại:', err);
  }
}

/**
 * Gọi TRƯỚC supabase.auth.signOut() (xóa row cần session còn hiệu lực).
 * deleteToken để lần login sau (kể cả tài khoản khác) nhận token mới sạch.
 */
export async function disablePushNotifications(): Promise<void> {
  try {
    refreshUnsubscribe?.();
    refreshUnsubscribe = null;

    const messaging = getMessaging();
    const token = await getToken(messaging);
    await supabase.from('device_tokens').delete().eq('token', token);
    await deleteToken(messaging);
  } catch (err) {
    console.warn('[push] disablePushNotifications thất bại:', err);
  }
}

/**
 * Noti đến khi app đang mở: FCM không tự hiện banner → app tự xử lý
 * (Alert / refresh dữ liệu). Trả về hàm unsubscribe.
 */
export function subscribeForegroundMessages(
  handler: (title: string, body: string, data: Record<string, unknown>) => void,
): () => void {
  return onMessage(getMessaging(), async message => {
    const { title, body } = message.notification ?? {};
    if (title && body) handler(title, body, message.data ?? {});
  });
}

function extractTripId(
  message: FirebaseMessagingTypes.RemoteMessage | null,
): string | null {
  const tripId = message?.data?.trip_id;
  return typeof tripId === 'string' && tripId.length > 0 ? tripId : null;
}

/**
 * Tài xế bấm vào notification (app ở background hoặc đã tắt hẳn) →
 * gọi handler với trip_id để điều hướng tới chi tiết chuyến.
 * Trả về hàm unsubscribe.
 */
export function subscribeNotificationTap(
  handler: (tripId: string) => void,
): () => void {
  const messaging = getMessaging();

  // App đang background, bấm noti mở lại
  const unsubscribe = onNotificationOpenedApp(messaging, message => {
    const tripId = extractTripId(message);
    if (tripId) handler(tripId);
  });

  // App tắt hẳn, bấm noti khởi động app
  getInitialNotification(messaging)
    .then(message => {
      const tripId = extractTripId(message);
      if (tripId) handler(tripId);
    })
    .catch(() => {});

  return unsubscribe;
}
