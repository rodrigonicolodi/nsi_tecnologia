const express = require('express');
const router = express.Router();
const db = require('../db');

// 📄 Listagem com filtros e paginação
router.get('/', async (req, res) => {
  const { busca = '', tipo = '', status = '', pagina = 1 } = req.query;
  const limite = 10;
  const offset = (pagina - 1) * limite;

  let sql = `
    SELECT f.id, f.tipo, f.valor, f.vencimento, f.status, f.descricao,
           p.nome AS pessoa_nome, c.nome AS caixa_nome
    FROM financeiro f
    LEFT JOIN pessoas p ON f.pessoa_id = p.id
    LEFT JOIN caixas c ON f.caixa_id = c.id
    WHERE 1 = 1
  `;
  const params = [];

  if (busca) {
    sql += ' AND (f.descricao LIKE ? OR p.nome LIKE ?)';
    params.push(`%${busca}%`, `%${busca}%`);
  }

  if (tipo) {
    sql += ' AND f.tipo = ?';
    params.push(tipo);
  }

  if (status) {
    sql += ' AND f.status = ?';
    params.push(status);
  }

  sql += ' ORDER BY f.vencimento DESC LIMIT ? OFFSET ?';
  params.push(limite, offset);

  try {
    const [lancamentos] = await db.query(sql, params);
    const [caixas] = await db.query('SELECT id, nome FROM caixas WHERE ativo = true'); // ✅ ADICIONADO

    const countParams = [...params.slice(0, params.length - 2)];
    const countSql = `
      SELECT COUNT(*) AS total
      FROM financeiro f
      LEFT JOIN pessoas p ON f.pessoa_id = p.id
      LEFT JOIN caixas c ON f.caixa_id = c.id
      WHERE 1 = 1
      ${busca ? ' AND (f.descricao LIKE ? OR p.nome LIKE ?)' : ''}
      ${tipo ? ' AND f.tipo = ?' : ''}
      ${status ? ' AND f.status = ?' : ''}
    `;

    const [totalResult] = await db.query(countSql, countParams);
    const totalPaginas = Math.ceil(totalResult[0].total / limite);

    res.render('financeiro/listar', {
      titulo: 'Lançamentos Financeiros',
      lancamentos,
      caixas, // ✅ ADICIONADO
      busca,
      tipo,
      status,
      pagina: Number(pagina),
      totalPaginas,
      erro: req.query.erro || null,
      sucesso: req.query.sucesso || null
    });
  } catch (erro) {
    console.error('Erro ao buscar lançamentos:', erro);
    res.render('financeiro/listar', {
      titulo: 'Lançamentos Financeiros',
      lancamentos: [],
      caixas: [], // ✅ ADICIONADO para evitar erro na view
      busca,
      tipo,
      status,
      pagina: 1,
      totalPaginas: 0,
      erro: 'Erro ao carregar lançamentos.',
      sucesso: null
    });
  }
});

// 🆕 Formulário de novo lançamento
router.get('/novo', async (req, res) => {
  try {
    const [pessoas] = await db.query('SELECT id, nome FROM pessoas');
    const [caixas] = await db.query('SELECT id, nome FROM caixas WHERE ativo = true');

    res.render('financeiro/nova', {
      titulo: 'Novo Lançamento Financeiro',
      pessoas,
      caixas,
      erro: null,
      sucesso: null
    });
  } catch (erro) {
    console.error('Erro ao carregar dados:', erro);
    res.render('financeiro/nova', {
      titulo: 'Novo Lançamento Financeiro',
      pessoas: [],
      caixas: [],
      erro: 'Erro ao carregar dados.',
      sucesso: null
    });
  }
});

// 💾 Salvar novo lançamento
router.post('/novo', async (req, res) => {
  const { tipo, pessoa_id, caixa_id, valor, vencimento, status, descricao } = req.body;

  try {
    await db.query('INSERT INTO financeiro SET ?', {
      tipo,
      pessoa_id,
      caixa_id,
      valor: parseFloat(valor) || 0,
      vencimento,
      status,
      descricao
    });

    res.redirect('/financeiro?sucesso=Lançamento salvo com sucesso!');
  } catch (erro) {
    console.error('Erro ao salvar lançamento:', erro);
    const [pessoas] = await db.query('SELECT id, nome FROM pessoas');
    const [caixas] = await db.query('SELECT id, nome FROM caixas WHERE ativo = true');

    res.render('financeiro/nova', {
      titulo: 'Novo Lançamento Financeiro',
      erro: 'Erro ao salvar lançamento.',
      sucesso: null,
      pessoas,
      caixas
    });
  }
});

// ✏️ Formulário de edição
router.get('/editar/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [[lancamento]] = await db.query('SELECT * FROM financeiro WHERE id = ?', [id]);
    const [pessoas] = await db.query('SELECT id, nome FROM pessoas');
    const [caixas] = await db.query('SELECT id, nome FROM caixas WHERE ativo = true');

    if (!lancamento) {
      return res.redirect('/financeiro?erro=Lançamento não encontrado');
    }

    res.render('financeiro/editar', {
      titulo: 'Editar Lançamento Financeiro',
      lancamento,
      pessoas,
      caixas,
      erro: null,
      sucesso: null
    });
  } catch (erro) {
    console.error('Erro ao carregar edição:', erro);
    res.redirect('/financeiro?erro=Erro ao carregar lançamento para edição.');
  }
});

