const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt'); // Adicionado para criptografar senha

function somenteAdmin(req, res, next) {
  if (req.session.usuario && req.session.usuario.nivel === 'admin') return next();
  return res.redirect('/login');
}

// Função para registrar auditoria
async function registrarAuditoria(adminId, acao, alvoId, descricao) {
  await db.query(
    'INSERT INTO auditoria (admin_id, acao, alvo_id, descricao) VALUES (?, ?, ?, ?)',
    [adminId, acao, alvoId, descricao]
  );
}

// Listar usuários com busca por nome ou e-mail
router.get('/', somenteAdmin, async (req, res) => {
  try {
    const { busca } = req.query;

    let query = 'SELECT id, nome, email, nivel, ativo FROM usuarios WHERE 1 = 1';
    const params = [];

    if (busca) {
      query += ' AND (nome LIKE ? OR email LIKE ?)';
      const termo = `%${busca}%`;
      params.push(termo, termo);
    }

    const [rows] = await db.query(query, params);
    const usuarios = rows.map(u => ({
      ...u,
      status: u.ativo === 1 ? 'Ativo' : 'Inativo'
    }));

    res.render('usuarios', {
      titulo: 'Gerenciar Usuários',
      usuarios,
      erro: null,
      busca
    });
  } catch (err) {
    console.error('Erro ao carregar usuários:', err);
    res.render('usuarios', {
      titulo: 'Gerenciar Usuários',
      usuarios: [],
      erro: 'Erro ao carregar usuários',
      busca: ''
    });
  }
});

// Exibir formulário de novo usuário
router.get('/novo', somenteAdmin, (req, res) => {
  res.render('usuarios/novo', {
    titulo: 'Novo Usuário',
    erro: null,
    sucesso: null
  });
});

// Salvar novo usuário com validação de e-mail duplicado
router.post('/novo', somenteAdmin, async (req, res) => {
  try {
    const { nome, email, senha, nivel, ativo } = req.body;

    if (!nome || !email || !senha || !nivel || ativo === undefined) {
      return res.render('usuarios/novo', {
        titulo: 'Novo Usuário',
        erro: 'Todos os campos obrigatórios devem ser preenchidos.',
        sucesso: null
      });
    }

    const [existente] = await db.query('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (existente.length > 0) {
      return res.render('usuarios/novo', {
        titulo: 'Novo Usuário',
        erro: 'Este e-mail já está cadastrado.',
        sucesso: null
      });
    }

    const hash = await bcrypt.hash(senha, 10);

    await db.query(
      'INSERT INTO usuarios (nome, email, senha, nivel, ativo) VALUES (?, ?, ?, ?, ?)',
      [nome, email, hash, nivel, ativo]
    );

    await registrarAuditoria(
      req.session.usuario.id,
      'criar',
      null,
      `Novo usuário criado: ${nome} (${email})`
    );

    res.render('usuarios/novo', {
      titulo: 'Novo Usuário',
      sucesso: 'Usuário cadastrado com sucesso!',
      erro: null
    });
  } catch (err) {
    console.error('Erro ao cadastrar usuário:', err);
    res.render('usuarios/novo', {
      titulo: 'Novo Usuário',
      erro: 'Erro ao cadastrar usuário.',
      sucesso: null
    });
  }
});

// Exibir formulário de edição
router.get('/:id/editar', somenteAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT id, nome, email, nivel, ativo FROM usuarios WHERE id = ?', [id]);
    const usuario = rows[0];
    if (!usuario) return res.redirect('/usuarios');

    usuario.status = usuario.ativo === 1 ? 'ativo' : 'inativo';
    res.render('usuarios/editar', { titulo: 'Editar Usuário', usuario });
  } catch (err) {
    console.error('Erro ao carregar usuário para edição:', err);
    res.redirect('/usuarios');
  }
});

// Salvar alterações do usuário (inclui senha opcional e validação de e-mail duplicado)
router.post('/:id/editar', somenteAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, nivel, status, senha } = req.body;
    const ativo = status === 'ativo' ? 1 : 0;

    const [existente] = await db.query('SELECT id FROM usuarios WHERE email = ? AND id != ?', [email, id]);
    if (existente.length > 0) {
      const [rows] = await db.query('SELECT id, nome, email, nivel, ativo FROM usuarios WHERE id = ?', [id]);
      const usuario = rows[0];
      usuario.status = usuario.ativo === 1 ? 'ativo' : 'inativo';

      return res.render('usuarios/editar', {
        titulo: 'Editar Usuário',
        usuario,
        erro: 'Este e-mail já está em uso por outro usuário.'
      });
    }

    let query = 'UPDATE usuarios SET nome = ?, email = ?, nivel = ?, ativo = ?';
    const params = [nome, email, nivel, ativo];

    if (senha && senha.trim() !== '') {
      const hash = await bcrypt.hash(senha, 10);
      query += ', senha = ?';
      params.push(hash);
    }

    query += ' WHERE id = ?';
    params.push(id);

    await db.query(query, params);

    await registrarAuditoria(
      req.session.usuario.id,
      'editar',
      id,
      `Usuário ${nome} (${email}) atualizado`
    );

    res.redirect('/usuarios');
  } catch (err) {
    console.error('Erro ao atualizar usuário:', err);
    res.redirect('/usuarios');
  }
});

// Exibir tela de confirmação de exclusão
router.get('/:id/excluir', somenteAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT id, nome, email FROM usuarios WHERE id = ?', [id]);
    const usuario = rows[0];
    if (!usuario) return res.redirect('/usuarios');

    res.render('usuarios/excluir', { titulo: 'Excluir Usuário', usuario });
  } catch (err) {
    console.error('Erro ao carregar usuário para exclusão:', err);
    res.redirect('/usuarios');
  }
});

// Executar exclusão após confirmação
router.post('/:id/excluir', somenteAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query('SELECT nome, email FROM usuarios WHERE id = ?', [id]);
    const usuario = rows[0];

    await db.query('DELETE FROM usuarios WHERE id = ?', [id]);

    await registrarAuditoria(
      req.session.usuario.id,
      'excluir',
      id,
      `Usuário ${usuario?.nome || 'ID ' + id} excluído`
    );

    res.redirect('/usuarios');
  } catch (err) {
    console.error('Erro ao excluir usuário:', err);
    res.redirect('/usuarios');
  }
});

// Visualizar logs de auditoria
router.get('/auditoria', somenteAdmin, async (req, res) => {
  try {
    const { admin, acao, de, ate } = req.query;

    let query = `
      SELECT a.*, u.nome AS admin_nome
      FROM auditoria a
      JOIN usuarios u ON u.id = a.admin_id
      WHERE 1 = 1
    `;
    const params = [];

    if (admin) {
      query += ' AND u.nome LIKE ?';
      params.push(`%${admin}%`);
    }

    if (acao) {
      query += ' AND a.acao = ?';
      params.push(acao);
    }

    if (de) {
      query += ' AND a.data >= ?';
      params.push(de);
    }

    if (ate) {
      query += ' AND a.data <= ?';
      params.push(ate);
    }

    query += ' ORDER BY a.data DESC';

    const [logs] = await db.query(query, params);
    res.render('usuarios/auditoria', {
      titulo: 'Logs de Auditoria',
      logs,
      filtros: { admin, acao, de, ate }
    });
  } catch (err) {
    console.error('Erro ao carregar auditoria:', err);
    res.redirect('/usuarios');
  }
});

module.exports = router;