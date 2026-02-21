require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');

// 🔗 Rotas
const osRoutes = require('./routes/os');
const authRouter = require('./routes/auth');
const usuariosRouter = require('./routes/usuarios');
const pessoasRoutes = require('./routes/pessoas');
const estoqueRoutes = require('./routes/estoque');
const movimentacoesRoutes = require('./routes/movimentacoes');
const financeiroRoutes = require('./routes/financeiro'); // ✅ Adicionada
const caixasRouter = require('./routes/caixas');
const relatoriosRoutes = require('./routes/relatorios');
const pdfRoutes = require('./routes/pdf');
const apiRoutes = require('./routes/api');

// 🧩 Middlewares globais
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 🔒 Middleware de segurança básico
app.use((req, res, next) => {
  // Remove header X-Powered-By
  res.removeHeader('X-Powered-By');
  // Adiciona headers de segurança
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// 🖼️ Layout EJS
app.use(expressLayouts);
app.set('layout', 'layout');

// 🧠 Sessão
// Configuração de cookie: por padrão usa secure=false para funcionar em HTTP/proxy
// Configure FORCE_SECURE_COOKIE=true apenas se o Integrador usar HTTPS direto
const cookieSecure = process.env.FORCE_SECURE_COOKIE === 'true';

app.use(session({
  secret: process.env.SESSION_SECRET || 'default-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: cookieSecure, // false por padrão (funciona em HTTP/proxy)
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// 👤 Disponibiliza usuário logado nas views
app.use((req, res, next) => {
  res.locals.usuario = req.session.usuario || null;
  next();
});

// 🔐 SEGURANÇA - Proteção global de login
// Todas as rotas abaixo exigem sessão. Só rotasPublicas são acessíveis sem login.
// ⚠️ CUIDADO: NÃO adicionar telas do sistema em rotasPublicas. Só login, recuperar-senha, etc.
// Novos routers DEVEM ser montados ABAIXO deste middleware para ficarem protegidos.
const rotasPublicas = ['/login', '/'];
app.use((req, res, next) => {
  if (rotasPublicas.includes(req.path)) return next();
  if (req.session && req.session.usuario) return next();
  return res.redirect('/login');
});

// 🖼️ Configuração de views
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 🚦 Rotas (todas protegidas pelo middleware acima; montar novos routers aqui)
app.use('/', authRouter);
app.use('/usuarios', usuariosRouter);
app.use('/pessoas', pessoasRoutes);
app.use('/estoque', estoqueRoutes);
app.use('/movimentacoes', movimentacoesRoutes);
app.use('/os', osRoutes);
app.use('/financeiro', financeiroRoutes); // ✅ Ativada corretamente
app.use('/caixas', caixasRouter);
app.use('/relatorios', relatoriosRoutes);
app.use('/pdf', pdfRoutes);
app.use('/api', apiRoutes);

// 🏠 Dashboard
app.get('/dashboard', (req, res) => {
  if (!req.session.usuario) {
    return res.redirect('/login');
  }
  res.render('dashboard', { 
    titulo: 'Dashboard',
    usuario: req.session.usuario 
  });
});

// 🔁 Redireciona raiz para login
app.get('/', (req, res) => {
  res.redirect('/login');
});

// ❌ Página 404
app.use((req, res) => {
  res.status(404).render('404', {
    titulo: 'Página não encontrada',
    layout: false
  });
});

// 🚨 Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('🚨 Erro capturado:', err);
  res.status(500).render('erro', {
    titulo: 'Erro interno do servidor',
    mensagem: err.message,
    layout: false
  });
});

// 🚀 Inicializa servidor
const PORT = process.env.PORT
app.listen(PORT, () => {
console.log(`✅ Servidor NSI Tecnologia rodando em http://localhost:${PORT}`);
console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
console.log(`📊 Banco: ${process.env.DB_NAME ? 'Configurado' : '❌ Não configurado'}`);
});

// 🚀 Inicializa servidor com porta do integrador
// const PORT = process.env.PORT || 61910;
// app.listen(PORT, '0.0.0.0', () => {
// console.log(`✅ Servidor rodando na porta ${PORT}`);
// });