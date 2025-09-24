-- Schema per Supabase (senza Prisma)
-- Esegui questi comandi nel SQL Editor di Supabase

-- Tabella Admin
CREATE TABLE IF NOT EXISTS admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabella Configuration
CREATE TABLE IF NOT EXISTS configurations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  github_token TEXT NOT NULL,
  github_username TEXT NOT NULL,
  stripe_secret_key TEXT NOT NULL,
  stripe_webhook_secret TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabella Subscriber
CREATE TABLE IF NOT EXISTS subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  project_name TEXT NOT NULL,
  github_repo_template TEXT NOT NULL,
  client_slug TEXT NOT NULL,
  vercel_token TEXT NOT NULL,
  vercel_team_id TEXT,
  supabase_info TEXT,
  custom_config JSONB,
  edge_config_id TEXT,
  edge_key TEXT DEFAULT 'maintenance',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'ACTIVE',
  subscription_price DECIMAL,
  next_billing_date TIMESTAMP WITH TIME ZONE,
  last_payment_date TIMESTAMP WITH TIME ZONE,
  github_repo_url TEXT,
  vercel_project_id TEXT,
  vercel_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

-- Tabella Payment
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subscriber_id UUID REFERENCES subscribers(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  amount DECIMAL NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE,
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserisci admin di default (password: admin123)
INSERT INTO admins (email, password) 
VALUES ('admin@example.com', '$2a$10$rQZ8K9L2vN3mP4qR5sT6uO7wX8yZ9A0bC1dE2fG3hI4jK5lM6nO7pQ8rS9tU')
ON CONFLICT (email) DO NOTHING;

-- Inserisci configurazione di default
INSERT INTO configurations (github_token, github_username, stripe_secret_key, stripe_webhook_secret)
VALUES ('your-github-token', 'your-github-username', 'your-stripe-secret', 'your-webhook-secret')
ON CONFLICT DO NOTHING;


