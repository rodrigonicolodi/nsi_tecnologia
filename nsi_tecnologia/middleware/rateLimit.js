// 🚦 Middleware de Rate Limiting
const rateLimit = require('express-rate-limit');

// Rate limiting geral
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // máximo 1000 requests por IP por janela
  message: {
    error: 'Muitas requisições. Tente novamente em 15 minutos.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Pular rate limiting para requests de desenvolvimento
    return process.env.NODE_ENV === 'development' && req.ip === '127.0.0.1';
  }
});

// Rate limiting para API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP por janela
  message: {
    error: 'Limite de requisições da API excedido. Tente novamente em 15 minutos.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting para login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 50, // máximo 50 tentativas de login por IP (aumentado para produção)
  message: {
    error: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Não contar requests bem-sucedidos
  skip: (req) => {
    // Pular rate limiting para desenvolvimento local
    return false; // Sempre aplicar rate limiting
  }
});

// Rate limiting para PDF generation
const pdfLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 10, // máximo 10 PDFs por IP por janela
  message: {
    error: 'Limite de geração de PDF excedido. Tente novamente em 5 minutos.',
    retryAfter: 5 * 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting para uploads
const uploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 20, // máximo 20 uploads por IP por janela
  message: {
    error: 'Limite de uploads excedido. Tente novamente em 10 minutos.',
    retryAfter: 10 * 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting para buscas
const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 30, // máximo 30 buscas por IP por minuto
  message: {
    error: 'Muitas buscas. Tente novamente em 1 minuto.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Middleware para adicionar headers de rate limit
const addRateLimitHeaders = (req, res, next) => {
  const limiter = req.rateLimit;
  if (limiter) {
    res.set({
      'X-RateLimit-Limit': limiter.limit,
      'X-RateLimit-Remaining': limiter.remaining,
      'X-RateLimit-Reset': new Date(limiter.resetTime).toISOString()
    });
  }
  next();
};

module.exports = {
  generalLimiter,
  apiLimiter,
  loginLimiter,
  pdfLimiter,
  uploadLimiter,
  searchLimiter,
  addRateLimitHeaders
};
