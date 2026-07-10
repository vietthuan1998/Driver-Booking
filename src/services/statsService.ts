import { supabase } from '../utils/supabase';
import { getDayRange, getMonthRange, getWeekRange } from '../utils/helpers';
import type { Trip } from '../types';

export interface StatsData {
  totalTrips: number;
  completedTrips: number;
  totalRevenue: number;
  totalPassengers: number;
  averageRating: number;
}

export interface TripHistoryItem extends Trip {
  passengersCount: number;
  totalFare: number;
}

/**
 * Lấy thống kê của tài xế cho khoảng thời gian
 */
export async function getStats(
  startDate: Date,
  endDate: Date,
): Promise<StatsData> {
  const start = startDate.toISOString();
  const end = endDate.toISOString();

  // Lấy tất cả trips trong khoảng thời gian
  const { data: trips, error: tripsError } = await supabase
    .from('trips')
    .select(
      `
      id, trip_status, planned_departure_time,
      trip_seats (
        booking:bookings ( fare_amount, status )
      )
    `,
    )
    .gte('planned_departure_time', start)
    .lte('planned_departure_time', end);

console.log('========== getStats ==========');
console.log('Query range:', {
  start,
  end,
});

console.log('Supabase Error:', tripsError);

console.log(
  'Supabase Response:',
  JSON.stringify(trips, null, 2),
);


  if (tripsError) throw new Error('Không tải được thống kê');

  const tripList = (trips ?? []) as any[];

  const completedTrips = tripList.filter((t) => t.trip_status === 'completed');
  const totalTrips = tripList.length;
  let totalRevenue = 0;
  let totalPassengers = 0;

  // Tính tổng doanh thu và số hành khách
  completedTrips.forEach((trip) => {
    const tripSeats = trip.trip_seats || [];
    tripSeats.forEach((seat: any) => {
      if (seat.booking?.status === 'confirmed') {
        totalRevenue += seat.booking.fare_amount || 0;
        totalPassengers += 1;
      }
    });
  });
console.log('Completed trips:', completedTrips.length);
console.log('Total revenue:', totalRevenue);
console.log('Total passengers:', totalPassengers);

  return {
    totalTrips,
    completedTrips: completedTrips.length,
    totalRevenue,
    totalPassengers,
    averageRating: 4.8, // TODO: Thêm rating sau
  };
}

/**
 * Lấy thống kê hôm nay
 */
export async function getTodayStats(): Promise<StatsData> {
  const { start, end } = getDayRange(new Date());
  return getStats(new Date(start), new Date(end));
}

/**
 * Lấy thống kê tuần này
 */
export async function getThisWeekStats(): Promise<StatsData> {
  const { start, end } = getWeekRange(new Date());
  return getStats(new Date(start), new Date(end));
}

/**
 * Lấy thống kê tháng này
 */
export async function getThisMonthStats(): Promise<StatsData> {
  const { start, end } = getMonthRange(new Date());
  return getStats(new Date(start), new Date(end));
}

/**
 * Lấy lịch sử chuyến (phân trang)
 */
export async function getTripHistory(
  limit: number = 20,
  offset: number = 0,
): Promise<TripHistoryItem[]> {
  const TRIP_SELECT = `
    id, trip_code, route_id, vehicle_id,
    planned_departure_time, actual_departure_time, actual_arrival_time,
    trip_status, created_at,
    route:routes ( id, route_name, origin, destination ),
    vehicle:vehicles ( id, plate_number, vehicle_name, seat_count ),
    trip_seats (
      booking:bookings ( fare_amount, status )
    )
  `;

  const { data, error } = await supabase
    .from('trips')
    .select(TRIP_SELECT)
    .order('planned_departure_time', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error('Không tải được lịch sử chuyến');

  const trips = (data ?? []) as any[];

  return trips.map((trip) => {
    let totalFare = 0;
    let passengersCount = 0;

    const tripSeats = trip.trip_seats || [];
    tripSeats.forEach((seat: any) => {
      if (seat.booking?.status === 'completed') {
        totalFare += seat.booking.fare_amount || 0;
        passengersCount += 1;
      }
    });

    return {
      ...trip,
      totalFare,
      passengersCount,
    };
  });
}

/**
 * Lấy lịch sử chuyến trong 1 tháng (pagination)
 */
export async function getTripHistoryByMonth(
  month: Date,
  limit: number = 20,
  offset: number = 0,
): Promise<TripHistoryItem[]> {
  const { start, end } = getMonthRange(month);

  const TRIP_SELECT = `
    id, trip_code, route_id, vehicle_id,
    planned_departure_time, actual_departure_time, actual_arrival_time,
    trip_status, created_at,
    route:routes ( id, route_name, origin, destination ),
    vehicle:vehicles ( id, plate_number, vehicle_name, seat_count ),
    trip_seats (
      booking:bookings ( fare_amount, status )
    )
  `;

  const { data, error } = await supabase
    .from('trips')
    .select(TRIP_SELECT)
    .gte('planned_departure_time', start)
    .lte('planned_departure_time', end)
    .order('planned_departure_time', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error('Không tải được lịch sử chuyến');

  const trips = (data ?? []) as any[];

  return trips.map((trip) => {
    let totalFare = 0;
    let passengersCount = 0;

    const tripSeats = trip.trip_seats || [];
    tripSeats.forEach((seat: any) => {
      if (seat.booking?.status === 'completed') {
        totalFare += seat.booking.fare_amount || 0;
        passengersCount += 1;
      }
    });

    return {
      ...trip,
      totalFare,
      passengersCount,
    };
  });
}
