import { supabase } from '../utils/supabase';
import { getDayRange } from '../utils/helpers';
import type { Trip, TripSeatRow } from '../types';

const TRIP_SELECT = `
  *,
  route:routes ( id, route_name, origin, destination ),
  vehicle:vehicles ( id, plate_number, vehicle_name, seat_count )
`;

/** Chuyến của tài xế đang đăng nhập trong 1 ngày (RLS đã giới hạn driver_id = mình). */
export async function getMyTripsByDate(date: Date): Promise<Trip[]> {
  const { start, end } = getDayRange(date);
  const { data, error } = await supabase
    .from('trips')
    .select(TRIP_SELECT)
    .gte('planned_departure_time', start)
    .lte('planned_departure_time', end)
    .order('planned_departure_time', { ascending: true });
  if (error) throw new Error('Không tải được danh sách chuyến');
  return (data ?? []) as unknown as Trip[];
}

export async function getTripById(tripId: string): Promise<Trip> {
  const { data, error } = await supabase
    .from('trips')
    .select(TRIP_SELECT)
    .eq('id', tripId)
    .single();
  if (error) throw new Error('Không tải được thông tin chuyến');
  return data as unknown as Trip;
}

/** Ghế + booking + khách của 1 chuyến (driver được đọc customers trong chuyến của mình). */
export async function getTripSeatsWithBookings(tripId: string): Promise<TripSeatRow[]> {
  const { data, error } = await supabase
    .from('trip_seats')
    .select(
      `
      id, trip_id, seat_id, booking_id, status,
      seat:seats ( seat_code, seat_order ),
      booking:bookings (
        id, booking_code, pickup_address, dropoff_address, fare_amount, status,
        customer:customers ( full_name, phone )
      )
    `,
    )
    .eq('trip_id', tripId);
  if (error) throw new Error('Không tải được danh sách ghế');
  const rows = (data ?? []) as unknown as TripSeatRow[];
  return rows.sort((a, b) => (a.seat?.seat_order ?? 0) - (b.seat?.seat_order ?? 0));
}

/** Bắt đầu chuyến: scheduled → in_progress + ghi giờ khởi hành thực tế.
 *  RLS chỉ cho driver đổi trip_status/actual_*, các cột khác bị khóa. */
export async function startTrip(tripId: string): Promise<void> {
  const { error } = await supabase
    .from('trips')
    .update({ trip_status: 'in_progress', actual_departure_time: new Date().toISOString() })
    .eq('id', tripId);
  if (error) throw new Error('Không bắt đầu được chuyến. Vui lòng thử lại.');
}

/** Kết thúc chuyến: in_progress → completed + ghi giờ đến thực tế. */
export async function completeTrip(tripId: string): Promise<void> {
  const { error } = await supabase
    .from('trips')
    .update({ trip_status: 'completed', actual_arrival_time: new Date().toISOString() })
    .eq('id', tripId);
  if (error) throw new Error('Không hoàn thành được chuyến. Vui lòng thử lại.');
}
