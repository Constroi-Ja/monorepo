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
}

// Store and Provider Types
export interface Store {
  id: number;
  company_name: string;
  category: string;
  distance: number;
  rating: number;
  image_url?: string;
}

export interface Provider {
  id: number;
  full_name: string;
  specialties: string[];
  distance: number;
  rating: number;
  image_url?: string;
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
