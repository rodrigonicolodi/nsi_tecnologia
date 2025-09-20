const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db');

// Middleware de verificação de login
function verificarLogin(req, res, next) {
  if (req.session && req.session.usuario) return next();
  return res.redirect('/login');
}

// Tela de login sem layout
router.get('/login', (req, res) => {
  res.render('login', {
    layout: false,
    titulo: 'Login',
    erro: null
  });
});

// Autenticação
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    if (!rows.length) {
      return res.render('login', {
        layout: false,
        titulo: 'Login',
        erro: 'Usuário não encontrado'
      });
    }

    const usuario = rows[0];
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
    if (!senhaCorreta) {
      return res.render('login', {
        layout: false,
        titulo: 'Login',
        erro: 'Senha incorreta'
      });
    }

    req.session.usuario = {
      id: usuario.id,
      nome: usuario.nome,
      nivel: usuario.nivel
    };

    res.redirect('/dashboard');
  } catch (err) {
    console.error('Erro no login:', err);
    res.render('login', {
      layout: false,
      titulo: 'Login',
      erro: 'Erro interno ao processar login'
    });
  }
});

// Dashboard com layout ativo
router.get('/dashboard', verificarLogin, (req, res) => {
  res.render('dashboard', {
    titulo: 'Dashboard',
    usuario: req.session.usuario
  });
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

module.exports = router;