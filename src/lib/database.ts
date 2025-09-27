// Database operations usando Supabase (sostituisce Prisma)
import { supabaseAdmin } from './supabase-admin'

// Tipi TypeScript per le tabelle
export interface Admin {
  id: string
  email: string
  password: string
  created_at: string
}

export interface Configuration {
  id: string
  github_token: string
  github_username: string
  maintenance_deployment_id?: string
  created_at: string
  updated_at: string
}

export interface Subscriber {
  id: string
  first_name: string
  last_name: string
  email: string
  project_name: string
  github_repo_template: string
  client_slug: string
  vercel_token: string
  vercel_team_id?: string
  supabase_info?: string
  custom_config?: Record<string, unknown>
  edge_config_id?: string
  edge_key?: string
  stripe_customer_id?: string
  stripe_subscription_id?: string
  subscription_status: string
  subscription_type?: 'daily' | 'monthly' | 'yearly'
  subscription_price?: number
  next_billing_date?: string
  last_payment_date?: string
  github_repo_url?: string
  vercel_project_id?: string
  vercel_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
  notes?: string
}

export interface Payment {
  id: string
  subscriber_id: string
  stripe_payment_intent_id: string
  amount: number
  currency: string
  status: string
  paid_at?: string
  failure_reason?: string
  created_at: string
  updated_at: string
}

// Funzioni database
export const db = {
  // Admin operations
  async getAdminByEmail(email: string): Promise<Admin | null> {
    const { data, error } = await supabaseAdmin
      .from('admins')
      .select('*')
      .eq('email', email)
      .single()
    
    if (error) return null
    return data
  },

  // Configuration operations
  async getConfiguration(): Promise<Configuration | null> {
    const { data, error } = await supabaseAdmin
      .from('configurations')
      .select('*')
      .single()
    
    if (error) return null
    return data
  },

  async updateConfiguration(config: Partial<Configuration>): Promise<Configuration | null> {
    const { data, error } = await supabaseAdmin
      .from('configurations')
      .upsert(config)
      .select()
      .single()
    
    if (error) return null
    return data
  },

  // Subscriber operations
  async getSubscriberById(id: string): Promise<Subscriber | null> {
    const { data, error } = await supabaseAdmin
      .from('subscribers')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) return null
    return data
  },

  async getSubscribers(): Promise<Subscriber[]> {
    const { data, error } = await supabaseAdmin
      .from('subscribers')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) return []
    return data || []
  },

  async createSubscriber(subscriber: Omit<Subscriber, 'id' | 'created_at' | 'updated_at'>): Promise<Subscriber | null> {
    const { data, error } = await supabaseAdmin
      .from('subscribers')
      .insert(subscriber)
      .select()
      .single()
    
    if (error) {
      console.error('❌ Errore creazione subscriber:', error);
      return null
    }
    return data
  },

  async updateSubscriber(id: string, updates: Partial<Subscriber>): Promise<Subscriber | null> {
    const { data, error } = await supabaseAdmin
      .from('subscribers')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Errore aggiornamento subscriber:', error)
      return null
    }
    return data
  },

  async toggleSubscriberStatus(id: string): Promise<Subscriber | null> {
    const { data: subscriber } = await supabaseAdmin
      .from('subscribers')
      .select('is_active')
      .eq('id', id)
      .single()
    
    if (!subscriber) return null
    
    return this.updateSubscriber(id, { is_active: !subscriber.is_active })
  },

  // Payment operations
  async getPaymentsBySubscriber(subscriberId: string): Promise<Payment[]> {
    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('subscriber_id', subscriberId)
      .order('created_at', { ascending: false })
    
    if (error) return []
    return data || []
  },

  async createPayment(payment: Omit<Payment, 'id' | 'created_at' | 'updated_at'>): Promise<Payment | null> {
    const { data, error } = await supabaseAdmin
      .from('payments')
      .insert(payment)
      .select()
      .single()
    
    if (error) return null
    return data
  },

  // Delete subscriber
  async deleteSubscriber(id: string): Promise<boolean> {
    const { error } = await supabaseAdmin
      .from('subscribers')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Errore eliminazione subscriber:', error)
      return false
    }
    return true
  }
}

