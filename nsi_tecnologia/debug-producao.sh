#!/bin/bash

# 🔍 Script de Debug para Produção
# Diagnostica problemas no dashboard

echo "🔍 Iniciando diagnóstico do servidor..."

# 1. Verificar status do PM2
echo "📊 Status do PM2:"
pm2 status

echo ""
echo "📋 Logs recentes:"
pm2 logs nsi-tecnologia --lines 10

echo ""
echo "🗂️ Verificando arquivos:"
echo "app.js existe: $(test -f app.js && echo '✅ SIM' || echo '❌ NÃO')"
echo "routes/api.js existe: $(test -f routes/api.js && echo '✅ SIM' || echo '❌ NÃO')"
echo "views/dashboard.ejs existe: $(test -f views/dashboard.ejs && echo '✅ SIM' || echo '❌ NÃO')"

echo ""
echo "🔧 Verificando app.js:"
if grep -q "const apiRoutes" app.js; then
    echo "✅ Rota API configurada"
else
    echo "❌ Rota API NÃO configurada"
fi

if grep -q "app.get('/dashboard'" app.js; then
    echo "✅ Rota Dashboard configurada"
else
    echo "❌ Rota Dashboard NÃO configurada"
fi

echo ""
echo "🗄️ Testando banco de dados:"
node -e "
const db = require('./db');
console.log('Testando conexão...');
db.query('SELECT COUNT(*) as total FROM pessoas')
  .then(r => console.log('✅ Pessoas:', r[0][0].total))
  .catch(e => console.log('❌ Erro pessoas:', e.message));

db.query('SELECT COUNT(*) as total FROM produtos')
  .then(r => console.log('✅ Produtos:', r[0][0].total))
  .catch(e => console.log('❌ Erro produtos:', e.message));

db.query('SELECT COUNT(*) as total FROM ordens_servico')
  .then(r => console.log('✅ OS:', r[0][0].total))
  .catch(e => console.log('❌ Erro OS:', e.message));
"

echo ""
echo "🌐 Testando API:"
curl -s http://localhost:61910/api/dashboard/stats 2>/dev/null | head -c 100
echo ""

echo ""
echo "📝 Verificando sintaxe:"
node -c app.js && echo "✅ app.js OK" || echo "❌ app.js ERRO"
test -f routes/api.js && (node -c routes/api.js && echo "✅ api.js OK" || echo "❌ api.js ERRO") || echo "❌ api.js NÃO EXISTE"

echo ""
echo "🔍 Diagnóstico concluído!"
