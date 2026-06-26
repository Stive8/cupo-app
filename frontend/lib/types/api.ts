export type UserRole = 'customer' | 'business_owner' | 'admin';

export type BusinessVertical = 'sports_field' | 'barbershop' | 'beauty_center' | 'professional';
export type BusinessStatus = 'pending' | 'active' | 'suspended';
export type SlotStatus = 'available' | 'booked' | 'blocked';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type PaymentStatus = 'pending' | 'approved' | 'rejected' | 'refunded';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: UserRole;
  createdAt: string;
  deletedAt: string | null;
}

export interface LoginResult {
  accessToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
  };
}

export interface Business {
  id: string;
  ownerId: string;
  name: string;
  vertical: BusinessVertical;
  description: string | null;
  address: string;
  city: string;
  lat: number | null;
  lng: number | null;
  metadata: Record<string, unknown> | null;
  status: BusinessStatus;
  depositPercentage: number;
  createdAt: string;
  deletedAt: string | null;
}

export interface Service {
  id: string;
  businessId: string;
  name: string;
  durationMinutes: number;
  priceCents: number;
  currency: string;
  isActive: boolean;
  deletedAt: string | null;
}

export interface AvailabilitySlot {
  id: string;
  businessId: string;
  serviceId: string;
  staffMemberId: string | null;
  startTime: string;
  endTime: string;
  status: SlotStatus;
  capacity: number;
  bookedCount: number;
}

export interface Booking {
  id: string;
  userId: string;
  businessId: string;
  slotId: string;
  serviceId: string;
  status: BookingStatus;
  totalCents: number;
  depositCents: number;
  notes: string | null;
  createdAt: string;
  cancelledAt: string | null;
}

export interface Payment {
  id: string;
  bookingId: string;
  provider: string;
  reference: string;
  providerReference: string | null;
  amountCents: number;
  currency: string;
  status: PaymentStatus;
  createdAt: string;
}

export interface InitiatePaymentResult {
  paymentId: string;
  reference: string;
  amountCents: number;
  currency: string;
  publicKey: string | null;
  integritySignature: string;
}
