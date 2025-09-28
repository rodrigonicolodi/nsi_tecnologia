const mysql = require('mysql2/promise');

// Configurações do banco de dados
const db = mysql.createPool({
  host: 'sistema.nsitecnologia.com.br',
  user: 'rodri6000_nsi_tecnologia',
  password: 'RRn@285879',
  database: 'rodri6000_nsi_tecnologia',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = db;