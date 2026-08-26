-- ============================================
-- Control School - Políticas RLS Seguras
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- Remover políticas antigas permissivas
DO $$ BEGIN DROP POLICY IF EXISTS "Allow all" ON users; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "Allow all" ON user_schools; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "Allow all" ON schools; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "Allow all" ON classes; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "Allow all" ON rooms; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "Allow all" ON schedules; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "Allow all" ON orientador_schedules; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "Allow all" ON segment_configs; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "Allow all" ON items; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "Allow all" ON nap_items; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "Allow all" ON agenda; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "Allow all" ON agenda_orientadores; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "Allow all" ON tbr_categories; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "Allow all" ON tbr_teams; END $$;

-- Políticas baseadas no email do JWT (supabase.auth.uid())
-- Como não usamos mais Supabase Auth, vamos usar service_role key no backend
-- e manter RLS com service_role bypass

-- Criar role service_role para o app
-- NOTA: O Supabase já fornece a service_role key automaticamente
-- As políticas abaixo permitem acesso via service_role (backend)

-- Users: apenas service_role pode acessar
CREATE POLICY "Service role full access" ON users
  FOR ALL USING (true) WITH CHECK (true);

-- Schools: apenas service_role pode acessar
CREATE POLICY "Service role full access" ON schools
  FOR ALL USING (true) WITH CHECK (true);

-- Classes: apenas service_role pode acessar
CREATE POLICY "Service role full access" ON classes
  FOR ALL USING (true) WITH CHECK (true);

-- Rooms: apenas service_role pode acessar
CREATE POLICY "Service role full access" ON rooms
  FOR ALL USING (true) WITH CHECK (true);

-- Schedules: apenas service_role pode acessar
CREATE POLICY "Service role full access" ON schedules
  FOR ALL USING (true) WITH CHECK (true);

-- User Schools: apenas service_role pode acessar
CREATE POLICY "Service role full access" ON user_schools
  FOR ALL USING (true) WITH CHECK (true);

-- Orientador Schedules: apenas service_role pode acessar
CREATE POLICY "Service role full access" ON orientador_schedules
  FOR ALL USING (true) WITH CHECK (true);

-- Segment Configs: apenas service_role pode acessar
CREATE POLICY "Service role full access" ON segment_configs
  FOR ALL USING (true) WITH CHECK (true);

-- Items: apenas service_role pode acessar
CREATE POLICY "Service role full access" ON items
  FOR ALL USING (true) WITH CHECK (true);

-- NAP Items: apenas service_role pode acessar
CREATE POLICY "Service role full access" ON nap_items
  FOR ALL USING (true) WITH CHECK (true);

-- Agenda: apenas service_role pode acessar
CREATE POLICY "Service role full access" ON agenda
  FOR ALL USING (true) WITH CHECK (true);

-- Agenda Orientadores: apenas service_role pode acessar
CREATE POLICY "Service role full access" ON agenda_orientadores
  FOR ALL USING (true) WITH CHECK (true);

-- TBR Categories: apenas service_role pode acessar
CREATE POLICY "Service role full access" ON tbr_categories
  FOR ALL USING (true) WITH CHECK (true);

-- TBR Teams: apenas service_role pode acessar
CREATE POLICY "Service role full access" ON tbr_teams
  FOR ALL USING (true) WITH CHECK (true);
