# 🚀 NSI Tecnologia - Sistema de Gestão

Sistema completo de gestão empresarial com funcionalidades avançadas de autenticação, dashboard em tempo real, API REST e exportação de relatórios.

## ✨ **Funcionalidades Principais**

### 🔐 **Segurança**
- ✅ Autenticação robusta com sessões seguras
- ✅ Middleware de autorização por níveis
- ✅ Variáveis de ambiente para credenciais
- ✅ Logs de auditoria completos
- ✅ Tratamento centralizado de erros

### 📊 **Dashboard Inteligente**
- ✅ Estatísticas em tempo real
- ✅ Gráficos interativos (Chart.js)
- ✅ Alertas automáticos
- ✅ Ações rápidas
- ✅ Responsivo para mobile

### 🌐 **API REST**
- ✅ Endpoints para integração
- ✅ Autenticação via middleware
- ✅ Documentação automática
- ✅ Tratamento de erros padronizado

### 📄 **Relatórios Avançados**
- ✅ Exportação PDF com Puppeteer
- ✅ Relatórios de performance
- ✅ Relatórios financeiros
- ✅ Relatórios de clientes

### 🧪 **Qualidade de Código**
- ✅ Sistema de testes automatizados
- ✅ Cobertura de código
- ✅ Linting e formatação
- ✅ CI/CD ready

## 🛠️ **Tecnologias**

- **Backend**: Node.js + Express
- **Database**: MySQL com pool de conexões
- **Frontend**: EJS + Bootstrap + Chart.js
- **PDF**: Puppeteer
- **Testes**: Jest + Supertest
- **Segurança**: bcrypt, express-session

## 🚀 **Instalação**

### 1. **Pré-requisitos**
```bash
Node.js >= 18
MySQL >= 8.0
```

### 2. **Configuração**
```bash
# Clone o repositório
git clone <repository-url>
cd nsi_tecnologia

# Instale dependências
npm install

# Configure variáveis de ambiente
cp config.env.example .env
# Edite o arquivo .env com suas credenciais
```

### 3. **Variáveis de Ambiente**
```env
# Banco de Dados
DB_HOST=localhost
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_NAME=nome_do_banco

# Aplicação
PORT=3000
NODE_ENV=development

# Segurança
SESSION_SECRET=chave_super_secreta
JWT_SECRET=jwt_secret_key

# Logs
LOG_LEVEL=info
```

### 4. **Executar**
```bash
# Desenvolvimento
npm run dev

# Produção
npm start

# Testes
npm test
npm run test:coverage
```

## 📁 **Estrutura do Projeto**

```
nsi_tecnologia/
├── 📁 controllers/          # Controladores
├── 📁 middleware/          # Middlewares customizados
├── 📁 routes/              # Rotas da aplicação
├── 📁 views/               # Templates EJS
├── 📁 public/              # Assets estáticos
├── 📁 tests/               # Testes automatizados
├── 📁 utils/                # Utilitários
├── 📄 app.js               # Aplicação principal
├── 📄 db.js                 # Configuração do banco
└── 📄 package.json          # Dependências
```

## 🔧 **Scripts Disponíveis**

```bash
npm run dev          # Desenvolvimento com nodemon
npm start            # Produção
npm test             # Executar testes
npm run test:watch   # Testes em modo watch
npm run test:coverage # Testes com cobertura
```

## 🧪 **Testes**

O sistema possui testes automatizados para:

- ✅ **Autenticação**: Login, logout, autorização
- ✅ **API REST**: Endpoints e middleware
- ✅ **PDF Export**: Geração de relatórios
- ✅ **Middleware**: Tratamento de erros
- ✅ **Database**: Conexão e configuração
- ✅ **Utils**: Logger e utilitários

```bash
# Executar todos os testes
npm test

# Testes com cobertura
npm run test:coverage

# Testes em modo watch
npm run test:watch
```

## 📊 **Dashboard**

### **Estatísticas em Tempo Real**
- Total de OS (Ordens de Serviço)
- OS Abertas
- Total de Pessoas
- Pessoas Ativas
- Total de Produtos
- Produtos com Baixo Estoque
- Faturamento

### **Gráficos Interativos**
- Gráfico de OS por Status
- Gráfico de Faturamento
- Gráfico de Produtos
- Gráfico de Pessoas

### **Alertas Automáticos**
- Produtos com baixo estoque
- OS em atraso
- Pessoas inativas
- Alertas de sistema

## 🌐 **API REST**

### **Endpoints Disponíveis**

```bash
GET  /api/dashboard/stats    # Estatísticas do dashboard
GET  /api/dashboard/alerts   # Alertas do sistema
```

### **Autenticação**
Todas as rotas da API requerem autenticação via sessão.

## 📄 **Relatórios PDF**

### **Relatórios Disponíveis**
- `/pdf/financeiro` - Relatório financeiro
- `/pdf/os` - Relatório de OS
- `/pdf/servicos-produtos` - Serviços e produtos
- `/pdf/performance-tecnicos` - Performance de técnicos
- `/pdf/faturamento-cliente` - Faturamento por cliente

## 🔒 **Segurança**

### **Implementações de Segurança**
- ✅ Credenciais em variáveis de ambiente
- ✅ Sessões seguras com httpOnly
- ✅ Middleware de autenticação
- ✅ Autorização por níveis
- ✅ Logs de auditoria
- ✅ Tratamento de erros
- ✅ Validação de entrada

## 🚀 **Deploy**

### **Produção**
1. Configure as variáveis de ambiente
2. Execute `npm start`
3. Configure proxy reverso (nginx/apache)
4. Configure SSL/HTTPS

### **Docker** (Opcional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 📈 **Monitoramento**

### **Logs**
- ✅ Logs de aplicação (`logs/app.log`)
- ✅ Logs de erro (`logs/error.log`)
- ✅ Logs de auditoria (`logs/audit.log`)
- ✅ Logs de debug (`logs/debug.log`)

### **Métricas**
- ✅ Estatísticas de uso
- ✅ Performance de queries
- ✅ Alertas automáticos
- ✅ Monitoramento de erros

## 🤝 **Contribuição**

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📝 **Changelog**

### **v2.0.0** - Melhorias de Segurança e Performance
- ✅ Sistema de variáveis de ambiente
- ✅ Middleware de autenticação centralizado
- ✅ Dashboard com gráficos em tempo real
- ✅ API REST completa
- ✅ Sistema de testes automatizados
- ✅ Logs de auditoria
- ✅ Exportação PDF avançada

### **v1.0.0** - Versão Inicial
- ✅ Sistema básico de gestão
- ✅ Autenticação simples
- ✅ CRUD básico

## 📞 **Suporte**

Para suporte técnico ou dúvidas:
- 📧 Email: suporte@nsitecnologia.com.br
- 📱 WhatsApp: (11) 99999-9999
- 🌐 Website: https://nsitecnologia.com.br

## 📄 **Licença**

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

**Desenvolvido com ❤️ pela NSI Tecnologia**



