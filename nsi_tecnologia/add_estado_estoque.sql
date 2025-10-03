-- Adicionar campo 'estado' na tabela estoque
-- Execute este script no seu banco MySQL

ALTER TABLE estoque 
ADD COLUMN estado ENUM('novo', 'usado') DEFAULT 'novo' COMMENT 'Estado do produto: novo ou usado';

-- Adicionar comentário para documentação
ALTER TABLE estoque 
MODIFY COLUMN estado ENUM('novo', 'usado') DEFAULT 'novo' COMMENT 'Estado do produto: novo ou usado';
