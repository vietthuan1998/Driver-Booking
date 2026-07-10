import { supabase } from '../utils/supabase';
import { getDayRange } from '../utils/helpers';
import type { Trip, TripSeatRow } from '../types';

const TRIP_SELECT = `
  *,
  route:routes ( id, route_name, origin, destination ),
  vehicle:vehicles ( id, plate_number, vehicle_name, seat_count )
`;

/** Chuyến của tài xế đang đăng nhập trong 1 ngày (RLS giới hạn theo xe của tài xế). */
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
 *  RLS chỉ cho driver đổi trip_status/actual_*, các cột khác bị khóa.
 *  DB có unique index chặn 2 chuyến in_progress trên cùng 1 xe (lỗi 23505). */
export async function startTrip(tripId: string): Promise<void> {
  const now = new Date();

  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('id, trip_status, planned_departure_time, actual_departure_time')
    .eq('id', tripId)
    .single();

  if (tripError || !trip) {
    throw new Error('Không tìm thấy chuyến để bắt đầu.');
  }

  if (trip.trip_status !== 'scheduled') {
    throw new Error('Chuyến này không ở trạng thái có thể bắt đầu.');
  }

  const plannedDeparture = new Date(trip.planned_departure_time);
  const diffMinutes = (plannedDeparture.getTime() - now.getTime()) / (1000 * 60);
  console.log('startTrip diffMinutes:', diffMinutes, 'plannedDeparture:', plannedDeparture.toISOString(), 'now:', now.toISOString());

if (diffMinutes < -30 || diffMinutes > 30) {
  throw new Error('Chỉ có thể bắt đầu chuyến trong vòng 30 phút trước hoặc sau giờ khởi hành dự kiến.');
}
  const { data: activeTrips, error: activeTripsError } = await supabase
    .from('trips')
    .select('id')
    .eq('trip_status', 'in_progress');

  if (activeTripsError) {
    throw new Error('Không kiểm tra được chuyến đang chạy.');
  }

  if ((activeTrips ?? []).length > 0) {
    throw new Error('Đã có chuyến khác đang chạy, vui lòng hoàn thành chuyến đó trước.');
  }

  const { error } = await supabase
    .from('trips')
    .update({ trip_status: 'in_progress', actual_departure_time: now.toISOString() })
    .eq('id', tripId);

  if (error) throw new Error('Không bắt đầu được chuyến. Vui lòng thử lại.');
}

/** Kết thúc chuyến: in_progress → completed + ghi giờ đến thực tế. */
export async function completeTrip(tripId: string): Promise<void> {
  const now = new Date();

  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('id, trip_status, actual_departure_time')
    .eq('id', tripId)
    .single();

  if (tripError || !trip) {
    throw new Error('Không tìm thấy chuyến để hoàn thành.');
  }

  if (trip.trip_status !== 'in_progress') {
    throw new Error('Chuyến này không ở trạng thái có thể hoàn thành.');
  }

  if (!trip.actual_departure_time) {
    throw new Error('Chuyến chưa có thời gian bắt đầu thực tế.');
  }

  const actualDeparture = new Date(trip.actual_departure_time);
  const diffHours = (now.getTime() - actualDeparture.getTime()) / (1000 * 60 * 60);

  if (diffHours < 2) {
    throw new Error('Chuyến phải chạy ít nhất 2 tiếng trước khi hoàn thành.');
  }

  const { error } = await supabase
    .from('trips')
    .update({ trip_status: 'completed', actual_arrival_time: now.toISOString() })
    .eq('id', tripId);
  console.log('completeTrip error:', error);
  console.log('trip Status:', trip.trip_status, 'actual_departure_time:', trip.actual_departure_time, 'now:', now.toISOString());
  if (error) throw new Error('Không hoàn thành được chuyến. Vui lòng thử lại.');
  
}
