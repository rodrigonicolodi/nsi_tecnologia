-- Adicionar campos de agendamento na tabela ordens_servico
-- Execute este script no seu banco MySQL

ALTER TABLE ordens_servico 
ADD COLUMN data_agendamento DATETIME NULL,
ADD COLUMN observacoes_agendamento TEXT NULL;

-- Adicionar comentários para documentação
ALTER TABLE ordens_servico 
MODIFY COLUMN data_agendamento DATETIME NULL COMMENT 'Data e hora do agendamento da OS',
MODIFY COLUMN observacoes_agendamento TEXT NULL COMMENT 'Observações sobre o agendamento';
