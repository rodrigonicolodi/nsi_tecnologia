const express = require('express');
const router = express.Router();
const db = require('../db');

// Listar caixas
router.get('/', async (req, res) => {
  try {
    const [caixas] = await db.query('SELECT * FROM caixas ORDER BY nome');
    res.render('caixas/listar', { titulo: 'Gerenciar Caixas', caixas, erro: null, sucesso: req.query.sucesso || null });
  } catch (erro) {
    console.error('Erro ao listar caixas:', erro);
    res.render('caixas/listar', { titulo: 'Gerenciar Caixas', caixas: [], erro: 'Erro ao carregar caixas.', sucesso: null });
  }
});

// Formulário de novo caixa
router.get('/novo', (req, res) => {
  res.render('caixas/nova', { titulo: 'Novo Caixa', erro: null });
});

// Salvar novo caixa
router.post('/novo', async (req, res) => {
  const { nome } = req.body;
  try {
    await db.query('INSERT INTO caixas SET ?', { nome, ativo: true });
    res.redirect('/caixas?sucesso=Caixa criado com sucesso!');
  } catch (erro) {
    console.error('Erro ao salvar caixa:', erro);
    res.render('caixas/nova', { titulo: 'Novo Caixa', erro: 'Erro ao salvar caixa.' });
  }
});

// Edição de caixa
router.get('/editar/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [[caixa]] = await db.query('SELECT * FROM caixas WHERE id = ?', [id]);

    if (!caixa) {
      return res.redirect('/caixas?erro=Caixa não encontrado');
    }

    res.render('caixas/editar', { titulo: 'Editar Caixa', caixa, erro: null });
  } catch (erro) {
    console.error('Erro ao buscar caixa:', erro);
    res.redirect('/caixas?erro=Erro ao carregar caixa para edição.');
  }
});

router.post('/editar/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, ativo } = req.body;

  try {
    await db.query('UPDATE caixas SET nome = ?, ativo = ? WHERE id = ?', [nome, ativo === 'true', id]);
    res.redirect('/caixas?sucesso=Caixa atualizado com sucesso!');
  } catch (erro) {
    console.error('Erro ao atualizar caixa:', erro);
    res.render('caixas/editar', { titulo: 'Editar Caixa', caixa: { id, nome, ativo }, erro: 'Erro ao atualizar caixa.' });
  }
});

// Excluir caixa
router.post('/excluir/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [[vinculos]] = await db.query(`
      SELECT COUNT(*) AS total
      FROM financeiro
      WHERE caixa_id = ? OR caixa_quitacao_id = ?
    `, [id, id]);

    if (vinculos.total > 0) {
      return res.redirect('/caixas?erro=Este caixa está vinculado a lançamentos e não pode ser excluído.');
    }

    await db.query('DELETE FROM caixas WHERE id = ?', [id]);
    res.redirect('/caixas?sucesso=Caixa excluído com sucesso!');
  } catch (erro) {
    console.error('Erro ao excluir caixa:', erro);
    res.redirect('/caixas?erro=Erro ao excluir caixa.');
  }
});

// Ajustar Caixa
router.get('/ajustar/:id', async (req, res) => {
  try {
    if (req.session.usuario.nivel !== 'admin') return res.redirect('/caixas');
    const { id } = req.params;
    res.render('caixas/ajustar', { caixa_id: id, erro: null });
  } catch (erro) {
    console.error('Erro ao carregar ajuste de caixa:', erro);
    res.redirect('/caixas?erro=Erro ao carregar tela de ajuste.');
  }
});

router.post('/ajustar/:id', async (req, res) => {
  try {
    if (req.session.usuario.nivel !== 'admin') return res.redirect('/caixas');
    const { id } = req.params;
    const { valor, motivo } = req.body;

    await db.query('INSERT INTO ajustes_caixa SET ?', {
      caixa_id: id,
      valor,
      motivo
    });

    res.redirect('/caixas?sucesso=Ajuste realizado com sucesso!');
  } catch (erro) {
    console.error('Erro ao ajustar caixa:', erro);
    res.redirect('/caixas?erro=Erro ao realizar ajuste.');
  }
});

// Consultar caixas
router.get('/consulta', async (req, res) => {
  try {
    const [caixas] = await db.query('SELECT * FROM caixas ORDER BY nome');
    res.render('caixas/consulta', { titulo: 'Consulta de Caixas', caixas, erro: null });
  } catch (erro) {
    console.error('Erro ao consultar caixas:', erro);
    res.render('caixas/consulta', { titulo: 'Consulta de Caixas', caixas: [], erro: 'Erro ao carregar consulta de caixas.' });
  }
});

// Resumo de caixas
router.get('/resumo', async (req, res) => {
  try {
    const [dados] = await db.query(`
      SELECT 
        c.id,
        c.nome,
        c.valor_inicial,
        SUM(CASE WHEN f.tipo = 'receber' THEN f.valor ELSE 0 END) AS total_receber,
        SUM(CASE WHEN f.tipo = 'pagar' THEN f.valor ELSE 0 END) AS total_pagar,
        (
          SELECT SUM(valor) FROM ajustes_caixa WHERE caixa_id = c.id
        ) AS total_ajustes
      FROM caixas c
      LEFT JOIN financeiro f ON c.id = f.caixa_quitacao_id
      GROUP BY c.id
      ORDER BY c.nome
    `);

    res.render('caixas/resumo', { titulo: 'Resumo de Caixas', dados, erro: null });
  } catch (erro) {
    console.error('Erro ao gerar resumo de caixas:', erro);
    res.render('caixas/resumo', { titulo: 'Resumo de Caixas', dados: [], erro: 'Erro ao carregar resumo de caixas.' });
  }
});

module.exports = router;