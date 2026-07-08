import { supabase } from '../utils/supabase';
import type { Vehicle, VehicleInput } from '../types';

/** Xe gắn với tài xế đang đăng nhập (driver_id unique → tối đa 1 xe). */
export async function getMyVehicle(): Promise<Vehicle | null> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('driver_id', userData.user.id)
    .maybeSingle();
  if (error) throw new Error('Không tải được thông tin xe');
  return data as Vehicle | null;
}

/** Tài xế tự đăng ký xe → status 'pending', chờ admin/staff duyệt trên web. */
export async function registerVehicle(input: VehicleInput): Promise<Vehicle> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Chưa đăng nhập');

  const { data, error } = await supabase
    .from('vehicles')
    .insert({ ...input, status: 'pending', driver_id: userData.user.id })
    .select('*')
    .single();
  if (error) {
    if (error.code === '23505') {
      throw new Error('Biển số xe đã tồn tại hoặc bạn đã đăng ký xe');
    }
    throw new Error('Đăng ký xe thất bại. Vui lòng thử lại.');
  }
  return data as Vehicle;
}

/** Sửa xe khi còn chờ duyệt (trigger DB chặn đổi seat_count → chỉ cho sửa biển số/tên xe). */
export async function updatePendingVehicle(
  vehicleId: string,
  input: Pick<VehicleInput, 'plate_number' | 'vehicle_name'>,
): Promise<Vehicle> {
  const { data, error } = await supabase
    .from('vehicles')
    .update(input)
    .eq('id', vehicleId)
    .select('*')
    .single();
  if (error) {
    if (error.code === '23505') throw new Error('Biển số xe đã tồn tại');
    throw new Error('Cập nhật xe thất bại. Xe có thể đã được duyệt.');
  }
  return data as Vehicle;
}

/** Xóa xe khi còn chờ duyệt. */
export async function deletePendingVehicle(vehicleId: string): Promise<void> {
  const { error } = await supabase.from('vehicles').delete().eq('id', vehicleId);
  if (error) throw new Error('Xóa xe thất bại. Xe có thể đã được duyệt.');
}
