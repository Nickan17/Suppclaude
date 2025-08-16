-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users with detailed profiling
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  -- Demographics
  age INT,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  weight_kg NUMERIC,
  height_cm NUMERIC,
  activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'very_active', 'athlete')),
  -- Supplement behavior
  monthly_spend_usd NUMERIC,
  current_supplement_count INT,
  years_taking_supplements INT,
  purchase_channels TEXT[], -- ['amazon', 'gnc', 'online', 'gym', 'clinic']
  -- Goals (multi-select)
  goals TEXT[], -- ['muscle_gain', 'fat_loss', 'energy', 'sleep', 'immunity', 'longevity', 'skin_health', 'cognitive', 'joint_health']
  -- Preferences
  avoid_ingredients TEXT[], -- ['soy', 'gluten', 'dairy', 'artificial_sweeteners', 'proprietary_blends']
  preferred_forms TEXT[], -- ['capsule', 'powder', 'gummy', 'liquid']
  price_sensitivity INT CHECK (price_sensitivity BETWEEN 1 AND 5), -- 1=price insensitive, 5=very sensitive
  -- Onboarding
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_responses JSONB,
  -- Tracking
  last_active TIMESTAMP,
  scan_count INT DEFAULT 0,
  products_saved INT DEFAULT 0
);

-- Products with comprehensive analysis
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode TEXT UNIQUE,
  url TEXT,
  brand TEXT,
  name TEXT NOT NULL,
  category TEXT, -- 'protein', 'pre_workout', 'vitamins', 'nootropics', etc
  -- Extracted data
  ingredients_raw TEXT,
  supplement_facts JSONB,
  serving_size TEXT,
  servings_per_container INT,
  price_usd NUMERIC,
  price_per_serving NUMERIC,
  -- Analysis results
  overall_score INT CHECK (overall_score BETWEEN 0 AND 100),
  purity_score INT CHECK (purity_score BETWEEN 0 AND 100),
  efficacy_score INT CHECK (efficacy_score BETWEEN 0 AND 100),
  safety_score INT CHECK (safety_score BETWEEN 0 AND 100),
  value_score INT CHECK (value_score BETWEEN 0 AND 100),
  -- Detailed scoring
  proprietary_blend_penalty INT,
  third_party_tested BOOLEAN,
  gmp_certified BOOLEAN,
  banned_substances_free BOOLEAN,
  heavy_metals_tested BOOLEAN,
  -- Scientific backing
  pubmed_references JSONB,
  clinical_evidence_grade TEXT CHECK (clinical_evidence_grade IN ('A', 'B', 'C', 'D', 'F')),
  evidence_summary TEXT,
  -- Warnings
  warnings TEXT[],
  allergens TEXT[],
  drug_interactions TEXT[],
  -- Meta
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_analysis TIMESTAMP,
  extraction_method TEXT, -- 'ocr', 'web_scrape', 'manual', 'api'
  extraction_confidence NUMERIC,
  raw_extraction_data JSONB
);

-- User's supplement history
CREATE TABLE user_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  scanned_at TIMESTAMP DEFAULT NOW(),
  is_owned BOOLEAN DEFAULT FALSE,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  notes TEXT,
  repurchase_intent BOOLEAN,
  reported_effects TEXT[],
  UNIQUE(user_id, product_id)
);

-- Better alternatives engine
CREATE TABLE product_alternatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_product_id UUID REFERENCES products(id),
  alternative_product_id UUID REFERENCES products(id),
  reason_for_recommendation TEXT,
  improvement_areas TEXT[], -- ['better_value', 'cleaner_ingredients', 'higher_efficacy', 'third_party_tested']
  score_improvement INT,
  price_difference NUMERIC,
  user_segment TEXT[], -- which user goals this alternative serves
  confidence NUMERIC,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Ingredient database
CREATE TABLE ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  aliases TEXT[],
  category TEXT, -- 'amino_acid', 'vitamin', 'mineral', 'herb', 'filler', 'artificial'
  safety_rating TEXT CHECK (safety_rating IN ('safe', 'likely_safe', 'possibly_safe', 'possibly_unsafe', 'likely_unsafe')),
  effective_dose_mg NUMERIC,
  max_safe_dose_mg NUMERIC,
  pubmed_count INT,
  common_uses TEXT[],
  side_effects TEXT[],
  is_proprietary_component BOOLEAN DEFAULT FALSE,
  is_banned_substance BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Analytics events
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  event_type TEXT NOT NULL, -- 'scan', 'view_alternatives', 'save_product', 'share_score'
  event_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_overall_score ON products(overall_score);
CREATE INDEX idx_user_products_user_id ON user_products(user_id);
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);

-- Row Level Security (RLS) policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Users can only access their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Users can only access their own product history
CREATE POLICY "Users can view own products" ON user_products FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own products" ON user_products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own products" ON user_products FOR UPDATE USING (auth.uid() = user_id);

-- Users can only view their own analytics
CREATE POLICY "Users can view own analytics" ON analytics_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own analytics" ON analytics_events FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Products are public read
CREATE POLICY "Products are viewable by all" ON products FOR SELECT USING (true);

-- Ingredients are public read
CREATE POLICY "Ingredients are viewable by all" ON ingredients FOR SELECT USING (true);

-- Alternatives are public read
CREATE POLICY "Alternatives are viewable by all" ON product_alternatives FOR SELECT USING (true);
