// User Types
export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  is_verified: boolean;
  user_type: "consumer" | "provider" | "company" | null;
  date_joined: string;
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
  rating_average: number;
  rating_count: number;
}

// Store and Provider Types
export interface Store {
  id: number;
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
  image_url?: string;
}

export interface CartItem {
  id: number;
  item: {
    id: number;
    company_id: number;
    company_name: string;
    name: string;
    description: string;
    price: string;
    shipping_type: "leve" | "medio" | "meio-pesado" | "pesado";
    shipping_type_display: string;
    photo_url?: string | null;
  };
  quantity: number;
  total: number;
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
  consumer_name: string;
  provider_name: string;
  notes?: string | null;
  preferred_date?: string | null;
  address: string;
  status: "pending" | "accepted" | "refused" | "completed";
  created_at: string;
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

// API Response Types
export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: ApiError;
}
