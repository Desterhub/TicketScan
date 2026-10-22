export type UserRole = 'user' | 'admin';

export type TransportMode = 'train' | 'flight' | 'bus' | 'unknown';

export type BookingStatus = 'confirmed' | 'waitlisted' | 'rac' | 'cancelled' | 'unknown';

export type FileType = 'pdf' | 'image';

export type AuditAction =
  | 'upload'
  | 'extract'
  | 'edit_field'
  | 'delete_ticket'
  | 'admin_view'
  | 'export'
  | 'login'
  | 'failed_login'
  | 'password_change';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  full_name: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
}

export interface TamperSignal {
  signal: string;
  field?: string;
  risk_level: 'low' | 'medium' | 'high';
  detail: string;
  score_impact?: number;
}

export interface PassengerItem {
  num: number | string;
  name: string;
  age?: number | null;
  gender?: string | null;
  booking_status?: string | null;
  current_status?: string | null;
  seat?: string | null;
}

export interface ExtractedTicketData {
  passenger_name: string | null;
  passenger_age: number | null;
  transport_mode: TransportMode;
  carrier_name: string | null;
  booking_status: BookingStatus;
  pnr_booking_id: string | null;
  boarding_place: string | null;
  destination_place: string | null;
  departure_datetime: string | null;
  arrival_datetime: string | null;
  seat_class_coach: string | null;
  extraction_confidence: number;
  passengers?: PassengerItem[];
  booking_date?: string | null;
  transaction_id?: string | null;
  quota?: string | null;
  distance_km?: string | null;
  total_fare?: string | null;
  ticket_fare?: string | null;
  convenience_fee?: string | null;
}

export interface Ticket {
  id: string;
  user_id: string;
  file_path: string;
  file_type: FileType;
  transport_mode: TransportMode;
  passenger_name: string | null;
  passenger_age: number | null;
  booking_status: BookingStatus;
  pnr_booking_id: string | null;
  boarding_place: string | null;
  destination_place: string | null;
  departure_datetime: string | null;
  arrival_datetime: string | null;
  carrier_name: string | null;
  seat_class_coach: string | null;
  raw_extraction_json: Record<string, unknown> | null;
  extraction_confidence: number | null;
  tamper_risk_score: number | null;
  tamper_signals: TamperSignal[];
  manually_corrected: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: AuditAction;
  target_ticket_id: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

export interface AuthSession {
  userId: string;
  email: string;
  role: UserRole;
  fullName: string | null;
}
