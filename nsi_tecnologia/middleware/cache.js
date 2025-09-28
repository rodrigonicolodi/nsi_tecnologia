// 🚀 Middleware de Cache para Performance
const NodeCache = require('node-cache');

// Configuração do cache
const cache = new NodeCache({
  stdTTL: 300, // 5 minutos por padrão
  checkperiod: 120, // Verificar expiração a cada 2 minutos
  useClones: false // Não clonar objetos para melhor performance
});

// Middleware de cache para rotas
const cacheMiddleware = (ttl = 300) => {
  return (req, res, next) => {
    // Gerar chave única baseada na URL e parâmetros
    const key = `${req.method}:${req.originalUrl}:${JSON.stringify(req.query)}`;
    
    // Verificar se existe no cache
    const cached = cache.get(key);
    if (cached) {
      console.log(`📦 Cache HIT: ${key}`);
      return res.json(cached);
    }

    // Interceptar res.json para salvar no cache
    const originalJson = res.json;
    res.json = function(data) {
      // Salvar no cache apenas para GET requests
      if (req.method === 'GET') {
        cache.set(key, data, ttl);
        console.log(`💾 Cache SET: ${key} (TTL: ${ttl}s)`);
      }
      return originalJson.call(this, data);
    };

    next();
  };
};

// Middleware para limpar cache
const clearCache = (pattern = null) => {
  if (pattern) {
    const keys = cache.keys();
    const regex = new RegExp(pattern);
    const keysToDelete = keys.filter(key => regex.test(key));
    cache.del(keysToDelete);
    console.log(`🗑️ Cache cleared for pattern: ${pattern}`);
  } else {
    cache.flushAll();
    console.log('🗑️ All cache cleared');
  }
};

// Middleware para invalidar cache específico
const invalidateCache = (pattern) => {
  return (req, res, next) => {
    // Interceptar resposta para limpar cache relacionado
    const originalJson = res.json;
    res.json = function(data) {
      clearCache(pattern);
      return originalJson.call(this, data);
    };
    next();
  };
};

// Estatísticas do cache
const getCacheStats = () => {
  return {
    keys: cache.keys().length,
    hits: cache.getStats().hits,
    misses: cache.getStats().misses,
    ksize: cache.getStats().ksize,
    vsize: cache.getStats().vsize
  };
};

// Middleware para estatísticas de cache
const cacheStats = (req, res, next) => {
  if (req.path === '/api/cache/stats') {
    return res.json(getCacheStats());
  }
  next();
};

module.exports = {
  cache,
  cacheMiddleware,
  clearCache,
  invalidateCache,
  getCacheStats,
  cacheStats
};



