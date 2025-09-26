// routes/relatorios.js

const express = require('express');
const router = express.Router();
const relatorioController = require('../controllers/relatorioController'); 

// Rota principal
router.get('/listar', relatorioController.listarRelatorios);



module.exports = router;