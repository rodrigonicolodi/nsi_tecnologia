-- Estrutura do banco do NSI Tecnologia (somente tabelas, SEM dados).
-- Gerado a partir da produção em 2026-10-24.
-- Para criar um banco vazio: phpMyAdmin → selecionar o banco → Importar → este arquivo.

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";

START TRANSACTION;

SET time_zone = "+00:00";

CREATE TABLE `ajustes_caixa` (
  `id` int NOT NULL,
  `caixa_id` int DEFAULT NULL,
  `valor` decimal(10,2) DEFAULT NULL,
  `motivo` text CHARACTER SET latin1 COLLATE latin1_general_ci,
  `data` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_general_ci;

CREATE TABLE `auditoria` (
  `id` int NOT NULL,
  `admin_id` int NOT NULL,
  `acao` varchar(50) CHARACTER SET latin1 COLLATE latin1_general_ci NOT NULL,
  `alvo_id` int DEFAULT NULL,
  `descricao` text CHARACTER SET latin1 COLLATE latin1_general_ci,
  `data` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_general_ci;

CREATE TABLE `caixas` (
  `id` int NOT NULL,
  `nome` varchar(100) CHARACTER SET latin1 COLLATE latin1_general_ci NOT NULL,
  `tipo` enum('banco','carteira','digital') CHARACTER SET latin1 COLLATE latin1_general_ci DEFAULT 'banco',
  `descricao` text CHARACTER SET latin1 COLLATE latin1_general_ci,
  `ativo` tinyint(1) DEFAULT '1',
  `valor_inicial` decimal(10,2) DEFAULT '0.00'
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_general_ci;

CREATE TABLE `estoque_movimentacoes` (
  `id` int NOT NULL,
  `produto_id` int NOT NULL,
  `tipo` enum('entrada','saida','ajuste') CHARACTER SET latin1 COLLATE latin1_general_ci DEFAULT NULL,
  `quantidade` int NOT NULL,
  `data` datetime DEFAULT CURRENT_TIMESTAMP,
  `pessoa_id` int DEFAULT NULL,
  `usuario` varchar(100) CHARACTER SET latin1 COLLATE latin1_general_ci DEFAULT NULL,
  `observacao` text CHARACTER SET latin1 COLLATE latin1_general_ci
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_general_ci;

CREATE TABLE `financeiro` (
  `id` int NOT NULL,
  `tipo` enum('pagar','receber') CHARACTER SET latin1 COLLATE latin1_general_ci NOT NULL,
  `pessoa_id` int DEFAULT NULL,
  `caixa_id` int DEFAULT NULL,
  `valor` decimal(10,2) NOT NULL,
  `vencimento` date NOT NULL,
  `status` enum('pendente','pago','cancelado') CHARACTER SET latin1 COLLATE latin1_general_ci DEFAULT 'pendente',
  `descricao` text CHARACTER SET latin1 COLLATE latin1_general_ci,
  `ordem_servico_id` int DEFAULT NULL,
  `criado_em` datetime DEFAULT CURRENT_TIMESTAMP,
  `caixa_quitacao_id` int DEFAULT NULL,
  `parcela_atual` int DEFAULT '1',
  `total_parcelas` int DEFAULT '1',
  `parcela_pai_id` int DEFAULT NULL,
  `data_criacao` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `data_quitacao` timestamp NULL DEFAULT NULL COMMENT 'Data e hora da quitação do lançamento'
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_general_ci;

CREATE TABLE `itens_os` (
  `id` int NOT NULL,
  `os_id` int NOT NULL,
  `produto_id` int NOT NULL,
  `quantidade` int NOT NULL DEFAULT '1',
  `valor_unitario` decimal(10,2) DEFAULT '0.00',
  `observacao` text CHARACTER SET latin1 COLLATE latin1_general_ci
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_general_ci;

CREATE TABLE `movimentacoes` (
  `id` int NOT NULL,
  `produto_id` int NOT NULL,
  `pessoa_id` int DEFAULT NULL,
  `tipo` enum('entrada','saida') CHARACTER SET latin1 COLLATE latin1_general_ci NOT NULL,
  `quantidade` int NOT NULL,
  `observacao` text CHARACTER SET latin1 COLLATE latin1_general_ci,
  `data` datetime DEFAULT CURRENT_TIMESTAMP,
  `usuario_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_general_ci;

CREATE TABLE `ordens_servico` (
  `id` int NOT NULL,
  `numero_os` varchar(20) CHARACTER SET latin1 COLLATE latin1_general_ci NOT NULL,
  `solicitante_id` int NOT NULL,
  `responsavel_id` int NOT NULL,
  `tipo_servico` varchar(50) CHARACTER SET latin1 COLLATE latin1_general_ci NOT NULL,
  `prioridade` enum('baixa','media','alta','critica') CHARACTER SET latin1 COLLATE latin1_general_ci DEFAULT 'media',
  `status` enum('aberta','orcamento','chamado_tecnico','concluida','cancelada') CHARACTER SET latin1 COLLATE latin1_general_ci DEFAULT 'aberta',
  `problema_informado` text CHARACTER SET latin1 COLLATE latin1_general_ci,
  `problema_constatado` text CHARACTER SET latin1 COLLATE latin1_general_ci,
  `servico_executado` text CHARACTER SET latin1 COLLATE latin1_general_ci,
  `valor_servico` decimal(10,2) DEFAULT '0.00',
  `valor_materiais` decimal(10,2) DEFAULT '0.00',
  `desconto` decimal(10,2) DEFAULT '0.00',
  `acrescimos` decimal(10,2) DEFAULT '0.00',
  `valor_total` decimal(10,2) DEFAULT '0.00',
  `tempo_execucao` int DEFAULT NULL,
  `data_abertura` datetime DEFAULT CURRENT_TIMESTAMP,
  `data_fechamento` datetime DEFAULT NULL,
  `observacoes` text CHARACTER SET latin1 COLLATE latin1_general_ci,
  `criado_por` int DEFAULT NULL,
  `data_agendamento` datetime DEFAULT NULL COMMENT 'Data e hora do agendamento da OS',
  `observacoes_agendamento` text COLLATE latin1_general_ci COMMENT 'Observações sobre o agendamento'
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_general_ci;

CREATE TABLE `pessoas` (
  `id` int NOT NULL,
  `tipo` enum('cliente','tecnico','fornecedor','interno') CHARACTER SET latin1 COLLATE latin1_general_ci DEFAULT 'cliente',
  `nome` varchar(150) CHARACTER SET latin1 COLLATE latin1_general_ci NOT NULL,
  `razao_social` varchar(150) CHARACTER SET latin1 COLLATE latin1_general_ci DEFAULT NULL,
  `nome_fantasia` varchar(150) CHARACTER SET latin1 COLLATE latin1_general_ci DEFAULT NULL,
  `documento` varchar(20) CHARACTER SET latin1 COLLATE latin1_general_ci DEFAULT NULL,
  `rg_ie` varchar(20) CHARACTER SET latin1 COLLATE latin1_general_ci DEFAULT NULL,
  `data_nascimento` date DEFAULT NULL,
  `sexo` enum('masculino','feminino','outro') CHARACTER SET latin1 COLLATE latin1_general_ci DEFAULT NULL,
  `estado_civil` varchar(50) CHARACTER SET latin1 COLLATE latin1_general_ci DEFAULT NULL,
  `profissao` varchar(100) CHARACTER SET latin1 COLLATE latin1_general_ci DEFAULT NULL,
  `email` varchar(150) CHARACTER SET latin1 COLLATE latin1_general_ci DEFAULT NULL,
  `telefone` varchar(20) CHARACTER SET latin1 COLLATE latin1_general_ci DEFAULT NULL,
  `celular` varchar(20) CHARACTER SET latin1 COLLATE latin1_general_ci DEFAULT NULL,
  `whatsapp` varchar(20) CHARACTER SET latin1 COLLATE latin1_general_ci DEFAULT NULL,
  `cep` varchar(10) CHARACTER SET latin1 COLLATE latin1_general_ci DEFAULT NULL,
  `endereco` varchar(150) CHARACTER SET latin1 COLLATE latin1_general_ci DEFAULT NULL,
  `numero` varchar(10) CHARACTER SET latin1 COLLATE latin1_general_ci DEFAULT NULL,
  `complemento` varchar(100) CHARACTER SET latin1 COLLATE latin1_general_ci DEFAULT NULL,
  `bairro` varchar(100) CHARACTER SET latin1 COLLATE latin1_general_ci DEFAULT NULL,
  `cidade` varchar(100) CHARACTER SET latin1 COLLATE latin1_general_ci DEFAULT NULL,
  `uf` char(2) CHARACTER SET latin1 COLLATE latin1_general_ci DEFAULT NULL,
  `pais` varchar(50) CHARACTER SET latin1 COLLATE latin1_general_ci DEFAULT 'Brasil',
  `contato_responsavel` varchar(100) CHARACTER SET latin1 COLLATE latin1_general_ci DEFAULT NULL,
  `observacoes` text CHARACTER SET latin1 COLLATE latin1_general_ci,
  `data_cadastro` datetime DEFAULT CURRENT_TIMESTAMP,
  `status` enum('ativo','inativo') CHARACTER SET latin1 COLLATE latin1_general_ci DEFAULT 'ativo',
  `codigo_pais` varchar(5) COLLATE latin1_general_ci DEFAULT '+55' COMMENT 'Código do país para WhatsApp (ex: +55, +1, +34)'
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_general_ci;

CREATE TABLE `produtos` (
  `id` int NOT NULL,
  `nome` varchar(100) CHARACTER SET latin1 COLLATE latin1_general_ci NOT NULL,
  `codigo` varchar(50) CHARACTER SET latin1 COLLATE latin1_general_ci DEFAULT NULL,
  `categoria` varchar(50) CHARACTER SET latin1 COLLATE latin1_general_ci DEFAULT NULL,
  `marca` varchar(50) CHARACTER SET latin1 COLLATE latin1_general_ci DEFAULT NULL,
  `modelo` varchar(50) CHARACTER SET latin1 COLLATE latin1_general_ci DEFAULT NULL,
  `unidade` varchar(20) CHARACTER SET latin1 COLLATE latin1_general_ci DEFAULT NULL,
  `custo` decimal(10,2) DEFAULT '0.00',
  `preco_venda` decimal(10,2) DEFAULT '0.00',
  `estoque_atual` int DEFAULT '0',
  `status` enum('ativo','inativo') CHARACTER SET latin1 COLLATE latin1_general_ci DEFAULT 'ativo',
  `descricao_tecnica` text CHARACTER SET latin1 COLLATE latin1_general_ci,
  `criado_em` datetime DEFAULT CURRENT_TIMESTAMP,
  `estado` enum('novo','usado') COLLATE latin1_general_ci DEFAULT 'novo' COMMENT 'Estado do produto: novo ou usado'
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_general_ci;

CREATE TABLE `transferencias_caixas` (
  `id` int NOT NULL,
  `caixa_origem_id` int NOT NULL,
  `caixa_destino_id` int NOT NULL,
  `valor` decimal(10,2) NOT NULL,
  `descricao` text,
  `usuario_id` int NOT NULL,
  `data_transferencia` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `usuarios` (
  `id` int NOT NULL,
  `nome` varchar(100) CHARACTER SET latin1 COLLATE latin1_general_ci DEFAULT NULL,
  `email` varchar(100) CHARACTER SET latin1 COLLATE latin1_general_ci DEFAULT NULL,
  `senha` varchar(255) CHARACTER SET latin1 COLLATE latin1_general_ci DEFAULT NULL,
  `nivel` varchar(20) COLLATE latin1_general_ci DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT '1',
  `criado_em` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_general_ci;

ALTER TABLE `ajustes_caixa`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `auditoria`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `caixas`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `estoque_movimentacoes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `produto_id` (`produto_id`),
  ADD KEY `pessoa_id` (`pessoa_id`);

ALTER TABLE `financeiro`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_parcela_pai` (`parcela_pai_id`),
  ADD KEY `idx_parcela_info` (`parcela_atual`,`total_parcelas`);

ALTER TABLE `itens_os`
  ADD PRIMARY KEY (`id`),
  ADD KEY `os_id` (`os_id`),
  ADD KEY `produto_id` (`produto_id`);

ALTER TABLE `movimentacoes`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `ordens_servico`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `numero_os` (`numero_os`),
  ADD KEY `solicitante_id` (`solicitante_id`),
  ADD KEY `responsavel_id` (`responsavel_id`),
  ADD KEY `criado_por` (`criado_por`);

ALTER TABLE `pessoas`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `produtos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `codigo` (`codigo`);

ALTER TABLE `transferencias_caixas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_caixa_origem` (`caixa_origem_id`),
  ADD KEY `idx_caixa_destino` (`caixa_destino_id`),
  ADD KEY `idx_data_transferencia` (`data_transferencia`),
  ADD KEY `idx_usuario` (`usuario_id`);

ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

ALTER TABLE `ajustes_caixa`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `auditoria`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `caixas`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `estoque_movimentacoes`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `financeiro`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `itens_os`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `movimentacoes`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `ordens_servico`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `pessoas`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `produtos`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `transferencias_caixas`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `usuarios`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `estoque_movimentacoes`
  ADD CONSTRAINT `estoque_movimentacoes_ibfk_1` FOREIGN KEY (`produto_id`) REFERENCES `produtos` (`id`),
  ADD CONSTRAINT `estoque_movimentacoes_ibfk_2` FOREIGN KEY (`pessoa_id`) REFERENCES `pessoas` (`id`);

ALTER TABLE `itens_os`
  ADD CONSTRAINT `itens_os_ibfk_1` FOREIGN KEY (`os_id`) REFERENCES `ordens_servico` (`id`),
  ADD CONSTRAINT `itens_os_ibfk_2` FOREIGN KEY (`produto_id`) REFERENCES `produtos` (`id`);

ALTER TABLE `ordens_servico`
  ADD CONSTRAINT `ordens_servico_ibfk_1` FOREIGN KEY (`solicitante_id`) REFERENCES `pessoas` (`id`),
  ADD CONSTRAINT `ordens_servico_ibfk_2` FOREIGN KEY (`responsavel_id`) REFERENCES `pessoas` (`id`),
  ADD CONSTRAINT `ordens_servico_ibfk_3` FOREIGN KEY (`criado_por`) REFERENCES `usuarios` (`id`);

COMMIT;
