// Configuração global para testes
process.env.NODE_ENV = 'test';
process.env.DB_HOST = 'localhost';
process.env.DB_USER = 'test';
process.env.DB_PASSWORD = 'test';
process.env.DB_NAME = 'test_db';
process.env.SESSION_SECRET = 'test_secret';
process.env.LOG_LEVEL = 'error';

// Configurar timeout para testes
jest.setTimeout(10000);



