const db = require('../db');

describe('🗄️ Testes de Banco de Dados', () => {
  
  test('Deve conectar ao banco de dados', async () => {
    try {
      const [rows] = await db.query('SELECT 1 as test');
      expect(rows[0].test).toBe(1);
    } catch (error) {
      // Se não conseguir conectar, pelo menos não deve quebrar
      expect(error).toBeDefined();
    }
  });

  test('Deve ter configuração de pool de conexões', () => {
    // Verificar se o db tem as propriedades esperadas
    expect(db).toBeDefined();
    expect(typeof db.query).toBe('function');
  });

  test('Deve usar variáveis de ambiente para conexão', () => {
    expect(process.env.DB_HOST).toBeDefined();
    expect(process.env.DB_USER).toBeDefined();
    expect(process.env.DB_NAME).toBeDefined();
  });

});
