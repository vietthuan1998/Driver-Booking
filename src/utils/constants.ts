import type { BookingStatus, TripStatus, VehicleStatus } from '../types';

export const TRIP_STATUS_LABEL: Record<TripStatus, string> = {
  scheduled: 'Đã lên lịch',
  in_progress: 'Đang chạy',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

export const TRIP_STATUS_COLOR: Record<TripStatus, string> = {
  scheduled: '#2563eb',
  in_progress: '#d97706',
  completed: '#16a34a',
  cancelled: '#dc2626',
};

export const VEHICLE_STATUS_LABEL: Record<VehicleStatus, string> = {
  active: 'Đang hoạt động',
  inactive: 'Ngừng hoạt động',
  maintenance: 'Bảo trì',
  pending: 'Chờ duyệt',
};

export const VEHICLE_STATUS_COLOR: Record<VehicleStatus, string> = {
  active: '#16a34a',
  inactive: '#6b7280',
  maintenance: '#d97706',
  pending: '#2563eb',
};

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  cancelled: 'Đã hủy',
  completed: 'Hoàn thành',
};

export const COLORS = {
  primary: '#2563eb',
  primaryDark: '#1e40af',
  primarySoft: '#eef4ff',
  bg: '#f4f6fb',
  card: '#ffffff',
  border: '#e8ecf4',
  text: '#101828',
  textMuted: '#68738a',
  danger: '#dc2626',
  dangerSoft: '#fdeeee',
  success: '#16a34a',
  successSoft: '#ecf9f0',
  warning: '#d97706',
};

// Đổ bóng dùng chung cho card (iOS shadow + Android elevation)
export const CARD_SHADOW = {
  shadowColor: '#1e3a8a',
  shadowOpacity: 0.08,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
} as const;
