ALTER TABLE coffee_facts ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT '☕';
UPDATE coffee_facts SET icon = COALESCE(icon, '☕');
