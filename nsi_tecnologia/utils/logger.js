// 📝 Sistema de Logs Estruturado
const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    this.ensureLogDir();
  }

  ensureLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...meta
    });
  }

  writeToFile(filename, message) {
    const logFile = path.join(this.logDir, filename);
    fs.appendFileSync(logFile, message + '\n');
  }

  info(message, meta = {}) {
    const formatted = this.formatMessage('INFO', message, meta);
    console.log(`ℹ️  ${message}`);
    this.writeToFile('app.log', formatted);
  }

  warn(message, meta = {}) {
    const formatted = this.formatMessage('WARN', message, meta);
    console.warn(`⚠️  ${message}`);
    this.writeToFile('app.log', formatted);
  }

  error(message, meta = {}) {
    const formatted = this.formatMessage('ERROR', message, meta);
    console.error(`❌ ${message}`);
    this.writeToFile('error.log', formatted);
  }

  debug(message, meta = {}) {
    if (process.env.NODE_ENV === 'development') {
      const formatted = this.formatMessage('DEBUG', message, meta);
      console.debug(`🐛 ${message}`);
      this.writeToFile('debug.log', formatted);
    }
  }

  // Log específico para auditoria
  audit(usuarioId, acao, detalhes = {}) {
    const message = `AUDIT: ${acao}`;
    const meta = {
      usuarioId,
      acao,
      ...detalhes
    };
    const formatted = this.formatMessage('AUDIT', message, meta);
    this.writeToFile('audit.log', formatted);
  }
}

module.exports = new Logger();
