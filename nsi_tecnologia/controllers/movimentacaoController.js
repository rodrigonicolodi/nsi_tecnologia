const db = require('../db');

// 📋 Listar movimentações com filtros e paginação
const listar = async (req, res) => {
  try {
    const tipo = req.query.tipo || '';
    const produto = req.query.produto || '';
    const pessoa = req.query.pessoa || '';
    const paginaAtual = Number.isInteger(parseInt(req.query.pagina)) ? parseInt(req.query.pagina) : 1;
    const limite = 10;
    const offset = (paginaAtual - 1) * limite;

    let sqlBase = `
      FROM movimentacoes m
      LEFT JOIN pessoas p ON m.pessoa_id = p.id
      LEFT JOIN produtos pr ON m.produto_id = pr.id
      WHERE 1 = 1
    `;
    const filtros = [];

    if (tipo) {
      sqlBase += ' AND m.tipo = ?';
      filtros.push(tipo);
    }

    if (produto) {
      sqlBase += ' AND pr.nome LIKE ?';
      filtros.push(`%${produto}%`);
    }

    if (pessoa) {
      sqlBase += ' AND p.nome LIKE ?';
      filtros.push(`%${pessoa}%`);
    }

    const sqlMovimentacoes = `
      SELECT m.*, p.nome AS pessoa_nome, pr.nome AS produto_nome
      ${sqlBase}
      ORDER BY m.data DESC
      LIMIT ? OFFSET ?
    `;
    const paginados = [...filtros, limite, offset];
    const [movimentacoes] = await db.query(sqlMovimentacoes, paginados);

    const sqlTotal = `SELECT COUNT(*) AS total ${sqlBase}`;
    const [total] = await db.query(sqlTotal, filtros);
    const totalPaginas = Math.max(1, Math.ceil(total[0].total / limite));

    res.render('movimentacoes/lista', {
      movimentacoes,
      tipo,
      produto,
      pessoa,
      pagina: 'movimentacoes',
      paginaAtual,
      totalPaginas,
      erro: null,
      sucesso: req.query.sucesso
    });
  } catch (erro) {
    console.error('Erro ao listar movimentações:', erro);
    res.render('movimentacoes/lista', {
      movimentacoes: [],
      tipo: '',
      produto: '',
      pessoa: '',
      pagina: 'movimentacoes',
      paginaAtual: 1,
      totalPaginas: 1,
      erro: 'Erro ao listar movimentações',
      sucesso: null
    });
  }
};

// 📝 Exibir formulário de nova movimentação
const formulario = async (req, res) => {
  try {
    const [produtos] = await db.query('SELECT id, nome FROM produtos');
    const [pessoas] = await db.query('SELECT id, nome FROM pessoas');
    res.render('movimentacoes/nova', {
      produtos,
      pessoas,
      erro: null
    });
  } catch (erro) {
    console.error('Erro ao carregar formulário:', erro);
    res.render('movimentacoes/nova', {
      produtos: [],
      pessoas: [],
      erro: 'Erro ao carregar dados do formulário'
    });
  }
};

// 💾 Salvar movimentação
const salvar = async (req, res) => {
  const { produto_id, tipo, quantidade, pessoa_id, observacao } = req.body;
  const usuario_id = req.session.usuario_id;

  try {
    await db.query(`
      INSERT INTO movimentacoes (produto_id, tipo, quantidade, pessoa_id, observacao, usuario_id, data)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `, [
      produto_id,
      tipo,
      quantidade,
      pessoa_id || null,
      observacao,
      usuario_id
    ]);

    res.redirect('/movimentacoes?sucesso=Movimentação registrada com sucesso');
  } catch (erro) {
    console.error('Erro ao salvar movimentação:', erro);
    const [produtos] = await db.query('SELECT id, nome FROM produtos');
    const [pessoas] = await db.query('SELECT id, nome FROM pessoas');
    res.render('movimentacoes/nova', {
      produtos,
      pessoas,
      erro: 'Erro ao salvar movimentação'
    });
  }
};

// 👁️ Exibir movimentação
const exibir = async (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT m.*, p.nome AS pessoa_nome, pr.nome AS produto_nome
    FROM movimentacoes m
    LEFT JOIN pessoas p ON m.pessoa_id = p.id
    LEFT JOIN produtos pr ON m.produto_id = pr.id
    WHERE m.id = ?
  `;
  const [resultado] = await db.query(sql, [id]);

  if (!resultado.length) {
    return res.redirect('/movimentacoes?erro=Movimentação não encontrada');
  }

  res.render('movimentacoes/exibir', { movimentacao: resultado[0] });
};

// ✏️ Editar movimentação
const editar = async (req, res) => {
  const { id } = req.params;
  const [movs] = await db.query('SELECT * FROM movimentacoes WHERE id = ?', [id]);
  const [produtos] = await db.query('SELECT id, nome FROM produtos');
  const [pessoas] = await db.query('SELECT id, nome FROM pessoas');

  if (!movs.length) {
    return res.redirect('/movimentacoes?erro=Movimentação não encontrada');
  }

  res.render('movimentacoes/editar', {
    movimentacao: movs[0],
    produtos,
    pessoas,
    erro: null
  });
};

// 💾 Atualizar movimentação
const atualizar = async (req, res) => {
  const { id } = req.params;
  const { produto_id, tipo, quantidade, pessoa_id, observacao } = req.body;

  try {
    await db.query(`
      UPDATE movimentacoes
      SET produto_id = ?, tipo = ?, quantidade = ?, pessoa_id = ?, observacao = ?
      WHERE id = ?
    `, [produto_id, tipo, quantidade, pessoa_id || null, observacao, id]);

    res.redirect('/movimentacoes?sucesso=Movimentação atualizada com sucesso');
  } catch (erro) {
    console.error('Erro ao atualizar movimentação:', erro);
    const [produtos] = await db.query('SELECT id, nome FROM produtos');
    const [pessoas] = await db.query('SELECT id, nome FROM pessoas');
    res.render('movimentacoes/editar', {
      movimentacao: { id, produto_id, tipo, quantidade, pessoa_id, observacao },
      produtos,
      pessoas,
      erro: 'Erro ao atualizar movimentação'
    });
  }
};

// 🗑️ Excluir movimentação
const excluir = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM movimentacoes WHERE id = ?', [id]);
    res.redirect('/movimentacoes?sucesso=Movimentação excluída com sucesso');
  } catch (erro) {
    console.error('Erro ao excluir movimentação:', erro);
    res.redirect('/movimentacoes?erro=Erro ao excluir movimentação');
  }
};

module.exports = {
  listar,
  formulario,
  salvar,
  exibir,
  editar,
  atualizar,
  excluir
};