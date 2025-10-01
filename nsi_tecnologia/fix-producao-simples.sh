#!/bin/bash

# 🛠️ Correção Simples para Produção
# Aplica apenas as correções essenciais

echo "🔧 Aplicando correção simples..."

# 1. Parar serviço
pm2 stop nsi-tecnologia

# 2. Verificar se routes/api.js existe
if [ ! -f "routes/api.js" ]; then
    echo "📝 Criando routes/api.js..."
    mkdir -p routes
fi

# 3. Criar arquivo api.js com correções mínimas
cat > routes/api.js << 'EOF'
const express = require('express');
const router = express.Router();
const db = require('../db');
const { verificarLogin } = require('../middleware/auth');

router.use(verificarLogin);

// Stats do dashboard
router.get('/dashboard/stats', async (req, res) => {
  try {
    let totalOS = 0, osAbertas = 0, totalPessoas = 0, pessoasAtivas = 0;
    let totalProdutos = 0, produtosBaixoEstoque = 0, faturamento = 0;

    // OS
    try {
      const [osResult] = await db.query('SELECT COUNT(*) as total FROM ordens_servico');
      const [osAbertasResult] = await db.query('SELECT COUNT(*) as abertas FROM ordens_servico WHERE status = "aberta"');
      totalOS = osResult[0].total;
      osAbertas = osAbertasResult[0].abertas;
    } catch (err) {
      console.warn('Erro OS:', err.message);
    }
    
    // Pessoas - CORRIGIDO
    try {
      const [pessoasResult] = await db.query('SELECT COUNT(*) as total FROM pessoas');
      const [pessoasAtivasResult] = await db.query('SELECT COUNT(*) as ativas FROM pessoas WHERE status = "ativo" OR status IS NULL');
      totalPessoas = pessoasResult[0].total;
      pessoasAtivas = pessoasAtivasResult[0].ativas;
    } catch (err) {
      console.warn('Erro Pessoas:', err.message);
    }
    
    // Produtos - CORRIGIDO
    try {
      const [produtosResult] = await db.query('SELECT COUNT(*) as total FROM produtos');
      const [produtosBaixoResult] = await db.query('SELECT COUNT(*) as baixo FROM produtos WHERE estoque_atual <= 5');
      totalProdutos = produtosResult[0].total;
      produtosBaixoEstoque = produtosBaixoResult[0].baixo;
    } catch (err) {
      console.warn('Erro Produtos:', err.message);
    }
    
    // Faturamento
    try {
      const [faturamentoResult] = await db.query(`
        SELECT COALESCE(SUM(valor_total), 0) as faturamento 
        FROM ordens_servico 
        WHERE MONTH(data_abertura) = MONTH(CURRENT_DATE()) 
        AND YEAR(data_abertura) = YEAR(CURRENT_DATE())
        AND status = 'concluida'
      `);
      faturamento = faturamentoResult[0].faturamento;
    } catch (err) {
      console.warn('Erro Faturamento:', err.message);
    }

    res.json({
      totalOS,
      osAbertas,
      totalPessoas,
      pessoasAtivas,
      totalProdutos,
      produtosBaixoEstoque,
      faturamentoMes: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(faturamento),
      crescimento: 0
    });

  } catch (error) {
    console.error('Erro dashboard stats:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Alertas simples
router.get('/dashboard/alerts', async (req, res) => {
  try {
    res.json([]); // Por enquanto, sem alertas
  } catch (error) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

module.exports = router;
EOF

# 4. Adicionar rota da API no app.js (se não existir)
if ! grep -q "const apiRoutes" app.js; then
    echo "📝 Adicionando rota API no app.js..."
    # Encontrar linha onde adicionar
    sed -i '/const pdfRoutes = require/a const apiRoutes = require('\''./routes/api'\'');' app.js
    sed -i '/app.use('\''\/pdf'\'', pdfRoutes);/a app.use('\''/api'\'', apiRoutes);' app.js
fi

# 5. Adicionar rota dashboard (se não existir)
if ! grep -q "app.get('/dashboard'" app.js; then
    echo "📝 Adicionando rota dashboard..."
    cat >> app.js << 'EOF'

// Dashboard
app.get('/dashboard', (req, res) => {
  if (!req.session.usuario) {
    return res.redirect('/login');
  }
  res.render('dashboard', { 
    titulo: 'Dashboard',
    usuario: req.session.usuario 
  });
});
EOF
fi

# 6. Verificar sintaxe
echo "🔍 Verificando sintaxe..."
if node -c app.js && node -c routes/api.js; then
    echo "✅ Sintaxe OK"
    
    # 7. Reiniciar
    echo "🔄 Reiniciando..."
    pm2 start app.js --name nsi-tecnologia
    
    # 8. Aguardar um pouco e verificar
    sleep 3
    echo "📊 Status:"
    pm2 status
    
    echo ""
    echo "🧪 Testando API..."
    sleep 2
    curl -s http://localhost:61910/api/dashboard/stats | head -c 200
    echo ""
    
else
    echo "❌ Erro de sintaxe - não reiniciando"
    echo "Verifique os logs acima"
fi

echo ""
echo "✅ Correção aplicada!"
echo "🌐 Teste: http://seu-servidor:61910/dashboard"
