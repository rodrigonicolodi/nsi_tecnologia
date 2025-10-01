#!/bin/bash

# 🔍 Verificar configuração do app.js

echo "🔍 Verificando app.js..."

echo "1. Verificando se a rota da API está configurada:"
if grep -q "const apiRoutes" app.js; then
    echo "✅ const apiRoutes encontrado"
else
    echo "❌ const apiRoutes NÃO encontrado"
fi

if grep -q "app.use('/api'" app.js; then
    echo "✅ app.use('/api') encontrado"
else
    echo "❌ app.use('/api') NÃO encontrado"
fi

echo ""
echo "2. Verificando se a rota do dashboard está configurada:"
if grep -q "app.get('/dashboard'" app.js; then
    echo "✅ app.get('/dashboard') encontrado"
else
    echo "❌ app.get('/dashboard') NÃO encontrado"
fi

echo ""
echo "3. Verificando sintaxe do app.js:"
if node -c app.js; then
    echo "✅ app.js sem erros de sintaxe"
else
    echo "❌ app.js com erros de sintaxe"
fi

echo ""
echo "4. Verificando sintaxe do routes/api.js:"
if node -c routes/api.js; then
    echo "✅ routes/api.js sem erros de sintaxe"
else
    echo "❌ routes/api.js com erros de sintaxe"
fi

echo ""
echo "5. Testando importação do módulo:"
node -e "
try {
  const apiRoutes = require('./routes/api');
  console.log('✅ Módulo api.js carregado com sucesso');
} catch (e) {
  console.log('❌ Erro ao carregar api.js:', e.message);
}
"

echo ""
echo "6. Verificando se o servidor está rodando:"
pm2 status
