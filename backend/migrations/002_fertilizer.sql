-- =====================
-- FERTILIZER SYSTEM MIGRATION
-- =====================

-- Fertilizer types (e.g. Urea, Potassium, Compost)
CREATE TABLE IF NOT EXISTS fertilizer_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(150) NOT NULL,
  description TEXT,
  unit VARCHAR(20) DEFAULT 'kg',
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collection branches (government pick-up points)
CREATE TABLE IF NOT EXISTS fertilizer_branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  address TEXT NOT NULL,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Monthly programs
CREATE TABLE IF NOT EXISTS fertilizer_programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fertilizer_type_id UUID NOT NULL REFERENCES fertilizer_types(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  distribution_date DATE NOT NULL,
  total_quantity DECIMAL(10, 2) NOT NULL,
  available_quantity DECIMAL(10, 2) NOT NULL,
  quantity_per_farmer DECIMAL(10, 2) NOT NULL DEFAULT 10,
  subsidized_price DECIMAL(10, 2) NOT NULL,
  market_price DECIMAL(10, 2),
  branch_id UUID NOT NULL REFERENCES fertilizer_branches(id),
  status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'open', 'closed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Farmer allocations / claims
CREATE TABLE IF NOT EXISTS fertilizer_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID NOT NULL REFERENCES fertilizer_programs(id) ON DELETE CASCADE,
  farmer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quantity DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'claimed' CHECK (status IN ('claimed', 'collected', 'cancelled')),
  claimed_at TIMESTAMPTZ DEFAULT NOW(),
  collected_at TIMESTAMPTZ,
  notes TEXT,
  UNIQUE(program_id, farmer_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_fertilizer_programs_type ON fertilizer_programs(fertilizer_type_id);
CREATE INDEX IF NOT EXISTS idx_fertilizer_programs_branch ON fertilizer_programs(branch_id);
CREATE INDEX IF NOT EXISTS idx_fertilizer_allocations_program ON fertilizer_allocations(program_id);
CREATE INDEX IF NOT EXISTS idx_fertilizer_allocations_farmer ON fertilizer_allocations(farmer_id);

-- Seed: Sample fertilizer types
INSERT INTO fertilizer_types (name, description, unit) VALUES
  ('Urea', 'Nitrogen-rich fertilizer ideal for leafy crops', 'kg'),
  ('Triple Superphosphate (TSP)', 'High phosphorus fertilizer for root development', 'kg'),
  ('Muriate of Potash (MOP)', 'Potassium fertilizer for fruit and vegetable quality', 'kg'),
  ('Compost', 'Organic compost for soil enrichment', 'kg')
ON CONFLICT DO NOTHING;
