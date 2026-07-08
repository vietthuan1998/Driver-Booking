export type Role = 'admin' | 'staff' | 'driver';
export type ProfileStatus = 'active' | 'inactive';

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  role: Role;
  status: ProfileStatus;
  created_at: string;
}

export type VehicleStatus = 'active' | 'inactive' | 'maintenance' | 'pending';

export interface Vehicle {
  id: string;
  plate_number: string;
  vehicle_name: string;
  seat_count: 4 | 7;
  status: VehicleStatus;
  driver_id: string | null;
  created_at: string;
}

export interface Route {
  id: string;
  route_name: string;
  origin: string;
  destination: string;
  base_price: number;
  status: 'active' | 'inactive';
}

export type TripStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface Trip {
  id: string;
  trip_code: string;
  route_id: string;
  vehicle_id: string;
  driver_id: string | null;
  planned_departure_time: string;
  actual_departure_time: string | null;
  actual_arrival_time: string | null;
  trip_status: TripStatus;
  created_at: string;
  route: Pick<Route, 'id' | 'route_name' | 'origin' | 'destination'> | null;
  vehicle: Pick<Vehicle, 'id' | 'plate_number' | 'vehicle_name' | 'seat_count'> | null;
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface TripSeatRow {
  id: string;
  trip_id: string;
  seat_id: string;
  booking_id: string | null;
  status: 'available' | 'locked' | 'booked';
  seat: { seat_code: string; seat_order: number } | null;
  booking: {
    id: string;
    booking_code: string;
    pickup_address: string;
    dropoff_address: string;
    fare_amount: number;
    status: BookingStatus;
    customer: { full_name: string; phone: string } | null;
  } | null;
}

export interface VehicleInput {
  plate_number: string;
  vehicle_name: string;
  seat_count: 4 | 7;
}
