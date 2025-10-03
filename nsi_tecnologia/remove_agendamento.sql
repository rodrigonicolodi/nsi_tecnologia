-- Script para reverter as alterações de agendamento
-- Execute este script se quiser remover os campos de agendamento

-- Remove os campos de agendamento da tabela ordens_servico
ALTER TABLE ordens_servico 
DROP COLUMN IF EXISTS data_agendamento,
DROP COLUMN IF EXISTS observacoes_agendamento;

-- Comentário: Este script remove completamente os campos de agendamento
-- Use apenas se quiser reverter as alterações
