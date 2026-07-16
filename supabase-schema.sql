-- MUBARISTA Supabase Schema
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============ TABLES ============

-- Hero Content
CREATE TABLE IF NOT EXISTS hero_content (
  id TEXT PRIMARY KEY DEFAULT 'hero-1',
  title TEXT NOT NULL,
  subtitle TEXT,
  badge TEXT,
  cta_primary TEXT,
  cta_secondary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hero Background
CREATE TABLE IF NOT EXISTS hero_background (
  id TEXT PRIMARY KEY DEFAULT 'bg-1',
  type TEXT DEFAULT 'image',
  image_url TEXT,
  video_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Platform Stats
CREATE TABLE IF NOT EXISTS platform_stats (
  id TEXT PRIMARY KEY DEFAULT 'stats-1',
  live_competitions INTEGER DEFAULT 0,
  total_participants INTEGER DEFAULT 0,
  countries_joined INTEGER DEFAULT 0,
  total_winners INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- About
CREATE TABLE IF NOT EXISTS about (
  id TEXT PRIMARY KEY DEFAULT 'about-1',
  title TEXT,
  description TEXT,
  mission TEXT,
  vision TEXT,
  values JSONB DEFAULT '[]',
  features JSONB DEFAULT '[]',
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Competitions
CREATE TABLE IF NOT EXISTS competitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  organizer TEXT,
  difficulty TEXT,
  status TEXT DEFAULT 'upcoming',
  prize_pool NUMERIC DEFAULT 0,
  entry_fee NUMERIC DEFAULT 0,
  available_slots INTEGER DEFAULT 0,
  total_slots INTEGER DEFAULT 0,
  registration_deadline TEXT,
  countries_allowed JSONB DEFAULT '[]',
  banner TEXT DEFAULT '',
  rules JSONB DEFAULT '[]',
  judging_criteria JSONB DEFAULT '[]',
  required_skills JSONB DEFAULT '[]',
  event_timeline JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Judges
CREATE TABLE IF NOT EXISTS judges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  title TEXT,
  country TEXT,
  image TEXT DEFAULT '',
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Winners
CREATE TABLE IF NOT EXISTS winners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  competition TEXT,
  year TEXT,
  win_date TEXT,
  win_type TEXT DEFAULT 'week',
  country TEXT,
  prize TEXT,
  currency TEXT DEFAULT 'RWF',
  image TEXT DEFAULT '',
  art_image TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sponsors
CREATE TABLE IF NOT EXISTS sponsors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  logo TEXT DEFAULT '',
  website TEXT,
  tier TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Books
CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  author TEXT,
  description TEXT,
  cover_image TEXT DEFAULT '',
  cover TEXT DEFAULT '',
  price NUMERIC DEFAULT 0,
  isbn TEXT,
  published_date TEXT,
  category TEXT,
  rating NUMERIC DEFAULT 0,
  reviews INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Articles
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,
  author TEXT,
  published_date TEXT,
  cover_image TEXT DEFAULT '',
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coffee Facts
CREATE TABLE IF NOT EXISTS coffee_facts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fact TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FAQs
CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  answer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Testimonials
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  role TEXT,
  content TEXT,
  image TEXT DEFAULT '',
  rating INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Latte Art
CREATE TABLE IF NOT EXISTS latte_art (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  artist TEXT,
  image TEXT DEFAULT '',
  category TEXT,
  difficulty TEXT,
  description TEXT,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contact Info
CREATE TABLE IF NOT EXISTS contact_info (
  id TEXT PRIMARY KEY DEFAULT 'contact-1',
  email TEXT,
  phone TEXT,
  address TEXT,
  location TEXT,
  social_media JSONB DEFAULT '{}',
  business_hours TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Site Settings
CREATE TABLE IF NOT EXISTS site_settings (
  id TEXT PRIMARY KEY DEFAULT 'settings-1',
  learn_badge_text TEXT DEFAULT 'Education',
  learn_title TEXT DEFAULT 'Learning Center',
  learn_description TEXT DEFAULT 'Free educational content for baristas at every level.',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Learn Categories
CREATE TABLE IF NOT EXISTS learn_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '📚',
  free BOOLEAN DEFAULT true,
  active BOOLEAN DEFAULT true,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Learning Content
CREATE TABLE IF NOT EXISTS learning_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES learn_categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  video_url TEXT DEFAULT '',
  duration TEXT,
  difficulty TEXT,
  is_premium BOOLEAN DEFAULT false,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jobs
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  company TEXT,
  location TEXT,
  description TEXT,
  salary TEXT,
  type TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schools
CREATE TABLE IF NOT EXISTS schools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  location TEXT,
  rating NUMERIC DEFAULT 0,
  reviews INTEGER DEFAULT 0,
  certifications TEXT,
  programs TEXT,
  contact TEXT,
  website TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tips
CREATE TABLE IF NOT EXISTS tips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT,
  category TEXT,
  author TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tools
CREATE TABLE IF NOT EXISTS tools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  brand TEXT,
  description TEXT,
  image TEXT DEFAULT '',
  price NUMERIC DEFAULT 0,
  category TEXT,
  rating NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Legends
CREATE TABLE IF NOT EXISTS legends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  country TEXT,
  image TEXT DEFAULT '',
  biography TEXT,
  awards TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Timeline
CREATE TABLE IF NOT EXISTS timeline (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  year TEXT,
  title TEXT NOT NULL,
  description TEXT,
  image TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coffee History
CREATE TABLE IF NOT EXISTS coffee_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  year TEXT,
  image TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages (Contact form submissions)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  subject TEXT,
  category TEXT DEFAULT 'support',
  message TEXT,
  status TEXT DEFAULT 'unread',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'user',
  is_premium BOOLEAN DEFAULT false,
  phone TEXT,
  country TEXT,
  avatar TEXT,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Competition Applications
CREATE TABLE IF NOT EXISTS competition_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competition_id TEXT,
  user_id TEXT,
  user_name TEXT,
  user_email TEXT,
  status TEXT DEFAULT 'pending',
  payment_status TEXT DEFAULT 'unpaid',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Competition Results
CREATE TABLE IF NOT EXISTS competition_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competition_id TEXT,
  participant_name TEXT,
  score NUMERIC,
  rank INTEGER,
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Judge Scores
CREATE TABLE IF NOT EXISTS judge_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  judge_id TEXT NOT NULL,
  application_id TEXT NOT NULL,
  competition_id TEXT,
  participant_name TEXT,
  score NUMERIC,
  feedback TEXT,
  criteria_scores JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (judge_id, application_id)
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT,
  user_name TEXT,
  user_email TEXT,
  type TEXT,
  description TEXT,
  amount NUMERIC,
  currency TEXT DEFAULT 'RWF',
  status TEXT DEFAULT 'pending',
  method TEXT,
  reference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

-- ============ ENABLE RLS ============
ALTER TABLE hero_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_background ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE about ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE judges ENABLE ROW LEVEL SECURITY;
ALTER TABLE winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE coffee_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE latte_art ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE learn_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE legends ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE coffee_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- ============ RLS POLICIES (Public read, authenticated write) ============
-- For all content tables: public can read, authenticated can write
DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'hero_content','hero_background','platform_stats','about','competitions',
    'judges','winners','sponsors','books','articles','coffee_facts','faqs',
    'testimonials','latte_art','contact_info','site_settings','learn_categories',
    'learning_content','jobs','schools','tips','tools','legends','timeline',
    'coffee_history','payments','competition_applications','competition_results'
  ])
  LOOP
    EXECUTE format('CREATE POLICY "Public read" ON %I FOR SELECT USING (true);', t);
    EXECUTE format('CREATE POLICY "Authenticated write" ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true);', t);
  END LOOP;
END $$;

-- Messages: public can insert, authenticated can read all
CREATE POLICY "Public insert messages" ON messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated read messages" ON messages FOR SELECT TO authenticated USING (true);

-- Users: users can read/update their own profile
CREATE POLICY "Users read own profile" ON users FOR SELECT USING (auth.uid()::text = id::text OR true);
CREATE POLICY "Users update own profile" ON users FOR UPDATE USING (auth.uid()::text = id::text);
CREATE POLICY "Authenticated insert users" ON users FOR INSERT TO authenticated WITH CHECK (true);

-- ============ SEED DATA ============

-- Hero Content
INSERT INTO hero_content (id, title, subtitle, badge, cta_primary, cta_secondary)
VALUES ('hero-1', 'Welcome to Mubarista', 'The Ultimate Coffee Competition Platform', 'Live Competitions Now', 'Get Started', 'View Competitions')
ON CONFLICT (id) DO NOTHING;

-- Hero Background
INSERT INTO hero_background (id, type, image_url, video_url)
VALUES ('bg-1', 'image', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=1920&q=80', '')
ON CONFLICT (id) DO NOTHING;

-- Platform Stats
INSERT INTO platform_stats (id, live_competitions, total_participants, countries_joined, total_winners)
VALUES ('stats-1', 12, 2580, 45, 156)
ON CONFLICT (id) DO NOTHING;

-- About
INSERT INTO about (id, title, description, mission, vision, values)
VALUES ('about-1', 'About Mubarista', 'Mubarista is dedicated to celebrating the art of coffee through competitions, education, and community.', 'Our mission is to elevate coffee culture worldwide by providing a platform for baristas to showcase their skills and connect with industry leaders.', 'To become the global standard for coffee competitions and professional development.', '["Excellence in coffee craftsmanship","Community and collaboration","Innovation and creativity","Sustainability and ethical practices"]')
ON CONFLICT (id) DO NOTHING;

-- Contact Info
INSERT INTO contact_info (id, email, phone, address, location, social_media, business_hours)
VALUES ('contact-1', 'contact@mubarista.com', '+1 (555) 123-4567', '123 Coffee Street, New York, NY 10001', '123 Coffee Street, New York, NY 10001', '{"twitter":"https://twitter.com/mubarista","instagram":"https://instagram.com/mubarista","facebook":"https://facebook.com/mubarista","linkedin":"https://linkedin.com/company/mubarista"}', 'Mon-Fri: 9AM-5PM')
ON CONFLICT (id) DO NOTHING;

-- Site Settings
INSERT INTO site_settings (id, learn_badge_text, learn_title, learn_description)
VALUES ('settings-1', 'Education', 'Learning Center', 'Free educational content for baristas at every level. Upgrade for premium courses and certifications.')
ON CONFLICT (id) DO NOTHING;

-- Judges
INSERT INTO judges (name, title, country, image, bio) VALUES
('James Hoffmann', 'World Barista Champion 2007', 'United Kingdom', '', 'Renowned coffee expert and author with over 15 years of experience in the specialty coffee industry.'),
('Sasa Sestic', 'World Barista Champion 2015', 'Australia', '', 'Founder of ONA Coffee and pioneer in coffee processing techniques.')
ON CONFLICT DO NOTHING;

-- Winners
INSERT INTO winners (name, competition, year, country, image) VALUES
('Boram Um', 'World Barista Championship 2025', '2025', 'South Korea', ''),
('Anthony Douglas', 'World Barista Championship 2024', '2024', 'Australia', '')
ON CONFLICT DO NOTHING;

-- Sponsors
INSERT INTO sponsors (name, logo, website, tier) VALUES
('La Marzocco', '', 'https://lamarzocco.com', 'Platinum'),
('Mahlkönig', '', 'https://maehlkoenig.com', 'Gold')
ON CONFLICT DO NOTHING;

-- Books
INSERT INTO books (title, author, description, cover_image, cover, price, isbn, published_date, category, rating, reviews) VALUES
('The World Atlas of Coffee', 'James Hoffmann', 'A comprehensive guide to coffee from bean to cup.', '', '', 35, '978-1784724290', '2024-01-01', 'Technique', 4.8, 124),
('Coffee Dictionary', 'Maxwell Colonna-Dashwood', 'An essential reference for coffee professionals and enthusiasts.', '', '', 25, '978-1784720773', '2023-06-01', 'Origin', 4.6, 89)
ON CONFLICT DO NOTHING;

-- Articles
INSERT INTO articles (title, excerpt, content, author, published_date, cover_image, category) VALUES
('The Future of Coffee Competitions', 'Exploring how technology and sustainability are shaping the next generation of coffee competitions.', 'Coffee competitions are evolving rapidly...', 'Coffee Expert', '2026-01-15', '', 'Industry'),
('Mastering Latte Art: A Beginner''s Guide', 'Learn the fundamentals of creating stunning latte art patterns.', 'Latte art is a skill that takes practice...', 'Barista Pro', '2026-01-10', '', 'Tutorial')
ON CONFLICT DO NOTHING;

-- Coffee Facts
INSERT INTO coffee_facts (fact, category) VALUES
('Coffee is the second most traded commodity in the world after oil.', 'Industry'),
('A coffee tree can live for 100 years and produce up to 10 pounds of coffee cherries per year.', 'Agriculture'),
('The world''s most expensive coffee can cost up to $600 per pound.', 'Trivia')
ON CONFLICT DO NOTHING;

-- FAQs
INSERT INTO faqs (question, answer) VALUES
('How do I register for a competition?', 'To register for a competition, navigate to the competitions page, select the competition you''re interested in, and click the ''Register'' button. You''ll need to complete the registration form and pay the entry fee.'),
('What are the eligibility requirements?', 'Eligibility requirements vary by competition. Generally, you must be at least 18 years old, have professional barista experience, and meet any skill or certification requirements specified in the competition details.'),
('How are winners selected?', 'Winners are selected by a panel of expert judges based on predefined criteria such as taste, technique, presentation, and creativity. The judging process is transparent and follows international standards.')
ON CONFLICT DO NOTHING;

-- Testimonials
INSERT INTO testimonials (name, role, content, image, rating) VALUES
('Sarah Johnson', 'Professional Barista', 'Mubarista has transformed how I approach coffee competitions. The platform is intuitive and the community is incredibly supportive.', '', 5),
('Michael Chen', 'Coffee Shop Owner', 'Finding talented baristas through Mubarista has been game-changing for our business. The quality of competitors is outstanding.', '', 5)
ON CONFLICT DO NOTHING;

-- Latte Art
INSERT INTO latte_art (title, artist, image, category, difficulty, description, likes) VALUES
('Rosetta Masterpiece', 'Emma Wilson', '', 'Free Pour', 'Advanced', 'A stunning rosetta pattern with perfect symmetry and definition.', 245),
('Heart Tulip', 'David Kim', '', 'Free Pour', 'Intermediate', 'A beautiful heart and tulip combination with excellent contrast.', 189)
ON CONFLICT DO NOTHING;

-- Competitions
INSERT INTO competitions (title, slug, description, organizer, difficulty, status, prize_pool, entry_fee, available_slots, total_slots, registration_deadline, countries_allowed, banner, rules, judging_criteria, required_skills, event_timeline) VALUES
('World Barista Championship 2026', 'world-barista-championship-2026', 'The most prestigious barista competition in the world, bringing together champions from over 60 countries.', 'Specialty Coffee Association', 'Master', 'upcoming', 50000, 500, 60, 60, '2026-12-31', '["All Countries"]', '', '["Must be a certified barista","Competition equipment provided","15-minute presentation","Signature beverage required"]', '["Taste","Technique","Presentation","Cleanliness","Creativity"]', '["Espresso","Milk Texturing","Latte Art","Customer Service"]', '[{"date":"2026-03-01","event":"Registration Opens"},{"date":"2026-06-01","event":"Regional Qualifiers"},{"date":"2026-09-01","event":"World Championship"}]'),
('Latte Art World Championship 2026', 'latte-art-world-championship-2026', 'Showcase your artistic skills in the world''s premier latte art competition.', 'World Coffee Events', 'Professional', 'open', 15000, 300, 40, 40, '2026-08-15', '["All Countries"]', '', '["Free pour only","No etching or tools allowed","3 patterns required","4-minute time limit"]', '["Contrast","Symmetry","Complexity","Creativity","Definition"]', '["Milk Texturing","Latte Art","Free Pour"]', '[{"date":"2026-02-01","event":"Registration Opens"},{"date":"2026-05-01","event":"National Finals"},{"date":"2026-08-01","event":"World Championship"}]')
ON CONFLICT DO NOTHING;
