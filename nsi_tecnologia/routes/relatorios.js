// routes/relatorios.js

const express = require('express');
const router = express.Router();
const relatorioController = require('../controllers/relatorioController'); 

// Rota principal
router.get('/listar', relatorioController.listarRelatorios);

// Novos relatórios
router.get('/servicos-produtos-mes', relatorioController.servicosProdutosMes);
router.get('/os-status-periodo', relatorioController.osStatusPeriodo);
router.get('/faturamento-cliente', relatorioController.faturamentoCliente);
router.get('/performance-tecnicos', relatorioController.performanceTecnicos);

module.exports = router;