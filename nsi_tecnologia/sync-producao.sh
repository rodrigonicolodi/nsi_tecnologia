#!/bin/bash

# 🚀 Sincronizar arquivos do local para produção
# Execute no seu computador local (Windows)

echo "🚀 Sincronizando arquivos para produção..."

# 1. Arquivos que precisam ser enviados
echo "📁 Preparando arquivos para envio..."

# 2. Instruções para você executar:
echo ""
echo "📋 Execute estes comandos no seu computador local:"
echo ""
echo "# 1. Usar SCP para enviar os arquivos:"
echo "scp app.js rodri6000@server44:applications/nsi_tecnologia/"
echo "scp routes/api.js rodri6000@server44:applications/nsi_tecnologia/routes/"
echo "scp views/layout.ejs rodri6000@server44:applications/nsi_tecnologia/views/"
echo ""
echo "# 2. Ou usar rsync (se disponível):"
echo "rsync -avz app.js rodri6000@server44:applications/nsi_tecnologia/"
echo "rsync -avz routes/api.js rodri6000@server44:applications/nsi_tecnologia/routes/"
echo "rsync -avz views/layout.ejs rodri6000@server44:applications/nsi_tecnologia/views/"
echo ""
echo "# 3. Depois no servidor, executar:"
echo "pm2 restart nsi-tecnologia"
echo "pm2 logs nsi-tecnologia --lines 10"
echo ""
echo "✅ Arquivos sincronizados!"
