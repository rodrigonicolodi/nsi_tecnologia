const request = require('supertest');
const app = require('../app');

describe('🌐 Testes da API REST', () => {
  
  test('Deve retornar erro 401 para stats sem autenticação', async () => {
    const response = await request(app)
      .get('/api/dashboard/stats')
      .expect(401);
    
    expect(response.body.error).toBe('Acesso negado');
  });

  test('Deve retornar erro 401 para alerts sem autenticação', async () => {
    const response = await request(app)
      .get('/api/dashboard/alerts')
      .expect(401);
    
    expect(response.body.error).toBe('Acesso negado');
  });

  test('Deve retornar 404 para rota inexistente', async () => {
    const response = await request(app)
      .get('/api/rota-inexistente')
      .expect(404);
  });

});

describe('📊 Testes de Middleware', () => {
  
  test('Deve aplicar middleware de autenticação em rotas protegidas', async () => {
    const response = await request(app)
      .get('/api/dashboard/stats')
      .expect(401);
    
    expect(response.body.error).toBeDefined();
  });

});



