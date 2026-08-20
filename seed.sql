-- ============================================
-- RESET COMPLETO - Control School
-- Execute NO SUPABASE SQL EDITOR
-- ============================================

-- 1. Limpar todos os dados
TRUNCATE agenda_orientadores, orientador_schedules, nap_items,
  segment_configs, schedules, rooms, classes, tbr_teams, tbr_categories,
  user_schools, items, agenda, users, schools
CASCADE;

-- 2. Atualizar CHECK constraint da tabela users (adicionar 'escola')
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'orientador', 'professor', 'escola'));

-- 3. Seed do admin
INSERT INTO users (id, name, email, password, role, created_at)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Lucas Castro',
  'lucascastro121295@gmail.com',
  'mudar123',
  'admin',
  now()
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  password = EXCLUDED.password;

-- 4. Limpar Auth users (descomente se quiser resetar o Auth também)
-- DELETE FROM auth.users;

-- 5. Verificar
SELECT id, name, email, role FROM users;
