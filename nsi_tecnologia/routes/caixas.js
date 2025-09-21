const express = require('express');
const router = express.Router();
const db = require('../db');

// Rota principal: Gerenciar Caixas (listar.ejs)
router.get('/', async (req, res) => {
  try {
    const [caixas] = await db.query('SELECT * FROM caixas ORDER BY nome');
    res.render('caixas/listar', {
      caixas,
      erro: null,
      usuario: req.session.usuario || {} // ✅ garante que usuario exista
    });
  } catch (erro) {
    console.error('Erro ao carregar caixas:', erro);
    res.render('caixas/listar', {
      caixas: [],
      erro: 'Erro ao carregar os caixas.',
      usuario: req.session.usuario || {}
    });
  }
});

// Rota de consulta de saldos e movimentações (consulta.ejs)
router.get('/consulta', async (req, res) => {
  try {
    const [caixas] = await db.query(`
      SELECT 
        c.id,
        c.nome,
        c.ativo,
        c.valor_inicial,
        COALESCE(SUM(CASE WHEN f.tipo = 'receber' THEN f.valor ELSE 0 END), 0) AS recebido,
        COALESCE(SUM(CASE WHEN f.tipo = 'pagar' THEN f.valor ELSE 0 END), 0) AS pago,
        c.valor_inicial 
          + COALESCE(SUM(CASE WHEN f.tipo = 'receber' THEN f.valor ELSE 0 END), 0)
          - COALESCE(SUM(CASE WHEN f.tipo = 'pagar' THEN f.valor ELSE 0 END), 0) AS saldo_atual
      FROM caixas c
      LEFT JOIN financeiro f ON f.caixa_quitacao_id = c.id AND f.status = 'pago'
      GROUP BY c.id
      ORDER BY c.nome;
    `);

    res.render('caixas/consulta', {
      caixas,
      erro: null,
      usuario: req.session.usuario || {}
    });
  } catch (erro) {
    console.error('Erro ao consultar caixas:', erro);
    res.render('caixas/consulta', {
      caixas: [],
      erro: 'Erro ao carregar os dados dos caixas.',
      usuario: req.session.usuario || {}
    });
  }
});

// Rota para criar novo caixa (nova.ejs)
router.get('/novo', (req, res) => {
  res.render('caixas/nova', {
    erro: null,
    usuario: req.session.usuario || {}
  });
});

// Rota para editar caixa (editar.ejs)
router.get('/editar/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [resultado] = await db.query('SELECT * FROM caixas WHERE id = ?', [id]);
    if (resultado.length === 0) {
      return res.redirect('/caixas');
    }
    res.render('caixas/editar', {
      caixa: resultado[0],
      erro: null,
      usuario: req.session.usuario || {}
    });
  } catch (erro) {
    console.error('Erro ao carregar caixa para edição:', erro);
    res.redirect('/caixas');
  }
});

// Rota para ajustar saldo (ajustar.ejs)
router.get('/ajustar/:id', (req, res) => {
  const { id } = req.params;
  res.render('caixas/ajustar', {
    caixa_id: id,
    usuario: req.session.usuario || {}
  });
});

// Rota para excluir caixa
router.post('/excluir/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM caixas WHERE id = ?', [id]);
    res.redirect('/caixas');
  } catch (erro) {
    console.error('Erro ao excluir caixa:', erro);
    res.redirect('/caixas');
  }
});

module.exports = router;