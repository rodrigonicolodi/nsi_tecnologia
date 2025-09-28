# 🖨️ Guia de Impressão em Cupom

## 📋 **Visão Geral**

Sistema otimizado para impressão em impressoras de cupom/terminal com fontes maiores e layout adequado.

## 🎯 **Funcionalidades**

### **1. Páginas de Impressão**
- **`/os/imprimir/:id`** - Impressão direta (auto-print)
- **`/os/cupom/:id`** - Interface com controles (recomendado)

### **2. Recursos Implementados**
- ✅ **Fontes otimizadas** para cupom (14px+)
- ✅ **Layout responsivo** (70mm, 80mm, 90mm)
- ✅ **CSS específico** para impressão
- ✅ **JavaScript** para controles
- ✅ **Preview** antes da impressão
- ✅ **Auto-print** opcional

## 🛠️ **Arquivos Criados/Modificados**

### **CSS para Cupom**
- `public/css/cupom-print.css` - Estilos específicos
- `public/css/style.css` - Botão laranja adicionado

### **JavaScript**
- `public/js/cupom-print.js` - Controles de impressão

### **Views**
- `views/os/imprimir.ejs` - Impressão direta (atualizada)
- `views/os/cupom.ejs` - Interface com controles (nova)

### **Routes & Controllers**
- `routes/os.js` - Rota `/cupom/:id` adicionada
- `controllers/osController.js` - Método `cupomOS` adicionado
- `views/os/listar.ejs` - Botão "Imprimir Cupom" adicionado

## 🎨 **Classes CSS Disponíveis**

### **Layout Principal**
```css
.cupom-print          /* Container principal */
.cupom-titulo         /* Título principal */
.cupom-numero         /* Número da OS */
.cupom-linha          /* Linha separadora */
```

### **Informações**
```css
.cupom-cliente        /* Dados do cliente */
.cupom-servico        /* Descrição do serviço */
.cupom-valor          /* Valores */
.cupom-total          /* Total destacado */
.cupom-rodape         /* Rodapé */
```

### **Controles**
```css
.no-print             /* Elementos ocultos na impressão */
```

## 📱 **Responsividade**

### **Tamanhos de Cupom**
- **70mm** - Fontes 12px
- **80mm** - Fontes 14px (padrão)
- **90mm** - Fontes 16px

### **Media Queries**
```css
@media print and (max-width: 70mm) { /* Cupom pequeno */ }
@media print and (min-width: 90mm) { /* Cupom grande */ }
```

## 🖨️ **Como Usar**

### **1. Impressão Direta**
```
http://localhost:3000/os/imprimir/123
```
- Abre e imprime automaticamente
- Sem controles visuais

### **2. Interface com Controles**
```
http://localhost:3000/os/cupom/123
```
- Interface amigável
- Botões: Imprimir, Visualizar, Fechar
- Preview antes da impressão

### **3. Auto-print**
```
http://localhost:3000/os/cupom/123?autoprint=true
```
- Imprime automaticamente após 500ms

## ⚙️ **Configurações de Impressão**

### **CSS @page**
```css
@page {
  size: 80mm auto;
  margin: 0;
}
```

### **JavaScript**
```javascript
const printOptions = {
  silent: false,
  printBackground: true,
  color: false,
  margin: { top: 0, bottom: 0, left: 0, right: 0 },
  scale: 1,
  landscape: false
};
```

## 🎯 **Otimizações Implementadas**

### **1. Fontes**
- **Courier New** (monospace) para melhor legibilidade
- **Tamanhos ajustados** por largura do cupom
- **Line-height** otimizado (1.3)

### **2. Layout**
- **Margens mínimas** (5mm)
- **Quebra de linha** automática
- **Espaçamento** otimizado

### **3. Conteúdo**
- **Texto otimizado** para cupom
- **Quebra de linhas** inteligente
- **Formatação** clara e legível

## 🔧 **Personalização**

### **Alterar Tamanho da Fonte**
```css
.cupom-print {
  font-size: 16px; /* Aumentar fonte */
}
```

### **Alterar Largura do Cupom**
```css
@page {
  size: 90mm auto; /* Cupom mais largo */
}
```

### **Adicionar Logo**
```html
<div class="cupom-logo">
  <img src="/img/logo.png" alt="Logo">
</div>
```

## 🐛 **Solução de Problemas**

### **Fontes Muito Pequenas**
- Verificar se `cupom-print.css` está carregado
- Ajustar `font-size` no CSS
- Verificar configurações da impressora

### **Layout Quebrado**
- Verificar `@page` settings
- Ajustar `width` do container
- Verificar margens

### **Não Imprime**
- Verificar se JavaScript está habilitado
- Verificar configurações do navegador
- Testar com `window.print()` no console

## 📊 **Exemplo de Uso**

### **HTML Básico**
```html
<div class="cupom-print">
  <div class="cupom-titulo">ORDEM DE SERVIÇO</div>
  <div class="cupom-numero">Nº 123</div>
  <div class="cupom-linha"></div>
  
  <div class="cupom-cliente">
    <strong>Cliente:</strong> João Silva
  </div>
  
  <div class="cupom-servico">
    <strong>Serviço:</strong><br>
    Manutenção de computador
  </div>
  
  <div class="cupom-total">
    TOTAL: R$ 150,00
  </div>
</div>
```

## 🚀 **Próximos Passos**

1. **Testar** com diferentes impressoras
2. **Ajustar** fontes conforme necessário
3. **Personalizar** layout para sua marca
4. **Implementar** em outras páginas se necessário

---

**✅ Sistema 100% funcional para impressão em cupom!** 🎉



