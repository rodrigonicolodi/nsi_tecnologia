const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: 'sistema.nsitecnologia.com.br',
  user: 'rodri6000_nsi_tecnologia',
  password: 'RRn@285879',
  database: 'rodri6000_nsi_tecnologia'
});

module.exports = db;