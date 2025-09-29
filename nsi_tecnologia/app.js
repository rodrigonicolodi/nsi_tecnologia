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
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// 👤 Disponibiliza usuário logado nas views
app.use((req, res, next) => {
  res.locals.usuario = req.session.usuario || null;
  next();
});

// 🖼️ Configuração de views
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 🚦 Uso das rotas
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
    erro: err.message,
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