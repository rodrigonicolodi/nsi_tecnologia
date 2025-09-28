// 📊 Middleware de Monitoramento de Performance
const logger = require('../utils/logger');

// Middleware para medir tempo de resposta
const performanceMonitor = (req, res, next) => {
  const startTime = Date.now();
  const startMemory = process.memoryUsage();

  // Interceptar res.end para medir performance
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const endTime = Date.now();
    const endMemory = process.memoryUsage();
    
    const responseTime = endTime - startTime;
    const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;
    
    // Log de performance
    logger.info('Performance metrics', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      memoryDelta: `${Math.round(memoryDelta / 1024 / 1024 * 100) / 100}MB`,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });

    // Alertas de performance
    if (responseTime > 5000) {
      logger.warn('Slow response detected', {
        url: req.originalUrl,
        responseTime: `${responseTime}ms`
      });
    }

    if (memoryDelta > 50 * 1024 * 1024) { // 50MB
      logger.warn('High memory usage detected', {
        url: req.originalUrl,
        memoryDelta: `${Math.round(memoryDelta / 1024 / 1024 * 100) / 100}MB`
      });
    }

    // Adicionar headers de performance apenas se ainda não foram enviados
    if (!res.headersSent) {
      res.set({
        'X-Response-Time': `${responseTime}ms`,
        'X-Memory-Usage': `${Math.round(memoryDelta / 1024 / 1024 * 100) / 100}MB`
      });
    }

    originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Middleware para monitorar queries do banco
const dbPerformanceMonitor = (req, res, next) => {
  const originalQuery = require('../db').query;
  const db = require('../db');
  
  // Interceptar queries do banco
  db.query = function(sql, params) {
    const startTime = Date.now();
    
    return originalQuery.call(this, sql, params).then(result => {
      const endTime = Date.now();
      const queryTime = endTime - startTime;
      
      // Log de queries lentas
      if (queryTime > 1000) {
        logger.warn('Slow database query detected', {
          sql: sql.substring(0, 100) + '...',
          queryTime: `${queryTime}ms`,
          url: req.originalUrl
        });
      }
      
      return result;
    });
  };
  
  next();
};

// Middleware para estatísticas de uso
const usageStats = (req, res, next) => {
  // Incrementar contador de requests
  if (!global.usageStats) {
    global.usageStats = {
      totalRequests: 0,
      requestsByMethod: {},
      requestsByRoute: {},
      errors: 0,
      startTime: Date.now()
    };
  }

  global.usageStats.totalRequests++;
  
  const method = req.method;
  const route = req.route ? req.route.path : req.originalUrl;
  
  // Contar por método
  global.usageStats.requestsByMethod[method] = 
    (global.usageStats.requestsByMethod[method] || 0) + 1;
  
  // Contar por rota
  global.usageStats.requestsByRoute[route] = 
    (global.usageStats.requestsByRoute[route] || 0) + 1;

  // Interceptar erros
  const originalJson = res.json;
  res.json = function(data) {
    if (res.statusCode >= 400) {
      global.usageStats.errors++;
    }
    return originalJson.call(this, data);
  };

  next();
};

// Middleware para health check
const healthCheck = (req, res, next) => {
  if (req.path === '/health') {
    const uptime = process.uptime();
    const memory = process.memoryUsage();
    const usageStats = global.usageStats || {};
    
    return res.json({
      status: 'healthy',
      uptime: `${Math.floor(uptime / 60)} minutes`,
      memory: {
        used: `${Math.round(memory.heapUsed / 1024 / 1024)}MB`,
        total: `${Math.round(memory.heapTotal / 1024 / 1024)}MB`,
        external: `${Math.round(memory.external / 1024 / 1024)}MB`
      },
      stats: {
        totalRequests: usageStats.totalRequests || 0,
        errors: usageStats.errors || 0,
        errorRate: usageStats.totalRequests ? 
          `${Math.round((usageStats.errors / usageStats.totalRequests) * 100)}%` : '0%'
      },
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

// Middleware para otimização de queries
const queryOptimizer = (req, res, next) => {
  // Adicionar hints de otimização baseados na rota
  if (req.path.includes('/api/dashboard/stats')) {
    req.queryOptimization = {
      useCache: true,
      maxAge: 300 // 5 minutos
    };
  }
  
  if (req.path.includes('/pessoas') && req.method === 'GET') {
    req.queryOptimization = {
      useCache: true,
      maxAge: 60 // 1 minuto
    };
  }
  
  next();
};

module.exports = {
  performanceMonitor,
  dbPerformanceMonitor,
  usageStats,
  healthCheck,
  queryOptimizer
};
