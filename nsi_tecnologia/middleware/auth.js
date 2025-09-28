// 🔐 Middleware de Autenticação Global
const verificarLogin = (req, res, next) => {
  if (req.session && req.session.usuario) {
    return next();
  }
  return res.redirect('/login');
};

// 🔐 Middleware para verificar se é admin
const somenteAdmin = (req, res, next) => {
  if (req.session.usuario && req.session.usuario.nivel === 'admin') {
    return next();
  }
  return res.redirect('/login');
};

// 🔐 Middleware para verificar se é admin ou técnico
const adminOuTecnico = (req, res, next) => {
  if (req.session.usuario && 
      (req.session.usuario.nivel === 'admin' || req.session.usuario.nivel === 'tecnico')) {
    return next();
  }
  return res.redirect('/login');
};

// 🔐 Middleware para verificar se usuário está ativo
const usuarioAtivo = (req, res, next) => {
  if (req.session.usuario && req.session.usuario.ativo !== false) {
    return next();
  }
  req.session.destroy();
  return res.redirect('/login?erro=Usuário inativo');
};

module.exports = {
  verificarLogin,
  somenteAdmin,
  adminOuTecnico,
  usuarioAtivo
};
