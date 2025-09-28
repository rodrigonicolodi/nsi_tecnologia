# 🚀 Guia de Deploy - NSI Tecnologia

Guia completo para deploy do sistema NSI Tecnologia em produção.

## 📋 **Pré-requisitos**

### **Servidor**
- Ubuntu 20.04+ ou CentOS 8+
- 2GB RAM mínimo (4GB recomendado)
- 20GB espaço em disco
- Acesso root/sudo

### **Software**
- Node.js 18+
- MySQL 8.0+
- Nginx (opcional, para proxy reverso)
- PM2 (process manager)

## 🔧 **Instalação do Servidor**

### **1. Atualizar Sistema**
```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# CentOS/RHEL
sudo yum update -y
```

### **2. Instalar Node.js**
```bash
# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalação
node --version
npm --version
```

### **3. Instalar MySQL**
```bash
# Ubuntu/Debian
sudo apt install mysql-server -y

# CentOS/RHEL
sudo yum install mysql-server -y

# Iniciar e habilitar MySQL
sudo systemctl start mysql
sudo systemctl enable mysql

# Configurar segurança
sudo mysql_secure_installation
```

### **4. Instalar PM2**
```bash
sudo npm install -g pm2
```

## 🗄️ **Configuração do Banco de Dados**

### **1. Criar Banco e Usuário**
```sql
-- Conectar como root
mysql -u root -p

-- Criar banco de dados
CREATE DATABASE nsi_tecnologia CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Criar usuário
CREATE USER 'nsi_user'@'localhost' IDENTIFIED BY 'senha_super_segura';

-- Conceder permissões
GRANT ALL PRIVILEGES ON nsi_tecnologia.* TO 'nsi_user'@'localhost';
FLUSH PRIVILEGES;

-- Sair
EXIT;
```

### **2. Importar Estrutura (se necessário)**
```bash
# Se você tiver um dump do banco
mysql -u nsi_user -p nsi_tecnologia < estrutura.sql
```

## 📁 **Deploy da Aplicação**

### **1. Preparar Diretório**
```bash
# Criar diretório da aplicação
sudo mkdir -p /var/www/nsi_tecnologia
sudo chown -R $USER:$USER /var/www/nsi_tecnologia
cd /var/www/nsi_tecnologia
```

### **2. Clonar/Upload Código**
```bash
# Opção 1: Git
git clone <repository-url> .

# Opção 2: Upload via SCP/SFTP
# Faça upload dos arquivos para /var/www/nsi_tecnologia
```

### **3. Instalar Dependências**
```bash
# Instalar dependências de produção
npm ci --only=production

# Instalar dependências globais
sudo npm install -g pm2
```

### **4. Configurar Variáveis de Ambiente**
```bash
# Criar arquivo .env
nano .env
```

**Conteúdo do .env:**
```env
# Banco de Dados
DB_HOST=localhost
DB_USER=nsi_user
DB_PASSWORD=senha_super_segura
DB_NAME=nsi_tecnologia

# Aplicação
PORT=3000
NODE_ENV=production

# Segurança
SESSION_SECRET=chave_super_secreta_para_producao
JWT_SECRET=jwt_secret_key_para_producao

# Logs
LOG_LEVEL=info
```

### **5. Configurar PM2**
```bash
# Criar arquivo de configuração PM2
nano ecosystem.config.js
```

**Conteúdo do ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: 'nsi-tecnologia',
    script: 'app.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

### **6. Iniciar Aplicação**
```bash
# Iniciar com PM2
pm2 start ecosystem.config.js --env production

# Salvar configuração PM2
pm2 save

# Configurar PM2 para iniciar no boot
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
```

## 🌐 **Configuração do Nginx (Opcional)**

### **1. Instalar Nginx**
```bash
sudo apt install nginx -y
```

### **2. Configurar Site**
```bash
sudo nano /etc/nginx/sites-available/nsi-tecnologia
```

**Conteúdo da configuração:**
```nginx
server {
    listen 80;
    server_name seu-dominio.com.br;

    # Redirecionar HTTP para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name seu-dominio.com.br;

    # Certificado SSL (usar Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/seu-dominio.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seu-dominio.com.br/privkey.pem;

    # Configurações SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Proxy para aplicação Node.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Arquivos estáticos
    location /public {
        alias /var/www/nsi_tecnologia/public;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### **3. Habilitar Site**
```bash
# Habilitar site
sudo ln -s /etc/nginx/sites-available/nsi-tecnologia /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

## 🔒 **Configuração SSL (Let's Encrypt)**

### **1. Instalar Certbot**
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### **2. Obter Certificado**
```bash
sudo certbot --nginx -d seu-dominio.com.br
```

