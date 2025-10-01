#!/bin/bash

# 🔧 Atualizar apenas routes/api.js
# Execute no servidor via SSH

echo "🔧 Atualizando routes/api.js..."

# 1. Parar serviço
pm2 stop nsi-tecnologia

# 2. Fazer backup do api.js atual
cp routes/api.js routes/api.js.backup.$(date +%Y%m%d-%H%M)

# 3. Substituir routes/api.js com as correções
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

# 4. Verificar sintaxe
echo "🔍 Verificando sintaxe..."
if node -c routes/api.js; then
    echo "✅ Sintaxe OK"
    
    # 5. Reiniciar
    echo "🔄 Reiniciando..."
    pm2 start app.js --name nsi-tecnologia
    
    # 6. Aguardar e verificar
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
    echo "Restaurando backup..."
    cp routes/api.js.backup.* routes/api.js 2>/dev/null || true
fi

echo ""
echo "✅ API atualizada!"
echo "🌐 Teste: http://seu-servidor:61910/dashboard"
