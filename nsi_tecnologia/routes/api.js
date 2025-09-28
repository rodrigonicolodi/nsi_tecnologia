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
    
    // Total de Pessoas
    try {
      const [pessoasResult] = await db.query('SELECT COUNT(*) as total FROM pessoas');
      const [pessoasAtivasResult] = await db.query('SELECT COUNT(*) as ativas FROM pessoas WHERE ativo = true');
      totalPessoas = pessoasResult[0].total;
      pessoasAtivas = pessoasAtivasResult[0].ativas;
    } catch (err) {
      logger.warn('Tabela pessoas não encontrada ou erro na consulta');
    }
    
    // Total de Produtos
    try {
      const [produtosResult] = await db.query('SELECT COUNT(*) as total FROM produtos');
      const [produtosBaixoResult] = await db.query('SELECT COUNT(*) as baixo FROM produtos WHERE estoque_atual < estoque_minimo');
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

    // Produtos com estoque baixo
    try {
      const [produtosBaixo] = await db.query(`
        SELECT COUNT(*) as count FROM produtos 
        WHERE estoque_atual < estoque_minimo
      `);

      if (produtosBaixo[0].count > 0) {
        alerts.push({
          type: 'danger',
          icon: 'box',
          title: 'Estoque Baixo',
          message: `${produtosBaixo[0].count} produtos estão com estoque abaixo do mínimo`,
          time: 'Agora'
        });
      }
    } catch (err) {
      logger.warn('Erro ao verificar estoque baixo');
    }

    // Lançamentos vencidos
    try {
      const [lancamentosVencidos] = await db.query(`
        SELECT COUNT(*) as count FROM lancamentos_financeiros 
        WHERE status = 'pendente' 
        AND data_vencimento < CURDATE()
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

// 👥 Pessoas - Lista
router.get('/pessoas', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let sql = 'SELECT * FROM pessoas WHERE 1=1';
    const params = [];

    if (search) {
      sql += ' AND (nome LIKE ? OR email LIKE ? OR telefone LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY nome LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [pessoas] = await db.query(sql, params);

    // Contar total
    let countSql = 'SELECT COUNT(*) as total FROM pessoas WHERE 1=1';
    const countParams = [];

    if (search) {
      countSql += ' AND (nome LIKE ? OR email LIKE ? OR telefone LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const [countResult] = await db.query(countSql, countParams);

    res.json({
      pessoas,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    logger.error('Erro ao listar pessoas via API', { error: error.message });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 📋 OS - Lista
router.get('/os', async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '' } = req.query;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT os.*, s.nome as solicitante, r.nome as responsavel
      FROM ordens_servico os
      JOIN pessoas s ON os.solicitante_id = s.id
      JOIN pessoas r ON os.responsavel_id = r.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ' AND os.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY os.data_abertura DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [os] = await db.query(sql, params);

    res.json({ os });
  } catch (error) {
    logger.error('Erro ao listar OS via API', { error: error.message });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 📊 Relatórios - Dados para gráficos
router.get('/reports/financial', async (req, res) => {
  try {
    const { months = 6 } = req.query;

    const [faturamento] = await db.query(`
      SELECT 
        DATE_FORMAT(data_abertura, '%Y-%m') as mes,
        SUM(valor_total) as total
      FROM ordens_servico 
      WHERE data_abertura >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
      AND status = 'finalizada'
      GROUP BY DATE_FORMAT(data_abertura, '%Y-%m')
      ORDER BY mes
    `, [parseInt(months)]);

    res.json({ faturamento });
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

    res.json({ produtos });
  } catch (error) {
    logger.error('Erro ao carregar produtos mais vendidos', { error: error.message });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
