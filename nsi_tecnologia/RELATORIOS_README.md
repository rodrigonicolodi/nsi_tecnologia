# 📊 Sistema de Relatórios Avançado

## 🎯 Novos Relatórios Implementados

Criei um sistema completo de relatórios seguindo o mesmo padrão visual do seu sistema, com botões azuis e interface consistente.

### 📋 **Relatórios Disponíveis**

#### 1. **📊 Relatórios Financeiros**
- **Consulta de Caixas** - Relatório existente
- **Relatório Financeiro** - Relatório existente com parcelamento

#### 2. **🔧 Relatórios de Ordens de Serviço**

##### **Serviços e Produtos por Mês**
- **URL**: `/relatorios/servicos-produtos-mes`
- **Funcionalidades**:
  - Filtro por mês e ano
  - Resumo geral com totais
  - Detalhamento por OS
  - Separação de serviços vs produtos (campo `acrescimos`)
  - Cálculo de ticket médio

##### **OS por Status e Período**
- **URL**: `/relatorios/os-status-periodo`
- **Funcionalidades**:
  - Filtro por período e status
  - Resumo por status com percentuais
  - Detalhamento completo das OS
  - Badges coloridos para status e prioridade
  - Cálculo de participação percentual

##### **Faturamento por Cliente**
- **URL**: `/relatorios/faturamento-cliente`
- **Funcionalidades**:
  - Filtro por período
  - Ranking de clientes por faturamento
  - Separação de serviços e produtos
  - Gráfico de participação (visual)
  - Medalhas para top 3 clientes

##### **Performance de Técnicos**
- **URL**: `/relatorios/performance-tecnicos`
- **Funcionalidades**:
  - Filtro por período
  - Ranking de técnicos
  - Taxa de conclusão com barra de progresso
  - Tempo médio de execução
  - Classificação de performance
  - Estatísticas gerais

#### 3. **📦 Relatórios de Estoque**
- **Lista de Produtos** - Link para estoque existente
- **Movimentações** - Link para movimentações existente

## 🎨 **Design e Interface**

### **Tela Principal de Relatórios**
- **Layout organizado** em seções temáticas
- **Botões azuis** seguindo o padrão do sistema
- **Ícones FontAwesome** para cada relatório
- **Grid responsivo** para diferentes tamanhos de tela
- **Efeitos hover** com animações suaves

### **Padrão Visual Consistente**
- **Cores**: Azul (#0077cc) como cor principal
- **Botões**: Mesmo estilo em todos os relatórios
- **Cards**: Fundo branco com sombra sutil
- **Tabelas**: Estilo consistente com o sistema
- **Filtros**: Formulários padronizados

## 🔧 **Funcionalidades Técnicas**

### **Filtros Inteligentes**
- **Datas**: Filtros por período com validação
- **Status**: Dropdowns com opções do banco
- **Meses/Anos**: Seleção intuitiva
- **Validação**: Campos obrigatórios e formatos corretos

### **Cálculos Automáticos**
- **Totais**: Soma automática de valores
- **Percentuais**: Cálculo de participação
- **Médias**: Ticket médio e tempo médio
- **Rankings**: Ordenação por performance

### **Visualizações Avançadas**
- **Barras de progresso**: Para taxas de conclusão
- **Badges coloridos**: Para status e prioridades
- **Medalhas**: Para rankings (🥇🥈🥉)
- **Gráficos**: Participação visual dos clientes

## 📊 **Dados Utilizados**

### **Campos da Tabela `ordens_servico`**
- `valor_servico` - Valor dos serviços
- `acrescimos` - Valor dos produtos (como você mencionou)
- `desconto` - Descontos aplicados
- `valor_total` - Valor total da OS
- `status` - Status da OS
- `prioridade` - Prioridade da OS
- `data_abertura` - Data de abertura
- `data_fechamento` - Data de fechamento
- `solicitante_id` - ID do cliente
- `responsavel_id` - ID do técnico

### **Relacionamentos**
- **Pessoas**: Clientes e técnicos
- **Joins**: Para buscar nomes e dados relacionados
- **Agregações**: COUNT, SUM, AVG para estatísticas

## 🚀 **Como Usar**

### **Acessando os Relatórios**
1. Vá para `http://localhost:3000/relatorios/listar`
2. Escolha o relatório desejado
3. Configure os filtros necessários
4. Clique em "Gerar Relatório"

### **Navegação**
- **Botão "Voltar"** em cada relatório
- **Links diretos** para outros relatórios
- **Filtros persistentes** durante a navegação

## 📈 **Benefícios dos Relatórios**

### **Para Gestão**
- **Visão completa** do faturamento
- **Análise de performance** dos técnicos
- **Identificação** dos melhores clientes
- **Controle** de status das OS

### **Para Análise**
- **Dados históricos** por período
- **Comparações** entre meses/anos
- **Tendências** de faturamento
- **Eficiência** operacional

### **Para Tomada de Decisão**
- **Rankings** objetivos
- **Métricas** quantificadas
- **Relatórios** exportáveis
- **Dados** confiáveis

## 🎯 **Próximas Melhorias Sugeridas**

1. **Exportação** para PDF/Excel
2. **Gráficos** interativos (Chart.js)
3. **Relatórios agendados** por email
4. **Dashboards** em tempo real
5. **Filtros avançados** (múltipla seleção)
6. **Relatórios personalizados** pelo usuário

## 📝 **Arquivos Criados/Modificados**

### **Controllers**
- `controllers/relatorioController` - Lógica dos relatórios

### **Routes**
- `routes/relatorios.js` - Rotas dos relatórios

### **Views**
- `views/relatorios/listar.ejs` - Tela principal atualizada
- `views/relatorios/servicos-produtos-mes.ejs` - Relatório mensal
- `views/relatorios/os-status-periodo.ejs` - Relatório por status
- `views/relatorios/faturamento-cliente.ejs` - Relatório de clientes
- `views/relatorios/performance-tecnicos.ejs` - Relatório de técnicos

Todos os relatórios seguem o mesmo padrão visual e funcional do seu sistema, garantindo consistência e facilidade de uso! 🎉

