-- ============================================
-- Control School - Migração Supabase
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- Tabela: schools (criada primeiro para foreign keys)
CREATE TABLE IF NOT EXISTS schools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT DEFAULT '',
  region TEXT DEFAULT '',
  state TEXT DEFAULT '',
  city TEXT DEFAULT '',
  color TEXT,
  email TEXT,
  password TEXT,
  schedule_type TEXT CHECK (schedule_type IN ('semanal', 'quinzenal')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela: users (unifica admin, orientador e professor)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT DEFAULT '' UNIQUE,
  password TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'orientador', 'professor')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela: user_schools (pivot users <-> schools)
CREATE TABLE IF NOT EXISTS user_schools (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, school_id)
);

-- Tabela: classes
CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  nap TEXT NOT NULL,
  name TEXT NOT NULL,
  year TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela: rooms
CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  student_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela: schedules
CREATE TABLE IF NOT EXISTS schedules (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  room_id TEXT REFERENCES rooms(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  subject TEXT NOT NULL,
  teacher TEXT NOT NULL,
  fortnight INTEGER CHECK (fortnight IN (0, 1, 2))
);

-- Tabela: orientador_schedules (orientador_id agora referencia users)
CREATE TABLE IF NOT EXISTS orientador_schedules (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  orientador_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  activity TEXT NOT NULL,
  year TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela: segment_configs
CREATE TABLE IF NOT EXISTS segment_configs (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  segment_name TEXT NOT NULL,
  tapetes INTEGER DEFAULT 0,
  kits INTEGER DEFAULT 0,
  year TEXT NOT NULL
);

-- Tabela: items
CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('tapete', 'tecnologia')),
  naps JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela: nap_items
CREATE TABLE IF NOT EXISTS nap_items (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  segment_name TEXT NOT NULL,
  item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 0,
  year TEXT NOT NULL
);

-- Tabela: agenda (orientador_id agora referencia users)
CREATE TABLE IF NOT EXISTS agenda (
  id TEXT PRIMARY KEY,
  orientador_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  activity TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela: tbr_categories
CREATE TABLE IF NOT EXISTS tbr_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela: tbr_teams
CREATE TABLE IF NOT EXISTS tbr_teams (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES tbr_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE orientador_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE segment_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE nap_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE agenda ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbr_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbr_teams ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas
CREATE POLICY "Allow all" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON user_schools FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON schools FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON classes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON rooms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON schedules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON orientador_schedules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON segment_configs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON nap_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON agenda FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON tbr_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON tbr_teams FOR ALL USING (true) WITH CHECK (true);