// 💾 Salvar edição (✅ AJUSTADO)
router.post('/editar/:id', async (req, res) => {
  const { id } = req.params;
  const { tipo, pessoa_id, caixa_id, valor, vencimento, status, descricao } = req.body;

  try {
    await db.query('UPDATE financeiro SET ? WHERE id = ?', [{
      tipo,
      pessoa_id,
      caixa_id,
      valor: parseFloat(valor) || 0,
      vencimento,
      status,
      descricao
    }, id]);

    res.redirect('/financeiro?sucesso=Lançamento atualizado com sucesso!');
  } catch (erro) {
    console.error('Erro ao atualizar lançamento:', erro);
    const [[lancamento]] = await db.query('SELECT * FROM financeiro WHERE id = ?', [id]);
    const [pessoas] = await db.query('SELECT id, nome FROM pessoas');
    const [caixas] = await db.query('SELECT id, nome FROM caixas WHERE ativo = true');

    res.render('financeiro/editar', {
      titulo: 'Editar Lançamento Financeiro',
      erro: 'Erro ao atualizar lançamento.',
      sucesso: null,
      lancamento,
      pessoas,
      caixas
    });
  }
});

// 👁️ Exibir detalhes do lançamento
router.get('/exibir/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [[lancamento]] = await db.query(`
      SELECT f.*, p.nome AS pessoa_nome, c.nome AS caixa_nome
      FROM financeiro f
      LEFT JOIN pessoas p ON f.pessoa_id = p.id
      LEFT JOIN caixas c ON f.caixa_id = c.id
      WHERE f.id = ?
    `, [id]);

    if (!lancamento) {
      return res.redirect('/financeiro?erro=Lançamento não encontrado');
    }

    res.render('financeiro/exibir', {
      titulo: 'Detalhes do Lançamento',
      lancamento
    });
  } catch (erro) {
    console.error('Erro ao exibir lançamento:', erro);
    res.redirect('/financeiro?erro=Erro ao exibir lançamento.');
  }
});

// 🗑️ Excluir lançamento
router.post('/excluir/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('DELETE FROM financeiro WHERE id = ?', [id]);
    res.redirect('/financeiro?sucesso=Lançamento excluído com sucesso!');
  } catch (erro) {
    res.redirect('/financeiro?erro=Erro ao excluir lançamento.');
  }
});

//Quitar lancamento

// 💳 Quitar lançamento financeiro
router.post('/quitar/:id', async (req, res) => {
  const id = req.params.id;
  const { caixa_quitacao_id } = req.body;

  try {
    await db.query(`
      UPDATE financeiro
      SET status = 'pago',
          caixa_quitacao_id = ?
      WHERE id = ?
    `, [caixa_quitacao_id, id]);

    res.redirect('/financeiro?sucesso=Lançamento quitado com sucesso!');
  } catch (erro) {
    console.error('Erro ao quitar lançamento:', erro);
    res.redirect('/financeiro?erro=Erro ao quitar lançamento.');
  }
});

// 📊 Relatório financeiro por período
router.get('/relatorio', async (req, res) => {
  const { inicio, fim } = req.query;

  if (!inicio || !fim) {
    return res.render('financeiro/relatorio', {
      titulo: 'Relatório Financeiro',
      lancamentos: [],
      totalReceber: 0,
      totalPagar: 0,
      inicio,
      fim
    });
  }

  try {
    const [lancamentos] = await db.query(`
      SELECT f.*, p.nome AS pessoa_nome, c.nome AS caixa_nome
      FROM financeiro f
      LEFT JOIN pessoas p ON f.pessoa_id = p.id
      LEFT JOIN caixas c ON f.caixa_id = c.id
      WHERE f.vencimento BETWEEN ? AND ?
      ORDER BY f.vencimento ASC
    `, [inicio, fim]);

        let totalReceber = 0;
    let totalPagar = 0;

    lancamentos.forEach(l => {
      if (l.tipo === 'receber') totalReceber += parseFloat(l.valor) || 0;
      if (l.tipo === 'pagar') totalPagar += parseFloat(l.valor) || 0;
    });

    res.render('financeiro/relatorio', {
      titulo: 'Relatório Financeiro',
      lancamentos,
      totalReceber,
      totalPagar,
      inicio,
      fim,
      erro: null
    });
  } catch (erro) {
    console.error('Erro ao gerar relatório:', erro);
    res.render('financeiro/relatorio', {
      titulo: 'Relatório Financeiro',
      lancamentos: [],
      totalReceber: 0,
      totalPagar: 0,
      inicio,
      fim,
      erro: 'Erro ao gerar relatório.'
    });
  }
});

module.exports = router;
