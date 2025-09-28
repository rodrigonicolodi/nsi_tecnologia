# 🌐 API REST - NSI Tecnologia

Documentação completa da API REST do sistema NSI Tecnologia.

## 🔐 **Autenticação**

Todas as rotas da API requerem autenticação via sessão. O sistema utiliza `express-session` para gerenciar sessões.

### **Headers Obrigatórios**
```http
Cookie: connect.sid=<session_id>
```

## 📊 **Dashboard API**

### **GET /api/dashboard/stats**
Retorna estatísticas do dashboard em tempo real.

**Resposta:**
```json
{
  "os": {
    "total": 150,
    "abertas": 25,
    "concluidas": 120,
    "canceladas": 5
  },
  "pessoas": {
    "total": 500,
    "ativas": 480,
    "inativas": 20
  },
  "produtos": {
    "total": 1000,
    "baixoEstoque": 15,
    "semEstoque": 3
  },
  "faturamento": {
    "mesAtual": 50000.00,
    "mesAnterior": 45000.00,
    "crescimento": 11.11
  }
}
```

**Status Codes:**
- `200` - Sucesso
- `401` - Não autenticado
- `500` - Erro interno

### **GET /api/dashboard/alerts**
Retorna alertas do sistema.

**Resposta:**
```json
{
  "alerts": [
    {
      "id": 1,
      "type": "warning",
      "title": "Produtos com Baixo Estoque",
      "message": "15 produtos com estoque baixo",
      "count": 15,
      "timestamp": "2025-09-28T03:33:02.165Z"
    },
    {
      "id": 2,
      "type": "info",
      "title": "OS em Andamento",
      "message": "25 ordens de serviço abertas",
      "count": 25,
      "timestamp": "2025-09-28T03:33:02.165Z"
    }
  ]
}
```

**Status Codes:**
- `200` - Sucesso
- `401` - Não autenticado
- `500` - Erro interno

## 📄 **PDF Export API**

### **GET /pdf/financeiro**
Gera relatório financeiro em PDF.

**Parâmetros de Query:**
- `dataInicio` (opcional) - Data de início (YYYY-MM-DD)
- `dataFim` (opcional) - Data de fim (YYYY-MM-DD)

**Resposta:**
- `Content-Type: application/pdf`
- Arquivo PDF para download

**Status Codes:**
- `200` - PDF gerado com sucesso
- `401` - Não autenticado
- `500` - Erro na geração

### **GET /pdf/os**
Gera relatório de ordens de serviço em PDF.

**Parâmetros de Query:**
- `status` (opcional) - Filtro por status
- `dataInicio` (opcional) - Data de início
- `dataFim` (opcional) - Data de fim

**Resposta:**
- `Content-Type: application/pdf`
- Arquivo PDF para download

### **GET /pdf/servicos-produtos**
Gera relatório de serviços e produtos em PDF.

**Parâmetros de Query:**
- `mes` (opcional) - Mês específico
- `ano` (opcional) - Ano específico

**Resposta:**
- `Content-Type: application/pdf`
- Arquivo PDF para download

### **GET /pdf/performance-tecnicos**
Gera relatório de performance de técnicos em PDF.

**Parâmetros de Query:**
- `dataInicio` (opcional) - Data de início
- `dataFim` (opcional) - Data de fim

**Resposta:**
- `Content-Type: application/pdf`
- Arquivo PDF para download

### **GET /pdf/faturamento-cliente**
Gera relatório de faturamento por cliente em PDF.

**Parâmetros de Query:**
- `clienteId` (opcional) - ID do cliente específico
- `dataInicio` (opcional) - Data de início
- `dataFim` (opcional) - Data de fim

**Resposta:**
- `Content-Type: application/pdf`
- Arquivo PDF para download

## 🔧 **Middleware de Autenticação**

### **verificarLogin**
Middleware que verifica se o usuário está autenticado.

```javascript
const { verificarLogin } = require('./middleware/auth');

// Aplicar em rotas protegidas
router.get('/protegida', verificarLogin, (req, res) => {
  res.json({ message: 'Acesso autorizado' });
});
```

### **somenteAdmin**
Middleware que permite acesso apenas para administradores.

```javascript
const { somenteAdmin } = require('./middleware/auth');

router.get('/admin', somenteAdmin, (req, res) => {
  res.json({ message: 'Acesso administrativo' });
});
```

