#!/bin/bash

# 🚀 Patch Rápido para Produção
# Corrige apenas os gráficos do dashboard

echo "🔧 Aplicando patch no servidor..."

# 1. Parar o serviço
echo "⏹️ Parando PM2..."
pm2 stop nsi-tecnologia

# 2. Backup rápido
echo "💾 Backup..."
mkdir -p backup-$(date +%Y%m%d-%H%M)
cp app.js backup-$(date +%Y%m%d-%H%M)/ 2>/dev/null || true
cp routes/api.js backup-$(date +%Y%m%d-%H%M)/ 2>/dev/null || true

# 3. Verificar se arquivo api.js existe
if [ ! -f "routes/api.js" ]; then
    echo "📝 Criando routes/api.js..."
    mkdir -p routes
    cat > routes/api.js << 'EOF'
// 🔌 API REST para Integrações
const express = require('express');
const router = express.Router();
const db = require('../db');
const { verificarLogin } = require('../middleware/auth');

// Middleware para todas as rotas da API
router.use(verificarLogin);

// 📊 Dashboard - Estatísticas
router.get('/dashboard/stats', async (req, res) => {
  try {
    let totalOS = 0, osAbertas = 0, totalPessoas = 0, pessoasAtivas = 0;
    let totalProdutos = 0, produtosBaixoEstoque = 0, faturamento = 0;

    // Total de OS
    try {
      const [osResult] = await db.query('SELECT COUNT(*) as total FROM ordens_servico');
      const [osAbertasResult] = await db.query('SELECT COUNT(*) as abertas FROM ordens_servico WHERE status = "aberta"');
      totalOS = osResult[0].total;
      osAbertas = osAbertasResult[0].abertas;
    } catch (err) {
      console.warn('Tabela ordens_servico não encontrada ou erro na consulta');
    }
    
    // Total de Pessoas - CORRIGIDO
    try {
      const [pessoasResult] = await db.query('SELECT COUNT(*) as total FROM pessoas');
      const [pessoasAtivasResult] = await db.query('SELECT COUNT(*) as ativas FROM pessoas WHERE status = "ativo" OR status IS NULL');
      totalPessoas = pessoasResult[0].total;
      pessoasAtivas = pessoasAtivasResult[0].ativas;
    } catch (err) {
      console.warn('Tabela pessoas não encontrada ou erro na consulta');
    }
    
    // Total de Produtos - CORRIGIDO
    try {
      const [produtosResult] = await db.query('SELECT COUNT(*) as total FROM produtos');
      const [produtosBaixoResult] = await db.query('SELECT COUNT(*) as baixo FROM produtos WHERE estoque_atual <= 5');
      totalProdutos = produtosResult[0].total;
      produtosBaixoEstoque = produtosBaixoResult[0].baixo;
    } catch (err) {
      console.warn('Tabela produtos não encontrada ou erro na consulta');
    }
    
    // Faturamento do mês atual
    try {
      const [faturamentoResult] = await db.query(`
        SELECT COALESCE(SUM(valor_total), 0) as faturamento 
        FROM ordens_servico 
        WHERE MONTH(data_abertura) = MONTH(CURRENT_DATE()) 
        AND YEAR(data_abertura) = YEAR(CURRENT_DATE())
        AND status = 'concluida'
      `);
      faturamento = faturamentoResult[0].faturamento;
    } catch (err) {
      console.warn('Erro ao calcular faturamento');
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
      crescimento: 0
    });

  } catch (error) {
    console.error('Erro ao carregar stats do dashboard', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 🚨 Dashboard - Alertas
router.get('/dashboard/alerts', async (req, res) => {
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
          message: \`\${osVencidas[0].count} ordens de serviço estão vencidas há mais de 7 dias\`,
          time: 'Agora'
        });
      }
    } catch (err) {
      console.warn('Erro ao verificar OS vencidas');
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
          message: \`\${produtosBaixo[0].count} produtos estão com estoque baixo (≤5 unidades)\`,
          time: 'Agora'
        });
      }
    } catch (err) {
      console.warn('Erro ao verificar estoque baixo');
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
          message: \`\${lancamentosVencidos[0].count} lançamentos financeiros estão vencidos\`,
          time: 'Agora'
        });
      }
    } catch (err) {
      console.warn('Erro ao verificar lançamentos vencidos');
    }

    res.json(alerts);
  } catch (error) {
    console.error('Erro ao carregar alertas', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
EOF
fi

# 4. Adicionar rota da API no app.js (se não existir)
echo "🔧 Verificando app.js..."
if ! grep -q "const apiRoutes" app.js; then
    echo "📝 Adicionando rota da API no app.js..."
    # Adicionar após as outras rotas
    sed -i '/const pdfRoutes = require/a const apiRoutes = require('\''./routes/api'\'');' app.js
    sed -i '/app.use('\''\/pdf'\'', pdfRoutes);/a app.use('\''/api'\'', apiRoutes);' app.js
fi

# 5. Adicionar rota do dashboard (se não existir)
if ! grep -q "app.get('\''/dashboard'\''" app.js; then
    echo "📝 Adicionando rota do dashboard..."
    cat >> app.js << 'EOF'

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
EOF
fi

# 6. Reiniciar o serviço
echo "🔄 Reiniciando PM2..."
pm2 start app.js --name nsi-tecnologia

# 7. Verificar status
echo "📊 Status:"
pm2 status

echo "✅ Patch aplicado com sucesso!"
echo "🌐 Teste: http://seu-servidor:61910/dashboard"
