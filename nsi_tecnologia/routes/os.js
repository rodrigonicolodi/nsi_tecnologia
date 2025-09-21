const express = require('express');
const router = express.Router();
const osController = require('../controllers/osController');

// Cadastro de nova OS
router.get('/nova', osController.novaOS);
router.post('/nova', osController.salvarOS);

// Listagem de OS
router.get('/listar', osController.listarOS);

// Edição de OS
router.get('/editar/:id', osController.editarOS);
router.post('/atualizar/:id', osController.atualizarOS); // ← ajustado aqui

// Finalização de OS
router.post('/finalizar/:id', osController.finalizarOS);

// Imprimeir Os
router.get('/exibir/:id', osController.exibirOS);
router.get('/imprimir/:id', osController.imprimirOS);

// Exibir
router.get('/exibir/:id', osController.exibirOS);

module.exports = router;