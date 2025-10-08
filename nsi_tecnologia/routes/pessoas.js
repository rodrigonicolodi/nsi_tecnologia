const express = require('express');
const router = express.Router();
const db = require('../db');

// Rota: Listagem com busca, filtros e paginação
router.get('/', async (req, res) => {
  try {
    const { busca = '', tipo = '', status = '', pagina = 1 } = req.query;
    const limite = 10;
    const offset = (pagina - 1) * limite;

    let sql = 'SELECT * FROM pessoas WHERE 1=1';
    const params = [];

    if (busca) {
      sql += ' AND nome LIKE ?';
      params.push(`%${busca}%`);
    }

    if (tipo) {
      sql += ' AND tipo = ?';
      params.push(tipo);
    }

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY nome LIMIT ? OFFSET ?';
    params.push(limite, offset);

    const [pessoas] = await db.query(sql, params);

    // Contagem total para paginação
    let sqlContagem = 'SELECT COUNT(*) as total FROM pessoas WHERE 1=1';
    const paramsContagem = [];

    if (busca) {
      sqlContagem += ' AND nome LIKE ?';
      paramsContagem.push(`%${busca}%`);
    }

    if (tipo) {
      sqlContagem += ' AND tipo = ?';
      paramsContagem.push(tipo);
    }

    if (status) {
      sqlContagem += ' AND status = ?';
      paramsContagem.push(status);
    }

    const [contagem] = await db.query(sqlContagem, paramsContagem);
    const total = contagem[0].total;
    const totalPaginas = Math.ceil(total / limite);

    res.render('pessoas/listar', {
      titulo: 'Lista de Pessoas',
      pessoas,
      busca,
      tipo,
      status,
      pagina: Number(pagina),
      totalPaginas,
      erro: null,
      sucesso: null
    });
  } catch (erro) {
    console.error('Erro ao listar pessoas:', erro);
    res.render('pessoas/listar', {
      titulo: 'Lista de Pessoas',
      pessoas: [],
      busca: '',
      tipo: '',
      status: '',
      pagina: 1,
      totalPaginas: 1,
      erro: 'Não foi possível carregar a lista de pessoas.',
      sucesso: null
    });
  }
});

// Rota: Formulário de cadastro
router.get('/novo', (req, res) => {
  res.render('pessoas/novo', {
    titulo: 'Nova Pessoa',
    erro: null,
    sucesso: null
  });
});

// Rota: Editar pessoa
router.get('/editar/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [resultado] = await db.query('SELECT * FROM pessoas WHERE id = ?', [id]);

    if (resultado.length === 0) {
      return res.redirect('/pessoas');
    }

    const pessoa = resultado[0];

    res.render('pessoas/editar', {
      titulo: 'Editar Pessoa',
      pessoa,
      erro: null,
      sucesso: null
    });
  } catch (erro) {
    console.error('Erro ao buscar pessoa:', erro);
    res.redirect('/pessoas');
  }
});

// Rota: Exibir dados da pessoa
router.get('/exibir/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [resultado] = await db.query('SELECT * FROM pessoas WHERE id = ?', [id]);

    if (resultado.length === 0) {
      return res.redirect('/pessoas');
    }

    const pessoa = resultado[0];

    res.render('pessoas/exibir', {
      titulo: 'Dados da Pessoa',
      pessoa
    });
  } catch (erro) {
    console.error('Erro ao exibir pessoa:', erro);
    res.redirect('/pessoas');
  }
});

// Rota: Salvar nova pessoa
router.post('/novo', async (req, res) => {
  const {
    tipo, nome, razao_social, nome_fantasia, documento, rg_ie,
    data_nascimento, sexo, estado_civil, profissao, email,
    telefone, celular, whatsapp, cep, endereco, numero,
    complemento, bairro, cidade, uf, pais, contato_responsavel,
    observacoes, status, codigo_pais
  } = req.body;

  try {
    // Tratar data_nascimento vazia
    const dataNascimento = data_nascimento && data_nascimento.trim() !== '' ? data_nascimento : null;
    
    // Tratar codigo_pais vazio
    const codigoPais = codigo_pais || '+55';

    await db.query(
      `INSERT INTO pessoas (
        tipo, nome, razao_social, nome_fantasia, documento, rg_ie,
        data_nascimento, sexo, estado_civil, profissao, email,
        telefone, celular, whatsapp, cep, endereco, numero,
        complemento, bairro, cidade, uf, pais, contato_responsavel,
        observacoes, status, codigo_pais
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tipo, nome, razao_social, nome_fantasia, documento, rg_ie,
        dataNascimento, sexo, estado_civil, profissao, email,
        telefone, celular, whatsapp, cep, endereco, numero,
        complemento, bairro, cidade, uf, pais, contato_responsavel,
        observacoes, status, codigoPais
      ]
    );
    res.redirect('/pessoas');
  } catch (erro) {
    console.error('Erro ao cadastrar pessoa:', erro);
    res.render('pessoas/novo', {
      titulo: 'Nova Pessoa',
      erro: 'Erro ao salvar. Verifique os dados.',
      sucesso: null
    });
  }
});

// Rota: Atualizar pessoa
router.post('/editar/:id', async (req, res) => {
  const { id } = req.params;
  const {
    tipo, nome, razao_social, nome_fantasia, documento, rg_ie,
    data_nascimento, sexo, estado_civil, profissao, email,
    telefone, celular, whatsapp, cep, endereco, numero,
    complemento, bairro, cidade, uf, pais, contato_responsavel,
    observacoes, status, codigo_pais
  } = req.body;

  try {
    // Tratar data_nascimento vazia
    const dataNascimento = data_nascimento && data_nascimento.trim() !== '' ? data_nascimento : null;
    
    // Tratar codigo_pais vazio
    const codigoPais = codigo_pais || '+55';

    await db.query(
      `UPDATE pessoas SET
        tipo = ?, nome = ?, razao_social = ?, nome_fantasia = ?, documento = ?, rg_ie = ?,
        data_nascimento = ?, sexo = ?, estado_civil = ?, profissao = ?, email = ?,
        telefone = ?, celular = ?, whatsapp = ?, cep = ?, endereco = ?, numero = ?,
        complemento = ?, bairro = ?, cidade = ?, uf = ?, pais = ?, contato_responsavel = ?,
        observacoes = ?, status = ?, codigo_pais = ?
      WHERE id = ?`,
      [
        tipo, nome, razao_social, nome_fantasia, documento, rg_ie,
        dataNascimento, sexo, estado_civil, profissao, email,
        telefone, celular, whatsapp, cep, endereco, numero,
        complemento, bairro, cidade, uf, pais, contato_responsavel,
        observacoes, status, codigoPais, id
      ]
    );

    res.redirect('/pessoas');
  } catch (erro) {
    console.error('Erro ao atualizar pessoa:', erro);
    res.render('pessoas/editar', {
      titulo: 'Editar Pessoa',
      pessoa: req.body,
      erro: 'Erro ao salvar alterações.',
      sucesso: null
    });
  }
});

// Rota: Excluir pessoa
router.post('/excluir/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [vinculos] = await db.query('SELECT COUNT(*) AS total FROM financeiro WHERE pessoa_id = ?', [id]);
    if (vinculos[0].total > 0) {
      return res.redirect('/pessoas?erro=vinculada');
    }

    await db.query('DELETE FROM pessoas WHERE id = ?', [id]);
    res.redirect('/pessoas');
  } catch (erro) {
    console.error('Erro ao excluir pessoa:', erro);
    res.redirect('/pessoas?erro=exclusao');
  }
});

module.exports = router;