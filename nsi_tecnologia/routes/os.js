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
router.get('/finalizar/:id', osController.finalizarOS);
router.post('/finalizar/:id', osController.processarFinalizacao);

// Exibir e Imprimir OS
router.get('/exibir/:id', osController.exibirOS);
router.get('/imprimir/:id', osController.imprimirOS);
router.get('/cupom/:id', osController.cupomOS);

// Agenda
router.get('/agenda', osController.agendaOS);
router.get('/agenda/exportar/:id?', osController.exportarAgenda);

module.exports = router;