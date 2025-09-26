const express = require('express');
const router = express.Router();
const bd = require('../db');

// 🔢 Função para gerar código sequencial confiável
async function gerarCodigoSequencial() {
  try {
    const [result] = await bd.query(`
      SELECT codigo FROM produtos
      WHERE codigo LIKE 'PROD-%'
      ORDER BY id DESC
      LIMIT 1
    `);

    if (result.length === 0 || !result[0].codigo) {
      return 'PROD-001';
    }

    const match = result[0].codigo.match(/^PROD-(\d+)$/);
    const numero = match ? parseInt(match[1]) : 0;
    const novoNumero = numero + 1;
    return 'PROD-' + String(novoNumero).padStart(3, '0');
  } catch (erro) {
    console.error('Erro ao gerar código sequencial:', erro);
    return 'PROD-001';
  }
}

// 🔍 Listar produtos com filtros e paginação
router.get('/', async (req, res) => {
  const { busca = '', categoria = '', status = '', pagina = 1, erro = null, sucesso = null } = req.query;
  const limite = 10;
  const offset = (pagina - 1) * limite;

  try {
    let sql = 'SELECT * FROM produtos WHERE 1=1';
    let countSql = 'SELECT COUNT(*) AS total FROM produtos WHERE 1=1';
    const params = [];
    const countParams = [];

    if (busca) {
      sql += ' AND nome LIKE ?';
      countSql += ' AND nome LIKE ?';
      params.push(`%${busca}%`);
      countParams.push(`%${busca}%`);
    }

    if (categoria) {
      sql += ' AND categoria = ?';
      countSql += ' AND categoria = ?';
      params.push(categoria);
      countParams.push(categoria);
    }

    if (status) {
      sql += ' AND status = ?';
      countSql += ' AND status = ?';
      params.push(status);
      countParams.push(status);
    }

    sql += ' ORDER BY nome ASC LIMIT ? OFFSET ?';
    params.push(limite, offset);

    const [produtos] = await bd.query(sql, params);
    const [contagem] = await bd.query(countSql, countParams);
    const totalPaginas = Math.ceil(contagem[0].total / limite);

    res.render('estoque/listar', {
      titulo: 'Estoque de Produtos',
      produtos,
      busca,
      categoria,
      status,
      pagina: Number(pagina),
      totalPaginas,
      erro,
      sucesso
    });
  } catch (erro) {
    console.error('Erro ao listar produtos:', erro);
    res.render('estoque/listar', {
      titulo: 'Estoque de Produtos',
      produtos: [],
      busca,
      categoria,
      status,
      pagina: 1,
      totalPaginas: 1,
      erro: 'Erro ao carregar produtos.',
      sucesso: null
    });
  }
});

// 🔍 Listar produtos (rota alternativa para consistência)
router.get('/listar', async (req, res) => {
  const { busca = '', categoria = '', status = '', pagina = 1, erro = null, sucesso = null } = req.query;
  const limite = 10;
  const offset = (pagina - 1) * limite;

  try {
    let sql = 'SELECT * FROM produtos WHERE 1=1';
    let countSql = 'SELECT COUNT(*) AS total FROM produtos WHERE 1=1';
    const params = [];
    const countParams = [];

    if (busca) {
      sql += ' AND nome LIKE ?';
      countSql += ' AND nome LIKE ?';
      params.push(`%${busca}%`);
      countParams.push(`%${busca}%`);
    }

    if (categoria) {
      sql += ' AND categoria = ?';
      countSql += ' AND categoria = ?';
      params.push(categoria);
      countParams.push(categoria);
    }

    if (status) {
      sql += ' AND status = ?';
      countSql += ' AND status = ?';
      params.push(status);
      countParams.push(status);
    }

    sql += ' ORDER BY nome ASC LIMIT ? OFFSET ?';
    params.push(limite, offset);

    const [produtos] = await bd.query(sql, params);
    const [contagem] = await bd.query(countSql, countParams);
    const totalPaginas = Math.ceil(contagem[0].total / limite);

    res.render('estoque/listar', {
      titulo: 'Estoque de Produtos',
      produtos,
      busca,
      categoria,
      status,
      pagina: Number(pagina),
      totalPaginas,
      erro,
      sucesso
    });
  } catch (erro) {
    console.error('Erro ao listar produtos:', erro);
    res.render('estoque/listar', {
      titulo: 'Estoque de Produtos',
      produtos: [],
      busca,
      categoria,
      status,
      pagina: 1,
      totalPaginas: 1,
      erro: 'Erro ao carregar produtos.',
      sucesso: null
    });
  }
});

