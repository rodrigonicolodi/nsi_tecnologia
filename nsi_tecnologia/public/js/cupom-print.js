/**
 * 🖨️ JavaScript para Impressão em Cupom
 * Otimiza a impressão para impressoras de cupom/terminal
 */

class CupomPrint {
  constructor() {
    this.init();
  }

  init() {
    // Aguarda o carregamento da página
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupPrint());
    } else {
      this.setupPrint();
    }
  }

  setupPrint() {
    // Configurações de impressão
    this.setupPrintSettings();
    
    // Auto-print se necessário
    if (window.location.search.includes('autoprint=true')) {
      setTimeout(() => this.print(), 500);
    }
    
    // Adiciona botões de controle se não for auto-print e não existirem controles
    if (!window.location.search.includes('autoprint=true') && !document.querySelector('.cupom-actions')) {
      this.addPrintControls();
    }
  }

  setupPrintSettings() {
    // Configurações específicas para cupom
    const printStyles = `
      <style id="cupom-print-styles">
        @media print {
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          
          .cupom-print {
            width: 80mm !important;
            margin: 0 !important;
            padding: 5mm !important;
            font-size: 14px !important;
            line-height: 1.3 !important;
          }
          
          .no-print {
            display: none !important;
          }
        }
      </style>
    `;
    
    // Remove estilos anteriores se existirem
    const existingStyles = document.getElementById('cupom-print-styles');
    if (existingStyles) {
      existingStyles.remove();
    }
    
    // Adiciona novos estilos
    document.head.insertAdjacentHTML('beforeend', printStyles);
  }

  addPrintControls() {
    // Não adicionar controles extras se já existem controles na página
    if (document.querySelector('.cupom-actions')) {
      return;
    }
    
    const controlsHTML = `
      <div class="no-print" style="position: fixed; top: 10px; right: 10px; z-index: 1000; background: white; padding: 10px; border: 1px solid #ccc; border-radius: 5px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <button onclick="cupomPrint.print()" style="background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 3px; cursor: pointer; margin-right: 5px;">
          🖨️ Imprimir
        </button>
        <button onclick="cupomPrint.preview()" style="background: #28a745; color: white; border: none; padding: 8px 16px; border-radius: 3px; cursor: pointer; margin-right: 5px;">
          👁️ Visualizar
        </button>
        <button onclick="window.close()" style="background: #dc3545; color: white; border: none; padding: 8px 16px; border-radius: 3px; cursor: pointer;">
          ❌ Fechar
        </button>
      </div>
    `;
    
    document.body.insertAdjacentHTML('afterbegin', controlsHTML);
  }

  print() {
    // Tenta usar a API de impressão nativa
    if (window.print) {
      // Adiciona classe para impressão
      document.body.classList.add('printing');
      
      // Imprime
      window.print();
      
      // Remove classe após impressão
      setTimeout(() => {
        document.body.classList.remove('printing');
      }, 1000);
    } else {
      alert('Função de impressão não disponível neste navegador.');
    }
  }

  preview() {
    // Simplesmente abre a página de impressão direta em nova aba
    const cupomId = window.location.pathname.split('/').pop();
    const printUrl = `/os/imprimir/${cupomId}`;
    window.open(printUrl, '_blank', 'width=400,height=600');
  }

  // Método para ajustar fonte baseado no tamanho do cupom
  adjustFontSize(width) {
    const cupomElement = document.querySelector('.cupom-print');
    if (!cupomElement) return;

    let fontSize = 14; // Tamanho padrão
    
    if (width <= 70) {
      fontSize = 12; // Cupom pequeno
    } else if (width >= 90) {
      fontSize = 16; // Cupom grande
    }
    
    cupomElement.style.fontSize = `${fontSize}px`;
  }

  // Método para otimizar texto para cupom
  optimizeText() {
    const textElements = document.querySelectorAll('.cupom-servico, .cupom-cliente');
    
    textElements.forEach(element => {
      let text = element.textContent;
      
      // Quebra linhas longas
      if (text.length > 40) {
        const words = text.split(' ');
        let lines = [];
        let currentLine = '';
        
        words.forEach(word => {
          if ((currentLine + word).length > 40) {
            lines.push(currentLine.trim());
            currentLine = word + ' ';
          } else {
            currentLine += word + ' ';
          }
        });
        
        if (currentLine.trim()) {
          lines.push(currentLine.trim());
        }
        
        element.innerHTML = lines.join('<br>');
      }
    });
  }
}

// Inicializa quando a página carrega
const cupomPrint = new CupomPrint();

// Exporta para uso global
window.cupomPrint = cupomPrint;
