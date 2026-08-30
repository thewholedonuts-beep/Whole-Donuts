CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Sponsors table
CREATE TABLE sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  tier VARCHAR(50) DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold')),
  referral_code VARCHAR(100) UNIQUE NOT NULL,
  total_contribution DECIMAL(10,2) DEFAULT 0,
  effort_score DECIMAL(10,2) DEFAULT 0,
  discount_earned DECIMAL(5,2) DEFAULT 0,
  safety_status VARCHAR(50) DEFAULT 'active' CHECK (safety_status IN ('active', 'suspicious', 'blocked')),
  customization_limit INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Referral codes table
CREATE TABLE referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id UUID UNIQUE NOT NULL REFERENCES sponsors(id) ON DELETE CASCADE,
  code_string VARCHAR(100) UNIQUE NOT NULL,
  usage_count INTEGER DEFAULT 0,
  unique_clickers INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
  safety_flags JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Referral events table
CREATE TABLE referral_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id UUID NOT NULL REFERENCES referral_codes(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('click', 'share', 'conversion', 'flagged')),
  user_ip_hash VARCHAR(255),
  referrer VARCHAR(500),
  order_id VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  fraud_score DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  base_cost DECIMAL(10,2) NOT NULL,
  markup_percent DECIMAL(5,2) DEFAULT 20,
  final_price DECIMAL(10,2) GENERATED ALWAYS AS (base_cost * (1 + markup_percent/100)) STORED,
  category VARCHAR(100),
  print_methods TEXT[] DEFAULT '{}',
  available_colors JSONB DEFAULT '[]',
  customization_options JSONB DEFAULT '{}',
  shopify_product_id VARCHAR(255),
  printful_product_id VARCHAR(255),
  inventory_count INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id UUID REFERENCES sponsors(id),
  shopify_order_id VARCHAR(255) UNIQUE,
  printful_order_id VARCHAR(255),
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  items JSONB NOT NULL DEFAULT '[]',
  subtotal DECIMAL(10,2),
  discount_applied DECIMAL(5,2) DEFAULT 0,
  total DECIMAL(10,2),
  customization_data JSONB DEFAULT '{}',
  fulfillment_status VARCHAR(50) DEFAULT 'pending' CHECK (fulfillment_status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  tracking_number VARCHAR(255),
  referral_code_used VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Code validation / fraud prevention logs
CREATE TABLE code_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id UUID REFERENCES referral_codes(id),
  attempt_ip_hash VARCHAR(255),
  attempt_timestamp TIMESTAMP DEFAULT NOW(),
  validation_result VARCHAR(50) CHECK (validation_result IN ('pass', 'fail', 'flagged')),
  reason TEXT,
  action_taken TEXT
);

-- Indexes
CREATE INDEX idx_sponsors_referral_code ON sponsors(referral_code);
CREATE INDEX idx_referral_codes_sponsor ON referral_codes(sponsor_id);
CREATE INDEX idx_referral_events_code ON referral_events(code_id);
CREATE INDEX idx_referral_events_type ON referral_events(event_type);
CREATE INDEX idx_orders_sponsor ON orders(sponsor_id);
CREATE INDEX idx_orders_shopify ON orders(shopify_order_id);
CREATE INDEX idx_code_validations_code ON code_validations(code_id);
