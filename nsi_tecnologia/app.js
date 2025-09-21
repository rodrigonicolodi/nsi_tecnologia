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


// 🧩 Middlewares globais
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 🖼️ Layout EJS
app.use(expressLayouts);
app.set('layout', 'layout');

// 🧠 Sessão
app.use(session({
  secret: 'chave_secreta_segura',
  resave: false,
  saveUninitialized: false
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

// 🚀 Inicializa servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
});

// 🚀 Inicializa servidor com porta do integrador
// const PORT = process.env.PORT || 61910;
// app.listen(PORT, '0.0.0.0', () => {
//   console.log(`✅ Servidor rodando na porta ${PORT}`);
// });