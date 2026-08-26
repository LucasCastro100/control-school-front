-- ============================================
-- Control School - Setup Completo Seguro
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- 1. Limpar todos os dados
DELETE FROM tbr_teams;
DELETE FROM tbr_categories;
DELETE FROM agenda_orientadores;
DELETE FROM agenda;
DELETE FROM orientador_schedules;
DELETE FROM schedules;
DELETE FROM nap_items;
DELETE FROM items;
DELETE FROM segment_configs;
DELETE FROM rooms;
DELETE FROM classes;
DELETE FROM user_schools;
DELETE FROM schools;
DELETE FROM users;

-- 2. Limpar auth users antigos (se existirem)
-- ATENÇÃO: Isso delete TODOS os usuários do auth
DELETE FROM auth.users;

-- 3. Criar usuário admin com senha hasheada
-- Senha: mudar123 (hash bcrypt com 12 rounds)
INSERT INTO users (id, name, email, password, role, created_at)
VALUES (
  'f6ed0cfa-9e2e-4ab4-b880-d6c47ecbe0c3',
  'Administrador',
  'admin@gmail.com',
  '$2b$12$bZtePrQRtemhJ3umLi/Rn.XMloxE4HgRtc9r7jzoumHnb5Cz.PKdK',
  'admin',
  now()
);
