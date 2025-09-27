export interface Admin {
  id: string;
  email: string;
  password: string;
  created_at: string;
}

export interface Configuration {
  id: string;
  github_username: string;
  maintenance_deployment_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Software {
  id: string;
  name: string;
  description?: string;
  github_repo_template: string;
  github_token: string;
  payment_template_subject: string;
  payment_template_body: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subscriber {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  project_name: string;
  software_id: string;
  client_slug: string;
  vercel_token: string;
  vercel_team_id?: string;
  supabase_info?: string;
  custom_config?: Record<string, unknown>;
  edge_config_id?: string;
  edge_key?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  subscription_status: 'PENDING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'PAUSED';
  subscription_type?: 'daily' | 'monthly' | 'yearly';
  subscription_price?: number;
  next_billing_date?: string;
  last_payment_date?: string;
  github_repo_url?: string;
  vercel_project_id?: string;
  vercel_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  notes?: string;
  // Relazione con software
  software?: Software;
}

export interface Payment {
  id: string;
  subscriber_id: string;
  stripe_payment_intent_id: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'failed' | 'pending';
  paid_at?: string;
  failure_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSubscriberData {
  first_name: string;
  last_name: string;
  email: string;
  project_name: string;
  software_id: string;
  client_slug: string;
  vercel_token: string;
  vercel_team_id?: string;
  supabase_info?: string;
  custom_config?: Record<string, unknown>;
  edge_config_id?: string;
  edge_key?: string;
  subscription_price: number;
  subscription_type: 'daily' | 'monthly' | 'yearly';
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

