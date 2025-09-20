const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: 'nsi_tecnologia.mysql.dbaas.com.br',
  user: 'nsi_tecnologia',
  password: 'Niquito@285879',
  database: 'nsi_tecnologia'
});

module.exports = db;