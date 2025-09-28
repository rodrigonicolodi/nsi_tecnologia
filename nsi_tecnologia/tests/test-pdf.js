const request = require('supertest');
const app = require('../app');

describe('📄 Testes de Exportação PDF', () => {
  
  test('Deve retornar erro 401 para PDF sem autenticação', async () => {
    const response = await request(app)
      .get('/pdf/financeiro')
      .expect(401);
    
    expect(response.body.error).toBe('Acesso negado');
  });

  test('Deve retornar erro 401 para performance técnicos sem autenticação', async () => {
    const response = await request(app)
      .get('/pdf/performance-tecnicos')
      .expect(401);
    
    expect(response.body.error).toBe('Acesso negado');
  });

  test('Deve retornar erro 401 para faturamento cliente sem autenticação', async () => {
    const response = await request(app)
      .get('/pdf/faturamento-cliente')
      .expect(401);
    
    expect(response.body.error).toBe('Acesso negado');
  });

  test('Deve retornar 404 para PDF inexistente', async () => {
    const response = await request(app)
      .get('/pdf/relatorio-inexistente')
      .expect(404);
  });

});



