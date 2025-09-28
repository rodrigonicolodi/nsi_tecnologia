const request = require('supertest');
const app = require('../app');

describe('🔐 Testes de Autenticação', () => {
  
  test('Deve redirecionar para login quando não autenticado', async () => {
    const response = await request(app)
      .get('/dashboard')
      .expect(302);
    
    expect(response.headers.location).toBe('/login');
  });

  test('Deve permitir acesso ao login', async () => {
    const response = await request(app)
      .get('/login')
      .expect(200);
    
    expect(response.text).toContain('login');
  });

  test('Deve rejeitar login com credenciais inválidas', async () => {
    const response = await request(app)
      .post('/login')
      .send({
        email: 'teste@invalido.com',
        senha: 'senhaerrada'
      })
      .expect(401);
    
    expect(response.text).toContain('Credenciais inválidas');
  });

});

describe('🔒 Testes de Autorização', () => {
  
  test('Deve bloquear acesso a rotas administrativas sem login', async () => {
    const response = await request(app)
      .get('/usuarios')
      .expect(302);
    
    expect(response.headers.location).toBe('/login');
  });

  test('Deve bloquear acesso a API sem autenticação', async () => {
    const response = await request(app)
      .get('/api/dashboard/stats')
      .expect(401);
  });

});



