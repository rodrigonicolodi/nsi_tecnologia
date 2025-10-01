#!/bin/bash

# 🔄 Comando para reiniciar o sistema após upload de arquivos
# Execute sempre após enviar arquivos para produção

echo "🔄 Reiniciando sistema..."

# 1. Parar todos os processos PM2
pm2 stop all

# 2. Limpar cache do PM2 (opcional)
pm2 flush

# 3. Verificar sintaxe dos arquivos principais
echo "🔍 Verificando sintaxe..."
if node -c app.js; then
    echo "✅ app.js OK"
else
    echo "❌ Erro em app.js"
    exit 1
fi

if [ -f "routes/api.js" ]; then
    if node -c routes/api.js; then
        echo "✅ routes/api.js OK"
    else
        echo "❌ Erro em routes/api.js"
        exit 1
    fi
fi

# 4. Reiniciar o serviço
echo "🚀 Iniciando serviço..."
pm2 start app.js --name nsi-tecnologia

# 5. Aguardar inicialização
sleep 3

# 6. Verificar status
echo "📊 Status:"
pm2 status

# 7. Mostrar logs recentes
echo ""
echo "📋 Logs recentes:"
pm2 logs nsi-tecnologia --lines 5

# 8. Testar se está respondendo
echo ""
echo "🧪 Testando resposta..."
if curl -s http://localhost:61910 > /dev/null; then
    echo "✅ Sistema respondendo"
else
    echo "❌ Sistema não está respondendo"
fi

echo ""
echo "✅ Reinicialização concluída!"
echo "🌐 Acesse: http://seu-servidor:61910"
