const express = require('express');
const router = express.Router();
const movimentacaoController = require('../controllers/movimentacaoController');

// 📋 Listar movimentações
router.get('/', movimentacaoController.listar); // /movimentacoes

// 📝 Nova movimentação
router.get('/nova', movimentacaoController.formulario); // /movimentacoes/nova
router.post('/', movimentacaoController.salvar);        // POST /movimentacoes

// 👁️ Exibir movimentação
router.get('/exibir/:id', movimentacaoController.exibir); // /movimentacoes/exibir/:id

// ✏️ Editar movimentação
router.get('/editar/:id', movimentacaoController.editar);   // /movimentacoes/editar/:id
router.post('/editar/:id', movimentacaoController.atualizar); // POST /movimentacoes/editar/:id

// 🗑️ Excluir movimentação
router.post('/excluir/:id', movimentacaoController.excluir); // POST /movimentacoes/excluir/:id

module.exports = router;