@echo off
echo 🔧 Parando todos os processos Node.js...
taskkill /f /im node.exe 2>nul

echo ⏳ Aguardando liberação da porta...
timeout /t 3 /nobreak >nul

echo 🚀 Iniciando servidor NSI Tecnologia...
npm run dev

pause



