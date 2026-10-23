// ✅ Sistema de Validação de Formulários
class FormValidator {
  constructor(form) {
    this.form = typeof form === 'string' ? document.querySelector(form) : form;
    this.rules = new Map();
    this.errors = new Map();
    this.isValid = true;
    
    if (this.form) {
      this.init();
    }
  }

  init() {
    // Add CSS for validation states
    this.addValidationStyles();
    
    // Bind form submission
    this.form.addEventListener('submit', (e) => {
      if (!this.validate()) {
        e.preventDefault();
        e.stopPropagation();
      }
    });

    // Real-time validation on input
    this.form.addEventListener('input', (e) => {
      if (e.target.matches('input, select, textarea')) {
        this.validateField(e.target);
      }
    });

    // Clear errors on focus
    this.form.addEventListener('focusin', (e) => {
      if (e.target.matches('input, select, textarea')) {
        this.clearFieldError(e.target);
      }
    });
  }

  addValidationStyles() {
    if (document.getElementById('validation-styles')) return;

    const style = document.createElement('style');
    style.id = 'validation-styles';
    style.textContent = `
      .form-control.is-invalid {
        border-color: #dc3545;
        box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
      }

      .form-control.is-valid {
        border-color: #28a745;
        box-shadow: 0 0 0 0.2rem rgba(40, 167, 69, 0.25);
      }

      .invalid-feedback {
        display: block;
        width: 100%;
        margin-top: 0.25rem;
        font-size: 0.875rem;
        color: #dc3545;
      }

      .valid-feedback {
        display: block;
        width: 100%;
        margin-top: 0.25rem;
        font-size: 0.875rem;
        color: #28a745;
      }

      .form-group.has-error .form-control {
        border-color: #dc3545;
      }

      .form-group.has-success .form-control {
        border-color: #28a745;
      }
    `;
    document.head.appendChild(style);
  }

  // Add validation rule
  addRule(fieldName, rule) {
    if (!this.rules.has(fieldName)) {
      this.rules.set(fieldName, []);
    }
    this.rules.get(fieldName).push(rule);
  }

  // Validate entire form
  validate() {
    this.isValid = true;
    this.errors.clear();

    // Validate all fields with rules
    this.rules.forEach((rules, fieldName) => {
      const field = this.form.querySelector(`[name="${fieldName}"]`);
      if (field) {
        this.validateField(field);
      }
    });

    // Show first error if any
    if (!this.isValid && this.errors.size > 0) {
      const firstError = this.errors.values().next().value;
      if (window.notificationSystem) {
        window.notificationSystem.error(firstError);
      }
    }

    return this.isValid;
  }

  // Validate single field
  validateField(field) {
    const fieldName = field.name;
    const rules = this.rules.get(fieldName) || [];
    let fieldValid = true;
    let errorMessage = '';

    for (const rule of rules) {
      const result = rule(field.value, field);
      if (result !== true) {
        fieldValid = false;
        errorMessage = result;
        break;
      }
    }

    this.setFieldState(field, fieldValid, errorMessage);
    
    if (!fieldValid) {
      this.isValid = false;
      this.errors.set(fieldName, errorMessage);
    } else {
      this.errors.delete(fieldName);
    }

    return fieldValid;
  }

  // Set visual state of field
  setFieldState(field, isValid, errorMessage = '') {
    const formGroup = field.closest('.form-group') || field.parentElement;
    
    // Remove existing states
    field.classList.remove('is-valid', 'is-invalid');
    formGroup.classList.remove('has-success', 'has-error');
    
    // Remove existing feedback
    const existingFeedback = formGroup.querySelector('.invalid-feedback, .valid-feedback');
    if (existingFeedback) {
      existingFeedback.remove();
    }

    if (isValid) {
      field.classList.add('is-valid');
      formGroup.classList.add('has-success');
    } else {
      field.classList.add('is-invalid');
      formGroup.classList.add('has-error');
      
      // Add error message
      if (errorMessage) {
        const feedback = document.createElement('div');
        feedback.className = 'invalid-feedback';
        feedback.textContent = errorMessage;
        formGroup.appendChild(feedback);
      }
    }
  }

