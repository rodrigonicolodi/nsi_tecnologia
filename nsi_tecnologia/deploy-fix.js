#!/usr/bin/env node

/**
 * Script para fazer deploy das correções do dashboard
 * Executa no servidor de produção
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando deploy das correções...');

try {
  // 1. Parar o processo PM2
  console.log('⏹️ Parando processo PM2...');
  try {
    execSync('pm2 stop nsi-tecnologia', { stdio: 'inherit' });
  } catch (err) {
    console.log('⚠️ Processo já estava parado ou não existe');
  }

  // 2. Fazer backup dos arquivos modificados
  console.log('💾 Fazendo backup dos arquivos...');
  const filesToBackup = [
    'app.js',
    'routes/api.js',
    'views/dashboard.ejs',
    'views/layout.ejs'
  ];

  const backupDir = `backup-${new Date().toISOString().split('T')[0]}`;
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }

  filesToBackup.forEach(file => {
    if (fs.existsSync(file)) {
      fs.copyFileSync(file, path.join(backupDir, file));
      console.log(`✅ Backup: ${file}`);
    }
  });

  // 3. Instalar dependências se necessário
  console.log('📦 Verificando dependências...');
  try {
    execSync('npm install', { stdio: 'inherit' });
  } catch (err) {
    console.log('⚠️ Erro ao instalar dependências:', err.message);
  }

  // 4. Reiniciar o processo PM2
  console.log('🔄 Reiniciando processo PM2...');
  execSync('pm2 start app.js --name nsi-tecnologia', { stdio: 'inherit' });

  // 5. Verificar status
  console.log('📊 Verificando status...');
  execSync('pm2 status', { stdio: 'inherit' });

  console.log('✅ Deploy concluído com sucesso!');
  console.log('🌐 Acesse: http://seu-servidor:61910/dashboard');

} catch (error) {
  console.error('❌ Erro no deploy:', error.message);
  process.exit(1);
}
