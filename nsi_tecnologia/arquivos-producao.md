# 📋 Arquivos para Deploy em Produção

## 🎯 Objetivo
Corrigir os gráficos do dashboard no servidor de produção.

## 📁 Arquivos que Precisam Ser Enviados:

### 1. **`app.js`** (Linhas adicionadas)
```javascript
// Linha 19 - Adicionar:
const apiRoutes = require('./routes/api');

// Linha 73 - Adicionar:
app.use('/api', apiRoutes);

// Linhas 76-84 - Adicionar rota dashboard:
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

### 2. **`routes/api.js`** (Arquivo completo)
- Arquivo inteiro precisa ser enviado
- Contém todas as correções SQL

### 3. **`views/dashboard.ejs`** (Linha 36)
```html
<!-- Adicionar no menu lateral: -->
<a href="/dashboard" class="btn"><i class="fas fa-tachometer-alt"></i> Dashboard</a>
```

## 🚀 Deploy Simplificado

### Opção 1: SCP (Mais Rápido)
```bash
# Do seu computador local:
scp app.js rodri6000@server44:applications/nsi_tecnologia/
scp routes/api.js rodri6000@server44:applications/nsi_tecnologia/routes/
scp views/layout.ejs rodri6000@server44:applications/nsi_tecnologia/views/
```

### Opção 2: Git (Se usar repositório)
```bash
# No servidor:
cd applications/nsi_tecnologia
git pull origin main
```

### Opção 3: Editar Direto no Servidor
Aplicar apenas as correções SQL no arquivo `routes/api.js` existente.

## ⚡ Deploy Rápido (Recomendado)

**Execute no servidor:**
```bash
pm2 stop nsi-tecnologia
# Aplicar as correções SQL
pm2 start app.js --name nsi-tecnologia
pm2 logs nsi-tecnologia
```

---
**Status**: Pronto para deploy  
**Prioridade**: Alta (gráficos não funcionam)
