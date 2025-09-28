// ✅ Sistema de Validação Centralizado
const validarCamposObrigatorios = (campos) => {
  return (req, res, next) => {
    const erros = [];
    
    campos.forEach(campo => {
      if (!req.body[campo] || req.body[campo].toString().trim() === '') {
        erros.push(`Campo '${campo}' é obrigatório`);
      }
    });

    if (erros.length > 0) {
      return res.status(400).json({
        sucesso: false,
        erros: erros
      });
    }

    next();
  };
};

// ✅ Validar email
const validarEmail = (req, res, next) => {
  const email = req.body.email;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (email && !emailRegex.test(email)) {
    return res.status(400).json({
      sucesso: false,
      erros: ['Email inválido']
    });
  }
  
  next();
};

// ✅ Validar valores numéricos
const validarNumerico = (campos) => {
  return (req, res, next) => {
    const erros = [];
    
    campos.forEach(campo => {
      const valor = req.body[campo];
      if (valor && isNaN(parseFloat(valor))) {
        erros.push(`Campo '${campo}' deve ser numérico`);
      }
    });

    if (erros.length > 0) {
      return res.status(400).json({
        sucesso: false,
        erros: erros
      });
    }

    next();
  };
};

// ✅ Sanitizar strings
const sanitizarStrings = (req, res, next) => {
  Object.keys(req.body).forEach(key => {
    if (typeof req.body[key] === 'string') {
      req.body[key] = req.body[key].trim();
    }
  });
  next();
};

// ✅ Validar data
const validarData = (campo) => {
  return (req, res, next) => {
    const data = req.body[campo];
    if (data && isNaN(Date.parse(data))) {
      return res.status(400).json({
        sucesso: false,
        erros: [`Campo '${campo}' deve ser uma data válida`]
      });
    }
    next();
  };
};

module.exports = {
  validarCamposObrigatorios,
  validarEmail,
  validarNumerico,
  sanitizarStrings,
  validarData
};