// 👁️ Exibir produto
router.get('/exibir/:id', async (req, res) => {
  try {
    const [produto] = await bd.query('SELECT * FROM produtos WHERE id = ?', [req.params.id]);
    if (!produto.length) return res.redirect('/estoque?erro=Produto não encontrado');
    res.render('estoque/exibir', { titulo: 'Detalhes do Produto', produto: produto[0] });
  } catch (erro) {
    console.error('Erro ao exibir produto:', erro);
    res.redirect('/estoque?erro=Erro ao exibir produto.');
  }
});

// ➕ Novo produto (formulário)
router.get('/novo', async (req, res) => {
  try {
    const codigoGerado = await gerarCodigoSequencial();
    res.render('estoque/novo', {
      titulo: 'Novo Produto',
      erro: null,
      codigoGerado
    });
  } catch (erro) {
    console.error('Erro ao carregar formulário de novo produto:', erro);
    res.render('estoque/novo', {
      titulo: 'Novo Produto',
      erro: 'Erro ao carregar formulário.',
      codigoGerado: 'PROD-001'
    });
  }
});

// 💾 Criar produto
router.post('/novo', async (req, res) => {
  try {
    const { codigo } = req.body;
    const [existe] = await bd.query('SELECT * FROM produtos WHERE codigo = ?', [codigo]);

    if (existe.length > 0) {
      return res.render('estoque/novo', {
        titulo: 'Novo Produto',
        erro: 'Já existe um produto com esse código.',
        codigoGerado: codigo
      });
    }

    await bd.query('INSERT INTO produtos SET ?', [req.body]);
    res.redirect('/estoque?sucesso=Produto cadastrado com sucesso');
  } catch (err) {
    console.error('Erro ao cadastrar produto:', err);
    const fallbackCodigo = req.body.codigo || await gerarCodigoSequencial();
    res.render('estoque/novo', {
      titulo: 'Novo Produto',
      erro: 'Erro ao cadastrar produto.',
      codigoGerado: fallbackCodigo
    });
  }
});

// ✏️ Editar produto (formulário)
router.get('/editar/:id', async (req, res) => {
  try {
    const [produto] = await bd.query('SELECT * FROM produtos WHERE id = ?', [req.params.id]);
    if (!produto.length) return res.redirect('/estoque?erro=Produto não encontrado');
    res.render('estoque/editar', { titulo: 'Editar Produto', produto: produto[0], erro: null });
  } catch (erro) {
    console.error('Erro ao carregar edição de produto:', erro);
    res.redirect('/estoque?erro=Erro ao carregar produto para edição.');
  }
});

// 🔄 Atualizar produto
router.post('/editar/:id', async (req, res) => {
  try {
    await bd.query('UPDATE produtos SET ? WHERE id = ?', [req.body, req.params.id]);
    res.redirect('/estoque?sucesso=Produto atualizado com sucesso');
  } catch (err) {
    console.error('Erro ao atualizar produto:', err);
    res.render('estoque/editar', {
      titulo: 'Editar Produto',
      erro: 'Erro ao atualizar produto.',
      produto: req.body
    });
  }
});

// 🗑️ Excluir produto
router.post('/excluir/:id', async (req, res) => {
  try {
    await bd.query('DELETE FROM produtos WHERE id = ?', [req.params.id]);
    res.redirect('/estoque?sucesso=Produto excluído com sucesso');
  } catch (err) {
    console.error('Erro ao excluir produto:', err);
    res.redirect('/estoque?erro=Erro ao excluir produto.');
  }
});

module.exports = router;