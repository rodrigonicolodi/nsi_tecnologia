const mysql = require('mysql2/promise');
require('dotenv').config();

const db = mysql.createPool({
  host: process.env.DB_HOST || 'sistema.nsitecnologia.com.br',
  user: process.env.DB_USER || 'rodri6000_nsi_tecnologia',
  password: process.env.DB_PASSWORD || 'RRn@285879',
  database: process.env.DB_NAME || 'rodri6000_nsi_tecnologia',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = db;