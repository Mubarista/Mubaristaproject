-- MUBARISTA Team Management & RBAC Schema

-- Pre-defined roles
CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permissions per role / module (CRUD)
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  module TEXT NOT NULL,
  can_create BOOLEAN DEFAULT false,
  can_read BOOLEAN DEFAULT false,
  can_update BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role_id, module)
);

-- Team members (sub-admins / staff)
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  role_id TEXT NOT NULL REFERENCES roles(id),
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Access / audit logs for team members
CREATE TABLE IF NOT EXISTS access_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content review queue for sub-admin submissions
CREATE TABLE IF NOT EXISTS content_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_type TEXT NOT NULL,
  content_id UUID NOT NULL,
  submitted_by UUID REFERENCES team_members(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending',
  review_notes TEXT,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content lifecycle status on learning_content
ALTER TABLE learning_content ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'live';
ALTER TABLE learning_content ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES team_members(id) ON DELETE SET NULL;
ALTER TABLE learning_content ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE learning_content ADD COLUMN IF NOT EXISTS review_notes TEXT;

-- Seed system roles
INSERT INTO roles (id, name, description, is_system) VALUES
  ('super_admin', 'Super Admin', 'Full system access', true),
  ('manager', 'Manager', 'Can oversee team and content', true),
  ('content_creator', 'Content Creator', 'Can create and edit content', true),
  ('customer_support', 'Customer Support', 'Can view and respond to support items', true),
  ('application_reviewer', 'Application Reviewer', 'Can review applications', true)
ON CONFLICT (id) DO NOTHING;

-- Seed permissions for system roles
-- Super Admin: all modules, full CRUD
INSERT INTO permissions (role_id, module, can_create, can_read, can_update, can_delete)
  SELECT 'super_admin', m, true, true, true, true
  FROM unnest(ARRAY[
    'dashboard','users','team','roles','learning','articles','books','competitions',
    'applications','judges','sponsors','testimonials','timeline','tips','tools',
    'legends','coffee_facts','messages','payments','settings','site_settings',
    'about','hero','how_it_works','faq','contact','categories','latte_art','winners'
  ]) AS m
ON CONFLICT (role_id, module) DO NOTHING;

-- Manager: read + update most things, create/delete limited
INSERT INTO permissions (role_id, module, can_create, can_read, can_update, can_delete)
  SELECT 'manager', m, true, true, true, false
  FROM unnest(ARRAY[
    'dashboard','users','team','learning','articles','books','competitions',
    'applications','judges','sponsors','testimonials','timeline','tips','tools',
    'legends','coffee_facts','messages','payments','settings','site_settings',
    'about','hero','how_it_works','faq','contact','categories','latte_art','winners'
  ]) AS m
ON CONFLICT (role_id, module) DO NOTHING;

-- Content Creator: read + create + update on content modules, no delete
INSERT INTO permissions (role_id, module, can_create, can_read, can_update, can_delete)
  SELECT 'content_creator', m, true, true, true, false
  FROM unnest(ARRAY[
    'learning','articles','books','testimonials','timeline','tips','tools',
    'legends','coffee_facts','about','hero','how_it_works','faq','contact','latte_art'
  ]) AS m
ON CONFLICT (role_id, module) DO NOTHING;

-- Customer Support: read + update messages/support
INSERT INTO permissions (role_id, module, can_create, can_read, can_update, can_delete)
  SELECT 'customer_support', m, false, true, true, false
  FROM unnest(ARRAY['messages','users']) AS m
ON CONFLICT (role_id, module) DO NOTHING;

-- Application Reviewer: read + update applications
INSERT INTO permissions (role_id, module, can_create, can_read, can_update, can_delete)
  SELECT 'application_reviewer', m, false, true, true, false
  FROM unnest(ARRAY['applications','competitions','users']) AS m
ON CONFLICT (role_id, module) DO NOTHING;
