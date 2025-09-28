// 🚨 Middleware de Tratamento de Erros Centralizado
const errorHandler = (err, req, res, next) => {
  console.error('🚨 Erro capturado:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
    user: req.session?.usuario?.id || 'não logado'
  });

  // Erros de banco de dados
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).render('erro', {
      titulo: 'Erro de Referência',
      mensagem: 'Registro referenciado não existe no banco de dados.',
      layout: 'layout'
    });
  }

  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(400).render('erro', {
      titulo: 'Registro Duplicado',
      mensagem: 'Este registro já existe no sistema.',
      layout: 'layout'
    });
  }

  if (err.code === 'ER_ACCESS_DENIED_ERROR') {
    return res.status(500).render('erro', {
      titulo: 'Erro de Conexão',
      mensagem: 'Erro de conexão com o banco de dados. Tente novamente.',
      layout: 'layout'
    });
  }

  // Erro de validação
  if (err.name === 'ValidationError') {
    return res.status(400).render('erro', {
      titulo: 'Erro de Validação',
      mensagem: err.message,
      layout: 'layout'
    });
  }

  // Erro 404
  if (err.status === 404) {
    return res.status(404).render('404', {
      titulo: 'Página não encontrada',
      layout: false
    });
  }

  // Erro genérico
  const isDevelopment = process.env.NODE_ENV === 'development';
  res.status(err.status || 500).render('erro', {
    titulo: 'Erro Interno',
    mensagem: isDevelopment ? err.message : 'Ocorreu um erro interno. Tente novamente.',
    stack: isDevelopment ? err.stack : null,
    layout: 'layout'
  });
};

// 🚨 Middleware para capturar rotas não encontradas
const notFound = (req, res, next) => {
  const error = new Error(`Rota não encontrada: ${req.originalUrl}`);
  error.status = 404;
  next(error);
};

module.exports = {
  errorHandler,
  notFound
};




