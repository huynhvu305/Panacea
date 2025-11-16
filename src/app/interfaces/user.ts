export interface User {
  user_id: string;
  email: string;
  phone_number: string;
  full_name: string;
  gender: 'male' | 'female' | 'other' | '';
  birthdate: string;
  city: string;

  coin: number;
  star: number;

  password: string;
  two_factor_enabled: boolean;
  account_status: 'active' | 'inactive' | 'deleted';

  last_login?: string;
  created_at?: string;
  role?: 'user' | 'admin';
}
