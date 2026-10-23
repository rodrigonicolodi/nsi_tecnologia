// 🔄 Sistema de Loading States
class LoadingManager {
  constructor() {
    this.loadingElements = new Set();
    this.globalLoader = this.createGlobalLoader();
  }

  createGlobalLoader() {
    const loader = document.createElement('div');
    loader.id = 'global-loader';
    loader.className = 'global-loader';
    loader.innerHTML = `
      <div class="loader-content">
        <div class="spinner"></div>
        <div class="loader-text">Carregando...</div>
      </div>
    `;
    
    // Add CSS
    const style = document.createElement('style');
    style.textContent = `
      .global-loader {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.9);
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        backdrop-filter: blur(2px);
      }

      .global-loader.show {
        display: flex;
      }

      .loader-content {
        text-align: center;
        background: white;
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      }

      .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #007bff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .loader-text {
        color: #6c757d;
        font-size: 0.9rem;
        font-weight: 500;
      }

      .loading {
        position: relative;
        overflow: hidden;
      }

      .loading::after {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
        animation: loading 1.5s infinite;
      }

      @keyframes loading {
        0% { left: -100%; }
        100% { left: 100%; }
      }

      .btn.loading {
        pointer-events: none;
        opacity: 0.7;
      }

      .btn.loading::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 16px;
        height: 16px;
        margin: -8px 0 0 -8px;
        border: 2px solid transparent;
        border-top: 2px solid currentColor;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
    `;
    document.head.appendChild(style);

    return loader;
  }

  showGlobal(text = 'Carregando...') {
    this.globalLoader.querySelector('.loader-text').textContent = text;
    this.globalLoader.classList.add('show');
    document.body.appendChild(this.globalLoader);
  }

  hideGlobal() {
    this.globalLoader.classList.remove('show');
    setTimeout(() => {
      if (this.globalLoader.parentNode) {
        this.globalLoader.parentNode.removeChild(this.globalLoader);
      }
    }, 300);
  }

  showElement(element, text = '') {
    if (typeof element === 'string') {
      element = document.querySelector(element);
    }

    if (!element) return;

    element.classList.add('loading');
    this.loadingElements.add(element);

    if (text) {
      element.setAttribute('data-loading-text', text);
    }
  }

  hideElement(element) {
    if (typeof element === 'string') {
      element = document.querySelector(element);
    }

    if (!element) return;

    element.classList.remove('loading');
    this.loadingElements.delete(element);
    element.removeAttribute('data-loading-text');
  }

  showButton(button, text = 'Carregando...') {
    if (typeof button === 'string') {
      button = document.querySelector(button);
    }

    if (!button) return;

    const originalText = button.textContent;
    button.setAttribute('data-original-text', originalText);
    button.textContent = text;
    button.classList.add('loading');
    button.disabled = true;
  }

  hideButton(button) {
    if (typeof button === 'string') {
      button = document.querySelector(button);
    }

    if (!button) return;

    const originalText = button.getAttribute('data-original-text');
    if (originalText) {
      button.textContent = originalText;
      button.removeAttribute('data-original-text');
    }
    button.classList.remove('loading');
    button.disabled = false;
  }

  // Utility methods for common operations
  async withLoading(operation, options = {}) {
    const {
      element = null,
      button = null,
      global = false,
      text = 'Carregando...',
      onSuccess = null,
      onError = null
    } = options;

    try {
      if (global) {
        this.showGlobal(text);
      } else if (element) {
        this.showElement(element, text);
      } else if (button) {
        this.showButton(button, text);
      }

      const result = await operation();
      
      if (onSuccess) {
        onSuccess(result);
      }

      return result;
    } catch (error) {
      if (onError) {
        onError(error);
      } else {
        console.error('Loading operation failed:', error);
        if (window.notificationSystem) {
          window.notificationSystem.error('Operação falhou: ' + error.message);
        }
      }
      throw error;
    } finally {
      if (global) {
        this.hideGlobal();
      } else if (element) {
        this.hideElement(element);
      } else if (button) {
        this.hideButton(button);
      }
    }
  }

  // Auto-hide after timeout
  showTemporary(element, duration = 2000) {
    this.showElement(element);
    setTimeout(() => {
      this.hideElement(element);
    }, duration);
  }

  // Clear all loading states
  clearAll() {
    this.loadingElements.forEach(element => {
      this.hideElement(element);
    });
    this.hideGlobal();
  }
}

// Global instance
const loadingManager = new LoadingManager();

// Export for use in other scripts
window.LoadingManager = LoadingManager;
window.loadingManager = loadingManager;

// Auto-clear on page unload
window.addEventListener('beforeunload', () => {
  loadingManager.clearAll();
});



