#!/bin/bash

# 🛠️ Correção Final para Produção
# Execute no servidor via SSH

echo "🔧 Aplicando correção final..."

# 1. Parar serviço
pm2 stop nsi-tecnologia

# 2. Fazer backup
cp app.js app.js.backup.$(date +%Y%m%d-%H%M)

# 3. Substituir app.js completo
cat > app.js << 'EOF'
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
    erro: err.message,
    layout: false
  });
});

// 🚀 Inicializa servidor com porta do integrador
const PORT = process.env.PORT || 61910;
app.listen(PORT, '0.0.0.0', () => {
console.log(`✅ Servidor rodando na porta ${PORT}`);
});
EOF

# 4. Substituir routes/api.js completo
cat > routes/api.js << 'EOF'
// 🔌 API REST para Integrações
const express = require('express');
const router = express.Router();
const db = require('../db');
const { verificarLogin } = require('../middleware/auth');
const { cacheMiddleware } = require('../middleware/cache');
const logger = require('../utils/logger');

// Middleware para todas as rotas da API
router.use(verificarLogin);

// 📊 Dashboard - Estatísticas (com cache de 5 minutos)
router.get('/dashboard/stats', cacheMiddleware(300), async (req, res) => {
  try {
    // Valores padrão caso as tabelas não existam
    let totalOS = 0, osAbertas = 0, totalPessoas = 0, pessoasAtivas = 0;
    let totalProdutos = 0, produtosBaixoEstoque = 0, faturamento = 0;

    // Total de OS
    try {
      const [osResult] = await db.query('SELECT COUNT(*) as total FROM ordens_servico');
      const [osAbertasResult] = await db.query('SELECT COUNT(*) as abertas FROM ordens_servico WHERE status = "aberta"');
      totalOS = osResult[0].total;
      osAbertas = osAbertasResult[0].abertas;
    } catch (err) {
      logger.warn('Tabela ordens_servico não encontrada ou erro na consulta');
    }
    
    // Total de Pessoas - CORRIGIDO
    try {
      const [pessoasResult] = await db.query('SELECT COUNT(*) as total FROM pessoas');
      const [pessoasAtivasResult] = await db.query('SELECT COUNT(*) as ativas FROM pessoas WHERE status = "ativo" OR status IS NULL');
      totalPessoas = pessoasResult[0].total;
      pessoasAtivas = pessoasAtivasResult[0].ativas;
    } catch (err) {
      logger.warn('Tabela pessoas não encontrada ou erro na consulta');
    }
    
    // Total de Produtos - CORRIGIDO
    try {
      const [produtosResult] = await db.query('SELECT COUNT(*) as total FROM produtos');
      const [produtosBaixoResult] = await db.query('SELECT COUNT(*) as baixo FROM produtos WHERE estoque_atual <= 5');
      totalProdutos = produtosResult[0].total;
      produtosBaixoEstoque = produtosBaixoResult[0].baixo;
    } catch (err) {
      logger.warn('Tabela produtos não encontrada ou erro na consulta');
    }
    
    // Faturamento do mês atual
    try {
      const [faturamentoResult] = await db.query(`
        SELECT COALESCE(SUM(valor_total), 0) as faturamento 
        FROM ordens_servico 
        WHERE MONTH(data_abertura) = MONTH(CURRENT_DATE()) 
        AND YEAR(data_abertura) = YEAR(CURRENT_DATE())
        AND status = 'finalizada'
      `);
      faturamento = faturamentoResult[0].faturamento;
    } catch (err) {
      logger.warn('Erro ao calcular faturamento');
    }

    res.json({
      totalOS,
      osAbertas,
      totalPessoas,
      pessoasAtivas,
      totalProdutos,
      produtosBaixoEstoque,
      faturamentoMes: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(faturamento),
      crescimento: 0 // Simplificado por enquanto
    });

    logger.info('Dashboard stats carregadas', { usuario: req.session.usuario.id });
  } catch (error) {
    logger.error('Erro ao carregar stats do dashboard', { error: error.message });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 🚨 Dashboard - Alertas (com cache de 2 minutos)
router.get('/dashboard/alerts', cacheMiddleware(120), async (req, res) => {
  try {
    const alerts = [];

    // OS vencidas
    try {
      const [osVencidas] = await db.query(`
        SELECT COUNT(*) as count FROM ordens_servico 
        WHERE status = 'aberta' 
        AND data_abertura < DATE_SUB(NOW(), INTERVAL 7 DAY)
      `);

      if (osVencidas[0].count > 0) {
        alerts.push({
          type: 'warning',
          icon: 'exclamation-triangle',
          title: 'OS Vencidas',
          message: `${osVencidas[0].count} ordens de serviço estão vencidas há mais de 7 dias`,
          time: 'Agora'
        });
      }
    } catch (err) {
      logger.warn('Erro ao verificar OS vencidas');
    }

    // Produtos com estoque baixo - CORRIGIDO
    try {
      const [produtosBaixo] = await db.query(`
        SELECT COUNT(*) as count FROM produtos 
        WHERE estoque_atual <= 5
      `);

      if (produtosBaixo[0].count > 0) {
        alerts.push({
          type: 'danger',
          icon: 'box',
          title: 'Estoque Baixo',
          message: `${produtosBaixo[0].count} produtos estão com estoque baixo (≤5 unidades)`,
          time: 'Agora'
        });
      }
    } catch (err) {
      logger.warn('Erro ao verificar estoque baixo');
    }

    // Lançamentos vencidos - CORRIGIDO
    try {
      const [lancamentosVencidos] = await db.query(`
        SELECT COUNT(*) as count FROM financeiro 
        WHERE status = 'pendente' 
        AND vencimento < CURDATE()
      `);

      if (lancamentosVencidos[0].count > 0) {
        alerts.push({
          type: 'danger',
          icon: 'money-bill-wave',
          title: 'Lançamentos Vencidos',
          message: `${lancamentosVencidos[0].count} lançamentos financeiros estão vencidos`,
          time: 'Agora'
        });
      }
    } catch (err) {
      logger.warn('Erro ao verificar lançamentos vencidos');
    }

    res.json(alerts);
  } catch (error) {
    logger.error('Erro ao carregar alertas', { error: error.message });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 📊 OS por Status para gráfico
router.get('/dashboard/os-status', async (req, res) => {
  try {
    const [statusData] = await db.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM ordens_servico 
      GROUP BY status
    `);

    const statusMap = {
      'aberta': 'Abertas',
      'em_andamento': 'Em Andamento', 
      'concluida': 'Finalizadas',
      'cancelada': 'Canceladas'
    };

    const labels = [];
    const data = [];

    // Garantir que todos os status apareçam
    Object.keys(statusMap).forEach(status => {
      const found = statusData.find(s => s.status === status);
      labels.push(statusMap[status]);
      data.push(found ? found.count : 0);
    });

    res.json({ labels, data });
  } catch (error) {
    logger.error('Erro ao carregar status das OS', { error: error.message });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 📊 Faturamento dos últimos meses (formato para gráfico)
router.get('/reports/financial', async (req, res) => {
  try {
    const { months = 6 } = req.query;

    const [faturamento] = await db.query(`
      SELECT 
        DATE_FORMAT(data_abertura, '%Y-%m') as mes,
        SUM(valor_total) as total
      FROM ordens_servico 
      WHERE data_abertura >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
      AND status = 'concluida'
      GROUP BY DATE_FORMAT(data_abertura, '%Y-%m')
      ORDER BY mes
    `, [parseInt(months)]);

    // Gerar labels dos últimos 6 meses
    const labels = [];
    const data = [];
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    for (let i = parseInt(months) - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const mesKey = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
      
      labels.push(meses[date.getMonth()]);
      const found = faturamento.find(f => f.mes === mesKey);
      data.push(found ? found.total : 0);
    }

    res.json({ labels, data });
  } catch (error) {
    logger.error('Erro ao carregar relatório financeiro', { error: error.message });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 📈 Produtos mais vendidos
router.get('/reports/products', async (req, res) => {
  try {
    const [produtos] = await db.query(`
      SELECT 
        p.nome,
        SUM(m.quantidade) as total_vendido
      FROM movimentacoes m
      JOIN produtos p ON m.produto_id = p.id
      WHERE m.tipo = 'saida'
      AND m.data >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY p.id, p.nome
      ORDER BY total_vendido DESC
      LIMIT 10
    `);

    res.json({ 
      labels: produtos.map(p => p.nome),
      data: produtos.map(p => p.total_vendido)
    });
  } catch (error) {
    logger.error('Erro ao carregar produtos mais vendidos', { error: error.message });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
EOF

# 5. Atualizar views/layout.ejs
cat > views/layout.ejs << 'EOF'
<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><%= typeof titulo !== 'undefined' ? titulo : 'NSI Tecnologia' %></title>

  <!-- Estilos principais -->
  <link rel="stylesheet" href="/css/style.css">

  <!-- Font Awesome para ícones -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
</head>
<body>
  <div class="layout" id="layout">
    <!-- 🔄 Botão de Alternância de Modo -->
    <button class="mode-toggle" id="modeToggle" title="Alternar Modo">
      <i class="fas fa-mobile-alt" id="modeIcon"></i>
    </button>

    <!-- 🍔 Menu Hambúrguer para Mobile -->
    <button class="menu-toggle" id="menuToggle" aria-label="Toggle Menu">
      <span></span>
      <span></span>
      <span></span>
    </button>

    <!-- 🌫️ Overlay para Mobile -->
    <div class="sidebar-overlay" id="sidebarOverlay"></div>

    <aside class="sidebar" id="sidebar">
      <div class="sidebar-logo">
        <img src="/img/logo-nsi.png" alt="NSI Tecnologia">
      </div>
      <nav>
        <a href="/dashboard" class="btn"><i class="fas fa-tachometer-alt"></i> Dashboard</a>
        <a href="/pessoas" class="btn"><i class="fas fa-users"></i> Pessoas</a>
        <a href="/estoque" class="btn"><i class="fas fa-boxes"></i> Estoque</a>
        <a href="/movimentacoes" class="btn"><i class="fas fa-exchange-alt"></i> Movimentações</a>
        <a href="/os/listar" class="btn"><i class="fas fa-clipboard-check"></i> Ordem de Serviço</a>
        <a href="/financeiro" class="btn"><i class="fas fa-money-bill-wave"></i> Financeiro</a>
        <a href="/relatorios/listar" class="btn"><i class="fas fa-chart-line"></i> Relatórios</a>
        <a href="/logout" class="btn logout"><i class="fas fa-sign-out-alt"></i> Sair</a>
        
      </nav>
    </aside>

    <main class="container">
      <%- body %>
    </main>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  
  <!-- Scripts de UX/UI -->
  <script src="/js/notifications.js"></script>
  <script src="/js/loading.js"></script>
  <script src="/js/validation.js"></script>
  
  <script>
    // 🔄 Sistema de Alternância de Modo
    document.addEventListener('DOMContentLoaded', function() {
      const modeToggle = document.getElementById('modeToggle');
      const modeIcon = document.getElementById('modeIcon');
      const layout = document.getElementById('layout');
      const menuToggle = document.getElementById('menuToggle');
      const sidebar = document.getElementById('sidebar');
      const overlay = document.getElementById('sidebarOverlay');
      
      // Verificar preferência salva ou detectar dispositivo
      const isMobile = window.innerWidth <= 991;
      const savedMode = localStorage.getItem('layoutMode');
      const currentMode = savedMode || (isMobile ? 'mobile' : 'desktop');
      
      // Aplicar modo inicial
      applyMode(currentMode);
      
      // Botão de alternância de modo
      if (modeToggle && modeIcon) {
        modeToggle.addEventListener('click', function() {
          const currentMode = layout.classList.contains('mobile-mode') ? 'mobile' : 'desktop';
          const newMode = currentMode === 'mobile' ? 'desktop' : 'mobile';
          applyMode(newMode);
          localStorage.setItem('layoutMode', newMode);
        });
      }
      
       // Menu hambúrguer (apenas no modo mobile)
       if (menuToggle && sidebar && overlay) {
         function toggleMenu() {
           if (layout.classList.contains('mobile-mode')) {
             sidebar.classList.toggle('active');
             menuToggle.classList.toggle('active');
             overlay.classList.toggle('active');
           }
         }
        
        function closeMenu() {
          sidebar.classList.remove('active');
          menuToggle.classList.remove('active');
          overlay.classList.remove('active');
        }
        
        menuToggle.addEventListener('click', toggleMenu);
        overlay.addEventListener('click', closeMenu);
        
        // Fechar menu ao clicar em links
        const menuLinks = sidebar.querySelectorAll('a');
        menuLinks.forEach(link => {
          link.addEventListener('click', closeMenu);
        });
      }
      
      // Redimensionar janela
      window.addEventListener('resize', function() {
        if (window.innerWidth > 991 && layout.classList.contains('mobile-mode')) {
          closeMenu();
        }
      });
      
      function applyMode(mode) {
        if (mode === 'mobile') {
          layout.classList.add('mobile-mode');
          modeIcon.className = 'fas fa-desktop';
          modeToggle.title = 'Modo Desktop';
        } else {
          layout.classList.remove('mobile-mode');
          modeIcon.className = 'fas fa-mobile-alt';
          modeToggle.title = 'Modo Mobile';
        }
      }
    });
  </script>
</body>
</html>
EOF

# 6. Verificar sintaxe
echo "🔍 Verificando sintaxe..."
if node -c app.js && node -c routes/api.js; then
    echo "✅ Sintaxe OK"
    
    # 7. Reiniciar
    echo "🔄 Reiniciando..."
    pm2 start app.js --name nsi-tecnologia
    
    # 8. Aguardar e verificar
    sleep 3
    echo "📊 Status:"
    pm2 status
    
    echo ""
    echo "🧪 Testando API..."
    sleep 2
    curl -s http://localhost:61910/api/dashboard/stats | head -c 200
    echo ""
    
else
    echo "❌ Erro de sintaxe - não reiniciando"
    echo "Verifique os logs acima"
fi

echo ""
echo "✅ Correção aplicada!"
echo "🌐 Teste: http://seu-servidor:61910/dashboard"
