const logger = require('../utils/logger');

describe('🔧 Testes de Utilitários', () => {
  
  test('Deve ter logger configurado', () => {
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });

  test('Deve registrar logs corretamente', () => {
    // Teste se não quebra ao chamar os métodos
    expect(() => logger.info('Teste info')).not.toThrow();
    expect(() => logger.error('Teste error')).not.toThrow();
    expect(() => logger.warn('Teste warn')).not.toThrow();
    expect(() => logger.debug('Teste debug')).not.toThrow();
  });

  test('Deve ter métodos de auditoria', () => {
    expect(typeof logger.audit).toBe('function');
    expect(() => logger.audit('Teste audit')).not.toThrow();
  });

});



