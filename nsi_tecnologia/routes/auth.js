const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db');
const { loginLimiter } = require('../middleware/rateLimit');

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
router.post('/login', loginLimiter, async (req, res) => {
  const { email, senha } = req.body;
  
  console.log('🔐 Tentativa de login:', { 
    email, 
    timestamp: new Date().toISOString(),
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    sessionId: req.sessionID
  });
  
  try {
    // Verificar se email e senha foram fornecidos
    if (!email || !senha) {
      console.log('❌ Email ou senha não fornecidos');
      return res.render('login', {
        layout: false,
        titulo: 'Login',
        erro: 'Email e senha são obrigatórios'
      });
    }

    // Testar conectividade com o banco
    console.log('🔌 Testando conectividade com o banco...');
    const [rows] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    console.log('👤 Usuário encontrado:', rows.length > 0 ? 'Sim' : 'Não');
    
    if (!rows.length) {
      console.log('❌ Usuário não encontrado:', email);
      return res.render('login', {
        layout: false,
        titulo: 'Login',
        erro: 'Usuário não encontrado'
      });
    }

    const usuario = rows[0];
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
    console.log('🔑 Senha correta:', senhaCorreta ? 'Sim' : 'Não');
    
    if (!senhaCorreta) {
      console.log('❌ Senha incorreta para:', email);
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

    console.log('✅ Login bem-sucedido:', { id: usuario.id, nome: usuario.nome, nivel: usuario.nivel });
    res.redirect('/dashboard');
  } catch (err) {
    console.error('❌ Erro no login:', err);
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