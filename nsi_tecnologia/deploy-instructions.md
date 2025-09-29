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

apos dados la

cd /home/rodri6000/applications/nsi_tecnologia
git pull
rm -rf node_modules
npm install
npm rebuild bcrypt
pkill -f "node app.js"
node app.js &


