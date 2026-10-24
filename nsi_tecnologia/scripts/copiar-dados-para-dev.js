// Copia os DADOS de uma exportação do phpMyAdmin (estrutura + dados) para o BANCO DE TESTE.
// Apaga o conteúdo atual das tabelas do banco de teste e insere os dados do arquivo.
// Só funciona se o .env apontar para um banco cujo nome termina em "_dev":
// nunca roda contra o banco de produção.
//
// Uso (na pasta nsi_tecnologia):
//   node scripts/copiar-dados-para-dev.js "C:\Users\...\Downloads\rodri6000_nsi_tecnologia.sql"
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const bancoAtual = process.env.DB_NAME || '';
if (!bancoAtual.endsWith('_dev')) {
  console.error(`❌ Parado: o .env aponta para o banco "${bancoAtual}", que não termina em "_dev".`);
  console.error('   Este script só altera o banco de teste.');
  process.exit(1);
}

const arquivo = process.argv[2];
if (!arquivo || !fs.existsSync(arquivo)) {
  console.error('❌ Informe o caminho do arquivo .sql exportado da produção.');
  process.exit(1);
}

// Separa só os comandos INSERT (cada um termina numa linha que acaba em ";")
const inserts = [];
let atual = null;
for (const linha of fs.readFileSync(arquivo, 'utf8').split(/\r?\n/)) {
  if (atual === null && /^INSERT INTO/i.test(linha)) atual = [];
  if (atual !== null) {
    atual.push(linha);
    if (/;\s*$/.test(linha)) {
      inserts.push(atual.join('\n'));
      atual = null;
    }
  }
}
const tabelas = [...new Set(inserts.map(sql => sql.match(/^INSERT INTO `([^`]+)`/i)[1]))];
if (inserts.length === 0) {
  console.error('❌ O arquivo não tem dados (nenhum INSERT).');
  process.exit(1);
}

const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: bancoAtual,
    charset: 'utf8mb4',
    multipleStatements: true
  });
  try {
    const [[{ banco }]] = await conn.query('SELECT DATABASE() AS banco');
    if (!banco.endsWith('_dev')) throw new Error(`conectado em "${banco}", que não é banco de teste`);

    console.log(`Banco de teste: ${banco}`);
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const tabela of tabelas) await conn.query(`DELETE FROM \`${tabela}\``);
    for (const sql of inserts) await conn.query(sql);
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');

    for (const tabela of tabelas) {
      const [[{ total }]] = await conn.query(`SELECT COUNT(*) AS total FROM \`${tabela}\``);
      console.log(`  ${tabela}: ${total} linha(s)`);
    }
    console.log('✅ Dados copiados para o banco de teste.');
  } finally {
    await conn.end();
  }
}

main().catch(err => {
  console.error('❌ Erro:', err.message);
  process.exitCode = 1;
});
