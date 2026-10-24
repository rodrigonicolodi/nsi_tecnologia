// Cria um usuário admin no BANCO DE TESTE (para conseguir fazer login no PC).
// Só funciona se o .env apontar para um banco cujo nome termina em "_dev":
// nunca roda contra o banco de produção.
//
// Uso (na pasta nsi_tecnologia):  node scripts/criar-usuario-dev.js
const path = require('path');
const readline = require('readline/promises');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const bancoAtual = process.env.DB_NAME || '';
if (!bancoAtual.endsWith('_dev')) {
  console.error(`❌ Parado: o .env aponta para o banco "${bancoAtual}", que não termina em "_dev".`);
  console.error('   Este script só cria usuários no banco de teste.');
  process.exit(1);
}

const bcrypt = require('bcryptjs');
const db = require('../db');

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  console.log(`Banco de teste: ${bancoAtual}`);
  const nome = (await rl.question('Nome: ')).trim();
  const email = (await rl.question('E-mail (para o login): ')).trim();
  const senha = await rl.question('Senha (só para o banco de teste): ');
  rl.close();

  if (!nome || !email || senha.length < 6) {
    console.error('❌ Preencha nome e e-mail, e use uma senha com pelo menos 6 caracteres.');
    process.exit(1);
  }

  const hash = await bcrypt.hash(senha, 10);
  await db.query(
    'INSERT INTO usuarios (nome, email, senha, nivel, ativo) VALUES (?, ?, ?, ?, 1)',
    [nome, email, hash, 'admin']
  );
  console.log(`✅ Usuário admin "${email}" criado no banco ${bancoAtual}.`);
}

main()
  .catch(err => {
    console.error('❌ Erro:', err.code === 'ER_DUP_ENTRY' ? 'esse e-mail já existe no banco de teste.' : err.message);
    process.exitCode = 1;
  })
  .finally(() => db.end());