  // Clear field error
  clearFieldError(field) {
    const formGroup = field.closest('.form-group') || field.parentElement;
    field.classList.remove('is-invalid');
    formGroup.classList.remove('has-error');
    
    const feedback = formGroup.querySelector('.invalid-feedback');
    if (feedback) {
      feedback.remove();
    }
  }

  // Clear all errors
  clearErrors() {
    this.errors.clear();
    this.isValid = true;
    
    const invalidFields = this.form.querySelectorAll('.is-invalid');
    invalidFields.forEach(field => {
      this.clearFieldError(field);
    });
  }

  // Get validation errors
  getErrors() {
    return Object.fromEntries(this.errors);
  }

  // Check if form is valid
  isValidForm() {
    return this.isValid;
  }
}

// Built-in validation rules
const ValidationRules = {
  required: (message = 'Este campo é obrigatório') => (value) => {
    return value && value.trim() !== '' ? true : message;
  },

  email: (message = 'Email inválido') => (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return !value || emailRegex.test(value) ? true : message;
  },

  minLength: (min, message) => (value) => {
    const msg = message || `Mínimo de ${min} caracteres`;
    return !value || value.length >= min ? true : msg;
  },

  maxLength: (max, message) => (value) => {
    const msg = message || `Máximo de ${max} caracteres`;
    return !value || value.length <= max ? true : msg;
  },

  pattern: (regex, message = 'Formato inválido') => (value) => {
    return !value || regex.test(value) ? true : message;
  },

  numeric: (message = 'Apenas números permitidos') => (value) => {
    return !value || /^\d+$/.test(value) ? true : message;
  },

  decimal: (message = 'Apenas números decimais permitidos') => (value) => {
    return !value || /^\d+(\.\d+)?$/.test(value) ? true : message;
  },

  phone: (message = 'Telefone inválido') => (value) => {
    const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
    return !value || phoneRegex.test(value) ? true : message;
  },

  cpf: (message = 'CPF inválido') => (value) => {
    if (!value) return true;
    
    // Remove non-digits
    const cpf = value.replace(/\D/g, '');
    
    // Check length
    if (cpf.length !== 11) return message;
    
    // Check for known invalid CPFs
    if (/^(\d)\1{10}$/.test(cpf)) return message;
    
    // Validate CPF algorithm
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let remainder = 11 - (sum % 11);
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(9))) return message;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    remainder = 11 - (sum % 11);
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(10))) return message;
    
    return true;
  },

  cnpj: (message = 'CNPJ inválido') => (value) => {
    if (!value) return true;
    
    // Remove non-digits
    const cnpj = value.replace(/\D/g, '');
    
    // Check length
    if (cnpj.length !== 14) return message;
    
    // Check for known invalid CNPJs
    if (/^(\d)\1{13}$/.test(cnpj)) return message;
    
    // Validate CNPJ algorithm
    let sum = 0;
    let weight = 2;
    for (let i = 11; i >= 0; i--) {
      sum += parseInt(cnpj.charAt(i)) * weight;
      weight = weight === 9 ? 2 : weight + 1;
    }
    let remainder = sum % 11;
    let digit1 = remainder < 2 ? 0 : 11 - remainder;
    
    if (digit1 !== parseInt(cnpj.charAt(12))) return message;
    
    sum = 0;
    weight = 2;
    for (let i = 12; i >= 0; i--) {
      sum += parseInt(cnpj.charAt(i)) * weight;
      weight = weight === 9 ? 2 : weight + 1;
    }
    remainder = sum % 11;
    let digit2 = remainder < 2 ? 0 : 11 - remainder;
    
    if (digit2 !== parseInt(cnpj.charAt(13))) return message;
    
    return true;
  },

  custom: (validator, message = 'Validação falhou') => (value, field) => {
    return validator(value, field) ? true : message;
  }
};

// Auto-initialize forms with data-validation attribute
document.addEventListener('DOMContentLoaded', () => {
  const forms = document.querySelectorAll('form[data-validation]');
  forms.forEach(form => {
    new FormValidator(form);
  });
});

// Export for use in other scripts
window.FormValidator = FormValidator;
window.ValidationRules = ValidationRules;



