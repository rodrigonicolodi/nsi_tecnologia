# 🚀 Deploy das Correções do Dashboard

## 📋 Problema Identificado
O dashboard estava mostrando **0** para pessoas e produtos devido a erros nas consultas SQL da API.

## 🔧 Correções Aplicadas
1. **Campo `ativo` → `status`** na tabela pessoas
2. **Campo `estoque_minimo` não existe** - usando `estoque_atual <= 5`
3. **Tabela `lancamentos_financeiros` → `financeiro`**
4. **Campo `data_vencimento` → `vencimento`**

## 📝 Instruções de Deploy

### 1. **Conectar no Servidor**
```bash
ssh rodri6000@server44
cd applications/nsi_tecnologia
```

### 2. **Parar o Processo**
```bash
pm2 stop nsi-tecnologia
```

### 3. **Fazer Backup (Opcional)**
```bash
mkdir backup-$(date +%Y-%m-%d)
cp app.js backup-$(date +%Y-%m-%d)/
cp routes/api.js backup-$(date +%Y-%m-%d)/
cp views/dashboard.ejs backup-$(date +%Y-%m-%d)/
cp views/layout.ejs backup-$(date +%Y-%m-%d)/
```

### 4. **Aplicar as Correções**

#### **A. Atualizar `app.js`**
Adicionar as linhas:
```javascript
const apiRoutes = require('./routes/api');

// Na seção de rotas:
app.use('/api', apiRoutes);

// Adicionar rota do dashboard:
app.get('/dashboard', (req, res) => {
  if (!req.session.usuario) {
    return res.redirect('/login');
  }
  res.render('dashboard', { 
    titulo: 'Dashboard',
    usuario: req.session.usuario 
  });
});
```

#### **B. Atualizar `views/layout.ejs`**
Adicionar no menu:
```html
<a href="/dashboard" class="btn"><i class="fas fa-tachometer-alt"></i> Dashboard</a>
```

#### **C. Verificar `routes/api.js`**
O arquivo deve ter as correções nas consultas SQL:
- Pessoas: `WHERE status = "ativo" OR status IS NULL`
- Produtos: `WHERE estoque_atual <= 5`
- Financeiro: `FROM financeiro` e `vencimento < CURDATE()`

### 5. **Reiniciar o Serviço**
```bash
pm2 start app.js --name nsi-tecnologia
```

### 6. **Verificar Status**
```bash
pm2 status
pm2 logs nsi-tecnologia --lines 20
```

## 🧪 Teste Final
1. Acesse: `http://seu-servidor:61910/dashboard`
2. Verifique se os números estão corretos:
   - **Pessoas**: Deve mostrar número > 0
   - **Produtos**: Deve mostrar número > 0
3. Verifique se os gráficos carregam

## 🔍 Troubleshooting

### Se ainda mostrar 0:
```bash
# Verificar logs
pm2 logs nsi-tecnologia

# Testar consultas SQL diretamente
mysql -u usuario -p database_name
SELECT COUNT(*) FROM pessoas;
SELECT COUNT(*) FROM produtos;
```

### Se houver erro de módulo:
```bash
# Verificar se o arquivo existe
ls -la routes/api.js

# Verificar sintaxe
node -c routes/api.js
node -c app.js
```

## 📊 Resultado Esperado
- ✅ Dashboard carrega sem erros
- ✅ Cards mostram números reais
- ✅ Gráficos funcionam
- ✅ Sem erros nos logs

---
**Data**: 30/09/2025  
**Versão**: 1.0.1  
**Status**: Pronto para deploy