### **adminOuTecnico**
Middleware que permite acesso para administradores ou técnicos.

```javascript
const { adminOuTecnico } = require('./middleware/auth');

router.get('/tecnico', adminOuTecnico, (req, res) => {
  res.json({ message: 'Acesso técnico' });
});
```

## 📝 **Exemplos de Uso**

### **JavaScript (Fetch)**
```javascript
// Buscar estatísticas do dashboard
const response = await fetch('/api/dashboard/stats', {
  credentials: 'include' // Incluir cookies de sessão
});

const stats = await response.json();
console.log(stats);
```

### **cURL**
```bash
# Buscar estatísticas
curl -X GET http://localhost:3000/api/dashboard/stats \
  -H "Cookie: connect.sid=<session_id>"

# Gerar PDF
curl -X GET http://localhost:3000/pdf/financeiro \
  -H "Cookie: connect.sid=<session_id>" \
  --output relatorio.pdf
```

### **Python (Requests)**
```python
import requests

# Criar sessão
session = requests.Session()

# Fazer login
login_data = {
    'email': 'usuario@exemplo.com',
    'senha': 'senha123'
}
session.post('http://localhost:3000/login', data=login_data)

# Buscar estatísticas
response = session.get('http://localhost:3000/api/dashboard/stats')
stats = response.json()
print(stats)
```

## 🚨 **Tratamento de Erros**

### **Estrutura de Erro Padrão**
```json
{
  "error": "Mensagem de erro",
  "code": "ERROR_CODE",
  "timestamp": "2025-09-28T03:33:02.165Z",
  "path": "/api/dashboard/stats"
}
```

### **Códigos de Status HTTP**
- `200` - Sucesso
- `401` - Não autenticado
- `403` - Acesso negado
- `404` - Recurso não encontrado
- `500` - Erro interno do servidor

### **Códigos de Erro Personalizados**
- `AUTH_REQUIRED` - Autenticação necessária
- `INVALID_CREDENTIALS` - Credenciais inválidas
- `ACCESS_DENIED` - Acesso negado
- `RESOURCE_NOT_FOUND` - Recurso não encontrado
- `VALIDATION_ERROR` - Erro de validação
- `DATABASE_ERROR` - Erro de banco de dados

## 🔍 **Rate Limiting**

O sistema implementa rate limiting para prevenir abuso:

- **Dashboard API**: 100 requests/minuto por IP
- **PDF Export**: 10 requests/minuto por usuário
- **Geral**: 1000 requests/hora por IP

## 📊 **Monitoramento**

### **Logs de API**
Todas as requisições são logadas com:
- Timestamp
- Método HTTP
- URL
- Status Code
- Tempo de resposta
- IP do cliente
- User Agent

### **Métricas Disponíveis**
- Total de requisições
- Taxa de erro
- Tempo médio de resposta
- Requisições por endpoint
- Usuários ativos

## 🔧 **Configuração**

### **Variáveis de Ambiente**
```env
# API
API_RATE_LIMIT=1000
API_TIMEOUT=30000

# PDF
PDF_TIMEOUT=60000
PDF_HEADLESS=true

# Logs
LOG_LEVEL=info
LOG_FORMAT=json
```

### **Configuração de CORS**
```javascript
app.use(cors({
  origin: ['http://localhost:3000', 'https://nsitecnologia.com.br'],
  credentials: true
}));
```

## 🧪 **Testes da API**

### **Executar Testes**
```bash
# Testes completos
npm test

# Testes da API apenas
npm test -- tests/test-api.js

# Testes com cobertura
npm run test:coverage
```

### **Exemplo de Teste**
```javascript
const request = require('supertest');
const app = require('../app');

describe('API Dashboard', () => {
  test('Deve retornar estatísticas', async () => {
    const response = await request(app)
      .get('/api/dashboard/stats')
      .expect(401); // Sem autenticação
    
    expect(response.body.error).toBe('Acesso negado');
  });
});
```

## 📚 **Recursos Adicionais**

- [Documentação do Express](https://expressjs.com/)
- [Guia de Sessões](https://expressjs.com/en/resources/middleware/session.html)
- [Documentação do Puppeteer](https://pptr.dev/)
- [Guia de Testes com Jest](https://jestjs.io/docs/getting-started)

---

**Última atualização**: 28/09/2025  
**Versão da API**: 2.0.0