### **3. Configurar Renovação Automática**
```bash
# Testar renovação
sudo certbot renew --dry-run

# Adicionar ao crontab
sudo crontab -e
# Adicionar linha:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 **Monitoramento**

### **1. Status da Aplicação**
```bash
# Ver status PM2
pm2 status

# Ver logs
pm2 logs nsi-tecnologia

# Monitorar em tempo real
pm2 monit
```

### **2. Logs do Sistema**
```bash
# Logs do Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Logs da aplicação
tail -f /var/www/nsi_tecnologia/logs/app.log
tail -f /var/www/nsi_tecnologia/logs/error.log
```

### **3. Monitoramento de Recursos**
```bash
# CPU e Memória
htop

# Espaço em disco
df -h

# Processos Node.js
ps aux | grep node
```

## 🔄 **Atualizações**

### **1. Backup Antes da Atualização**
```bash
# Backup do banco
mysqldump -u nsi_user -p nsi_tecnologia > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup da aplicação
tar -czf backup_app_$(date +%Y%m%d_%H%M%S).tar.gz /var/www/nsi_tecnologia
```

### **2. Atualizar Código**
```bash
cd /var/www/nsi_tecnologia

# Parar aplicação
pm2 stop nsi-tecnologia

# Atualizar código
git pull origin main

# Instalar novas dependências
npm ci --only=production

# Reiniciar aplicação
pm2 start nsi-tecnologia
```

### **3. Verificar Funcionamento**
```bash
# Verificar status
pm2 status

# Verificar logs
pm2 logs nsi-tecnologia --lines 50

# Testar aplicação
curl http://localhost:3000
```

## 🚨 **Troubleshooting**

### **Problemas Comuns**

#### **1. Aplicação não inicia**
```bash
# Verificar logs
pm2 logs nsi-tecnologia

# Verificar variáveis de ambiente
cat .env

# Testar conexão com banco
mysql -u nsi_user -p -h localhost nsi_tecnologia
```

#### **2. Erro de permissões**
```bash
# Corrigir permissões
sudo chown -R $USER:$USER /var/www/nsi_tecnologia
chmod -R 755 /var/www/nsi_tecnologia
```

#### **3. Porta em uso**
```bash
# Verificar processos na porta 3000
sudo lsof -i :3000

# Matar processo se necessário
sudo kill -9 <PID>
```

#### **4. Problemas de banco**
```bash
# Verificar status MySQL
sudo systemctl status mysql

# Reiniciar MySQL
sudo systemctl restart mysql

# Verificar logs MySQL
sudo tail -f /var/log/mysql/error.log
```

## 📈 **Otimizações de Performance**

### **1. Configuração MySQL**
```sql
-- Editar /etc/mysql/mysql.conf.d/mysqld.cnf
[mysqld]
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
max_connections = 200
query_cache_size = 64M
```

### **2. Configuração Node.js**
```bash
# Aumentar limite de memória
export NODE_OPTIONS="--max-old-space-size=2048"
```

### **3. Configuração Nginx**
```nginx
# Adicionar ao server block
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

## 🔐 **Segurança**

### **1. Firewall**
```bash
# Configurar UFW
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw deny 3000  # Bloquear acesso direto à aplicação
```

### **2. Configurações de Segurança MySQL**
```sql
-- Remover usuários desnecessários
DELETE FROM mysql.user WHERE User='';
DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');
FLUSH PRIVILEGES;
```

### **3. Backup Automático**
```bash
# Criar script de backup
nano /home/backup_script.sh
```

**Conteúdo do script:**
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/backups"
APP_DIR="/var/www/nsi_tecnologia"

# Criar diretório de backup
mkdir -p $BACKUP_DIR

# Backup do banco
mysqldump -u nsi_user -p'senha_super_segura' nsi_tecnologia > $BACKUP_DIR/db_$DATE.sql

# Backup da aplicação
tar -czf $BACKUP_DIR/app_$DATE.tar.gz $APP_DIR

# Manter apenas últimos 7 dias
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

```bash
# Tornar executável
chmod +x /home/backup_script.sh

# Adicionar ao crontab
crontab -e
# Adicionar: 0 2 * * * /home/backup_script.sh
```

## ✅ **Checklist de Deploy**

- [ ] Servidor configurado
- [ ] Node.js instalado
- [ ] MySQL instalado e configurado
- [ ] Banco de dados criado
- [ ] Aplicação deployada
- [ ] Variáveis de ambiente configuradas
- [ ] PM2 configurado
- [ ] Nginx configurado (se aplicável)
- [ ] SSL configurado (se aplicável)
- [ ] Firewall configurado
- [ ] Backup configurado
- [ ] Monitoramento configurado
- [ ] Testes de funcionamento realizados

---

**Última atualização**: 28/09/2025  
**Versão**: 2.0.0



