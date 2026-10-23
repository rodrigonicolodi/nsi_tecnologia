// 🎯 Sistema de Notificações Toast
class NotificationSystem {
  constructor() {
    this.container = this.createContainer();
    this.notifications = new Map();
    this.defaultDuration = 5000;
  }

  createContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    return container;
  }

  show(message, type = 'info', duration = null) {
    const id = Date.now() + Math.random();
    const notification = this.createNotification(id, message, type);
    
    this.container.appendChild(notification);
    this.notifications.set(id, notification);

    // Auto remove
    const autoRemove = setTimeout(() => {
      this.remove(id);
    }, duration || this.defaultDuration);

    // Store timeout for manual removal
    notification._timeout = autoRemove;

    return id;
  }

  createNotification(id, message, type) {
    const notification = document.createElement('div');
    notification.className = `toast ${type}`;
    notification.dataset.id = id;

    const icon = this.getIcon(type);
    const closeBtn = this.createCloseButton(id);

    notification.innerHTML = `
      <div class="toast-content">
        <div class="toast-icon">${icon}</div>
        <div class="toast-message">${message}</div>
        ${closeBtn}
      </div>
    `;

    // Add click to close
    notification.addEventListener('click', () => this.remove(id));

    return notification;
  }

  getIcon(type) {
    const icons = {
      success: '<i class="fas fa-check-circle"></i>',
      error: '<i class="fas fa-exclamation-circle"></i>',
      warning: '<i class="fas fa-exclamation-triangle"></i>',
      info: '<i class="fas fa-info-circle"></i>'
    };
    return icons[type] || icons.info;
  }

  createCloseButton(id) {
    return `<button class="toast-close" onclick="notificationSystem.remove('${id}')" aria-label="Fechar">
      <i class="fas fa-times"></i>
    </button>`;
  }

  remove(id) {
    const notification = this.notifications.get(id);
    if (notification) {
      // Clear timeout
      if (notification._timeout) {
        clearTimeout(notification._timeout);
      }

      // Add exit animation
      notification.style.animation = 'slideOut 0.3s ease-in forwards';
      
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
        this.notifications.delete(id);
      }, 300);
    }
  }

  clear() {
    this.notifications.forEach((notification, id) => {
      this.remove(id);
    });
  }

  // Convenience methods
  success(message, duration) {
    return this.show(message, 'success', duration);
  }

  error(message, duration) {
    return this.show(message, 'error', duration);
  }

  warning(message, duration) {
    return this.show(message, 'warning', duration);
  }

  info(message, duration) {
    return this.show(message, 'info', duration);
  }
}

// Global instance
const notificationSystem = new NotificationSystem();

// Add CSS for slideOut animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }

  .toast-content {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .toast-icon {
    font-size: 1.2rem;
    flex-shrink: 0;
  }

  .toast-message {
    flex: 1;
    font-size: 0.9rem;
    line-height: 1.4;
  }

  .toast-close {
    background: none;
    border: none;
    color: #6c757d;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .toast-close:hover {
    background: rgba(0,0,0,0.1);
    color: #000;
  }

  .toast.success .toast-icon {
    color: #28a745;
  }

  .toast.error .toast-icon {
    color: #dc3545;
  }

  .toast.warning .toast-icon {
    color: #ffc107;
  }

  .toast.info .toast-icon {
    color: #17a2b8;
  }
`;
document.head.appendChild(style);

// Export for use in other scripts
window.NotificationSystem = NotificationSystem;
window.notificationSystem = notificationSystem;



