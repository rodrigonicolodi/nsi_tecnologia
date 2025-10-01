#!/bin/bash

# 🧹 Script para Limpeza de Arquivos Desnecessários
# Execute no ambiente local

echo "🧹 Iniciando limpeza de arquivos desnecessários..."

# 1. Backup de segurança
echo "💾 Criando backup..."
mkdir -p backup-$(date +%Y%m%d-%H%M)

# 2. Scripts de deploy (remover)
echo "🗑️ Removendo scripts de deploy..."
mv patch-producao.sh backup-$(date +%Y%m%d-%H%M)/ 2>/dev/null || true
mv fix-producao-final.sh backup-$(date +%Y%m%d-%H%M)/ 2>/dev/null || true
mv fix-producao-simples.sh backup-$(date +%Y%m%d-%H%M)/ 2>/dev/null || true
mv debug-producao.sh backup-$(date +%Y%m%d-%H%M)/ 2>/dev/null || true
mv verificar-app.sh backup-$(date +%Y%m%d-%H%M)/ 2>/dev/null || true
mv update-api-only.sh backup-$(date +%Y%m%d-%H%M)/ 2>/dev/null || true
mv restart-sistema.sh backup-$(date +%Y%m%d-%H%M)/ 2>/dev/null || true
mv sync-producao.sh backup-$(date +%Y%m%d-%H%M)/ 2>/dev/null || true
mv deploy-fix.js backup-$(date +%Y%m%d-%H%M)/ 2>/dev/null || true

# 3. Documentação duplicada (manter apenas um)
echo "📄 Organizando documentação..."
mv DEPLOY_DASHBOARD_FIX.md backup-$(date +%Y%m%d-%H%M)/ 2>/dev/null || true
mv arquivos-producao.md backup-$(date +%Y%m%d-%H%M)/ 2>/dev/null || true
mv comandos-rapidos.md backup-$(date +%Y%m%d-%H%M)/ 2>/dev/null || true

# 4. Arquivos de teste
echo "🧪 Removendo arquivos de teste..."
mv "views/movimentacoes/relatorio_servicos_produtos funciona.pdf" backup-$(date +%Y%m%d-%H%M)/ 2>/dev/null || true
mv "views/movimentacoes/relatorio-movimentacoes erro.pdf" backup-$(date +%Y%m%d-%H%M)/ 2>/dev/null || true

# 5. Verificar vulnerabilidades
echo "🔍 Verificando vulnerabilidades..."
npm audit

# 6. Mostrar resumo
echo ""
echo "✅ Limpeza concluída!"
echo "📁 Arquivos movidos para: backup-$(date +%Y%m%d-%H%M)/"
echo ""
echo "📋 Arquivos mantidos:"
echo "- DEPLOYMENT_GUIDE.md"
echo "- deploy-instructions.md"
echo "- auditoria-seguranca.md"
echo ""
echo "⚠️ Próximos passos:"
echo "1. Execute: npm audit fix"
echo "2. Execute: npm update"
echo "3. Revise a auditoria-seguranca.md"
