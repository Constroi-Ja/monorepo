// User Types
export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  is_verified: boolean;
  user_type: "consumer" | "provider" | "company" | "admin" | null;
  date_joined: string;
  profile_photo_url?: string | null;
  consumer_profile?: ConsumerProfile;
  provider_profile?: ProviderProfile;
  company_profile?: CompanyProfile;
}

export interface ConsumerProfile {
  full_name: string;
  cep: string;
  street: string;
  number: string;
  complement: string | null;
  city: string;
  state: string;
  cpf: string;
  gender: string;
  phone: string;
  birth_date: string;
}

export interface ProviderProfile {
  full_name: string;
  specialties: string[];
  criminal_record: string | null;
  criminal_record_url?: string | null;
  cep: string;
  street: string;
  number: string;
  complement: string | null;
  city: string;
  state: string;
  cpf: string;
  cnpj: string | null;
  gender: string;
  phone: string;
  birth_date: string;
  verified: boolean;
  is_available: boolean;
  coverage_radius_km?: number;
  rating_average: number;
  rating_count: number;
}

export interface CompanyProfile {
  company_name: string;
  cep: string;
  street: string;
  number: string;
  complement: string | null;
  city: string;
  state: string;
  cnpj: string;
  segment: string;
  phone: string;
  opening_time?: string | null;
  closing_time?: string | null;
  display_radius_km: number;
  avg_minutes_per_km: number;
  onboarding_completed: boolean;
  pix_key_type?: string;
  pix_key?: string;
  logo_url?: string | null;
  rating_average: number;
  rating_count: number;
}

// Store and Provider Types
export interface Store {
  id: number;
  company_user_id?: number;
  company_name: string;
  category: string;
  distance: number;
  rating: number;
  rating_count?: number;
  eta_minutes?: number;
  is_open?: boolean;
  opening_time?: string | null;
  closing_time?: string | null;
  image_url?: string;
}

export interface Provider {
  id: number;
  full_name: string;
  specialties: string[];
  distance: number;
  rating: number;
  rating_count?: number;
  eta_minutes?: number;
  is_available?: boolean;
  verified?: boolean;
  image_url?: string;
}

export interface CartItem {
  id: number;
  item: {
    id: number;
    company_id: number;
    company_name: string;
    name: string;
    marca?: string;
    peso?: number | null;
    description: string;
    price: string;
    shipping_type: "leve" | "medio" | "meio-pesado" | "pesado";
    shipping_type_display: string;
    photo_url?: string | null;
  };
  quantity: number;
  total: number;
}

export interface Order {
  id: number;
  buyer: number;
  buyer_name: string;
  company: number;
  company_name: string;
  status: "pendente" | "confirmado" | "enviado" | "entregue" | "cancelado";
  status_display: string;
  total_amount: string;
  shipping_cost?: string;
  shipping_type?: string;
  payment_status?: string | null;
  items: OrderItemData[];
  created_at: string;
  updated_at: string;
}

export interface OrderItemData {
  id: number;
  item: number;
  item_name: string;
  item_marca: string;
  item_photo_url?: string | null;
  quantity: number;
  unit_price: string;
}

export interface OrderMessage {
  id: number;
  sender_name: string;
  is_mine: boolean;
  content: string;
  created_at: string;
}

export interface Deliverer {
  id: number;
  name: string;
  level: "leve" | "medio" | "meio-pesado" | "pesado";
  level_display: string;
  phone: string | null;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface TechnicalVisitRequest {
  id: number;
  consumer: number;
  provider: number;
  consumer_name: string;
  provider_name: string;
  notes?: string | null;
  preferred_date?: string | null;
  address: string;
  status: "awaiting_payment" | "pending" | "accepted" | "refused" | "completed" | "cancelled";
  cancelled_by?: "consumer" | "provider" | null;
  payment_status?: "pending" | "approved" | "rejected" | "cancelled" | "refunded" | null;
  estimated_eta_minutes?: number | null;
  pending_since?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface VisitMessage {
  id: number;
  sender_name: string;
  content: string;
  created_at: string;
}

export interface CreateVisitResponse {
  visit: TechnicalVisitRequest;
  payment: {
    payment_id: number;
    method: "pix" | "credit_card";
    status: string;
    qr_code_base64?: string | null;
    qr_code_text?: string | null;
    status_detail?: string;
    amount: string;
  };
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  password_confirm: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface TokenRefreshResponse {
  access: string;
}

export interface TokenRefreshRequest {
  refresh: string;
}

export interface Review {
  id: number;
  reviewer_name: string;
  target_name: string;
  target_type: "provider" | "company";
  rating: number;
  comment: string;
  created_at: string;
}

// API Response Types
export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: ApiError;
}
