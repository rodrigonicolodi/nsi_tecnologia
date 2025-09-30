# 🚀 Instruções de Deploy - NSI Tecnologia

## 📋 **Checklist de Deploy:**

### 1. **No Servidor de Produção:**
```bash
# 1. Fazer clone do repositório
git clone [seu-repositorio]
cd nsi_tecnologia

# 2. Instalar dependências
npm install

# 3. Criar arquivo .env com credenciais de produção
cp config.env.example .env
# Editar .env com credenciais reais de produção
```

### 2. **Configurar .env de Produção:**
```env
# Configurações do Banco de Dados (PRODUÇÃO)
DB_HOST=seu-servidor-producao.com
DB_USER=usuario_producao
DB_PASSWORD=senha_super_segura_producao
DB_NAME=banco_producao

# Configurações da Aplicação
PORT=3000
NODE_ENV=production

# Segurança (GERAR NOVAS CHAVES)
SESSION_SECRET=chave_super_secreta_producao_123456789
JWT_SECRET=jwt_secret_producao_987654321

# Logs
LOG_LEVEL=info
```

### 3. **Comandos de Deploy:**
```bash
# Parar servidor atual
pm2 stop nsi-tecnologia

# Atualizar código
git pull origin main

# Instalar novas dependências (se houver)
npm install

# Reiniciar servidor
pm2 restart nsi-tecnologia
```

## 🔒 **SEGURANÇA:**

### ✅ **O que commitar:**
- Código fonte
- config.env.example
- package.json
- .gitignore

### ❌ **NUNCA commitar:**
- .env (arquivo com credenciais)
- logs/ (pasta de logs)
- node_modules/

## 📁 **Estrutura Final:**
```
projeto/
├── .env                    ← CRIAR NO SERVIDOR (não commitar)
├── config.env.example      ← COMMITAR (template)
├── db.js                   ← COMMITAR (usa variáveis de ambiente)
├── app.js                  ← COMMITAR
└── ...
```

## 🚀 **COMANDOS DE DEPLOY ATUALIZADOS:**

### **1. Instalar PM2 (se não tiver):**
```bash
npm install -g pm2
```

### **2. Deploy com PM2 (RECOMENDADO):**
```bash
# Navegue para o projeto
cd /home/rodri6000/applications/nsi_tecnologia

# Ative o ambiente virtual
source ~/nodevenv/nsi_tecnologia/bin/activate

# Atualize o código
git pull

# Instale dependências
rm -rf node_modules
npm install
npm rebuild bcrypt

# Pare o servidor atual (se estiver rodando)
pm2 stop nsi-tecnologia 2>/dev/null || true

# Inicie com PM2 (fica rodando mesmo fechando SSH)
pm2 start app.js --name "nsi-tecnologia" --env production

# Salve a configuração do PM2
pm2 save

# Configure para iniciar automaticamente no boot
pm2 startup
```

### **3. Comandos Úteis do PM2:**
```bash
# Ver status dos processos
pm2 status

# Ver logs
pm2 logs nsi-tecnologia

# Reiniciar
pm2 restart nsi-tecnologia

# Parar
pm2 stop nsi-tecnologia

# Deletar processo
pm2 delete nsi-tecnologia
```

### **4. Deploy Rápido (após configurar PM2):**
```bash
cd /home/rodri6000/applications/nsi_tecnologia
source ~/nodevenv/nsi_tecnologia/bin/activate
git pull
npm install
pm2 restart nsi-tecnologia
```





# 1. Navegue para o projeto
cd /home/rodri6000/applications/nsi_tecnologia

# 2. Ative o ambiente virtual
source ~/nodevenv/nsi_tecnologia/bin/activate

# 3. Instale PM2
npm install pm2

# 4. Pare o servidor atual
pkill -f "node app.js"

# 5. Inicie com PM2
./node_modules/.bin/pm2 start app.js --name "nsi-tecnologia" --env production

# 6. Salve a configuração
./node_modules/.bin/pm2 save

# 7. Configure para iniciar automaticamente
./node_modules/.bin/pm2 startup