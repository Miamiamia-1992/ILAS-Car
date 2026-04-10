export interface Vehicle {
  id: number;
  name: string;
  plate_number: string;
  type: string;
  fuel_type: string;
  description: string;
  is_active: number;
}

export interface Reservation {
  id: number;
  vehicle_id: number;
  date: string;
  start_time: string;
  end_time: string;
  person_name: string;
  phone: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  vehicle_name?: string;
  plate_number?: string;
  type?: string;
  fuel_type?: string;
}

export interface UnavailableDate {
  id: number;
  vehicle_id: number;
  date: string;
  reason: string;
  created_at: string;
  plate_number?: string;
  vehicle_name?: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}
