const mysql = require('mysql2/promise');
require('dotenv').config();

// Verificar se as variáveis de ambiente estão configuradas
if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
  console.error('❌ ERRO: Variáveis de ambiente do banco não configuradas!');
  console.error('Crie o arquivo .env baseado no config.env.example');
  process.exit(1);
}

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = db;