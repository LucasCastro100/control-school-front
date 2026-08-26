-- ============================================
-- Limpar todos os dados do banco
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- Limpar dados na ordem correta (respeitando foreign keys)
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
