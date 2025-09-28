const request = require('supertest');
const app = require('../app');

describe('🛡️ Testes de Middleware', () => {
  
  test('Deve aplicar middleware de tratamento de erros', async () => {
    // Simular erro interno
    const response = await request(app)
      .get('/rota-que-nao-existe')
      .expect(404);
    
    expect(response.text).toContain('404');
  });

  test('Deve aplicar middleware de autenticação em rotas protegidas', async () => {
    const response = await request(app)
      .get('/usuarios')
      .expect(302);
    
    expect(response.headers.location).toBe('/login');
  });

  test('Deve aplicar middleware de validação', async () => {
    const response = await request(app)
      .post('/pessoas')
      .send({}) // Dados vazios
      .expect(400);
    
    expect(response.text).toContain('erro');
  });

});

describe('🔧 Testes de Configuração', () => {
  
  test('Deve carregar variáveis de ambiente', () => {
    expect(process.env.NODE_ENV).toBeDefined();
  });

  test('Deve ter configuração de sessão', () => {
    expect(app.get('trust proxy')).toBe(1);
  });

});



