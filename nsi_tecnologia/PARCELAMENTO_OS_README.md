# Sistema de Parcelamento para Ordens de Serviço

## 🎯 Funcionalidades Implementadas

Agora o sistema suporta parcelamento tanto na **finalização de Ordens de Serviço** quanto na **edição de lançamentos financeiros existentes**.

### ✨ Novas Funcionalidades

#### 1. **Finalização de OS com Parcelamento**
- **Formulário de finalização** com opções de parcelamento
- **Configuração de parcelas** (2 a 24 parcelas)
- **Intervalo personalizado** entre parcelas (1 a 365 dias)
- **Seleção de caixa** para o lançamento
- **Observações adicionais** para o lançamento

#### 2. **Parcelamento de Lançamentos Existentes**
- **Converter lançamentos únicos** em parcelados
- **Preview das parcelas** antes de confirmar
- **Manutenção da integridade** dos dados
- **Transações seguras** com rollback em caso de erro

## 🚀 Como Usar

### Finalizando uma OS com Parcelamento

1. **Acesse** a listagem de OS (`/os/listar`)
2. **Clique** no botão verde "Finalizar OS com Parcelamento" 
3. **Configure** as opções de parcelamento:
   - Número de parcelas (2-24)
   - Intervalo entre parcelas (1-365 dias)
   - Data de vencimento da primeira parcela
   - Caixa para o lançamento
   - Observações adicionais
4. **Clique** em "Finalizar OS e Gerar Lançamento"

### Parcelando um Lançamento Existente

1. **Acesse** a listagem de financeiro (`/financeiro`)
2. **Clique** no botão laranja "Parcelar" (apenas para lançamentos únicos)
3. **Configure** o parcelamento:
   - Número de parcelas
   - Intervalo entre parcelas
   - Data de vencimento da primeira parcela
   - Caixa (pode alterar o caixa original)
   - Observações adicionais
4. **Visualize** o preview das parcelas
5. **Clique** em "Parcelar Lançamento"

## 🔧 Estrutura Técnica

### Novas Rotas

#### Ordens de Serviço
- `GET /os/finalizar/:id` - Formulário de finalização com parcelamento
- `POST /os/finalizar/:id` - Processa a finalização com parcelamento

#### Financeiro
- `GET /financeiro/parcelar/:id` - Formulário para parcelar lançamento existente
- `POST /financeiro/parcelar/:id` - Processa o parcelamento

### Novas Views

- `views/os/finalizar.ejs` - Formulário de finalização de OS
- `views/financeiro/parcelar.ejs` - Formulário de parcelamento de lançamento

### Lógica de Parcelamento

#### Finalização de OS
1. **Validação** da OS e dados necessários
2. **Atualização** do status da OS para "concluída"
3. **Criação** das parcelas com base nas configurações
4. **Associação** com a OS através do campo `ordem_servico_id`

#### Parcelamento de Lançamento Existente
1. **Validação** do lançamento (deve ser único)
2. **Transação** para garantir integridade
3. **Atualização** do lançamento original para primeira parcela
4. **Criação** das parcelas restantes
5. **Rollback** automático em caso de erro

## 🎨 Interface e UX

### Botões e Ações

- **Finalizar OS**: Botão verde com ícone de check-circle
- **Parcelar Lançamento**: Botão laranja com ícone de cut
- **Ver Parcelas**: Botão verde com ícone de list (para lançamentos já parcelados)

### Preview de Parcelas

- **Visualização em tempo real** das parcelas configuradas
- **Cálculo automático** do valor por parcela
- **Datas de vencimento** calculadas automaticamente
- **Interface responsiva** e intuitiva

### Validações

- **Lançamentos únicos**: Apenas lançamentos com 1 parcela podem ser parcelados
- **OS abertas**: Apenas OS com status "aberta" podem ser finalizadas
- **Valores válidos**: Validação de valores positivos e campos obrigatórios
- **Transações seguras**: Rollback automático em caso de erro

## 📊 Benefícios

### Para Ordens de Serviço
- **Flexibilidade** na cobrança de serviços
- **Melhor controle** de fluxo de caixa
- **Facilidade** para clientes com pagamentos parcelados
- **Rastreabilidade** completa do processo

### Para Lançamentos Financeiros
- **Conversão** de lançamentos únicos em parcelados
- **Manutenção** da integridade dos dados
- **Flexibilidade** para ajustes posteriores
- **Controle** granular de parcelas

## 🔍 Exemplos de Uso

### Exemplo 1: Finalizando OS com 3 parcelas
1. OS de R$ 1.500,00
2. Configurar 3 parcelas com intervalo de 30 dias
3. Resultado: 3 lançamentos de R$ 500,00 cada
4. Vencimentos: hoje, +30 dias, +60 dias

### Exemplo 2: Parcelando lançamento existente
1. Lançamento único de R$ 2.000,00
2. Converter em 4 parcelas com intervalo de 15 dias
3. Resultado: 4 lançamentos de R$ 500,00 cada
4. Lançamento original vira primeira parcela

## 🛡️ Segurança e Integridade

- **Transações** para operações críticas
- **Validações** rigorosas de dados
- **Rollback** automático em caso de erro
- **Manutenção** da integridade referencial
- **Logs** detalhados para auditoria

## 📝 Notas Importantes

1. **Compatibilidade**: Sistema mantém compatibilidade com lançamentos existentes
2. **Performance**: Índices otimizados para consultas de parcelamento
3. **Flexibilidade**: Suporte a diferentes intervalos e números de parcelas
4. **Auditoria**: Rastreabilidade completa de alterações
5. **Interface**: Design intuitivo e responsivo

O sistema agora oferece total flexibilidade para gerenciar parcelamentos tanto na criação quanto na edição de lançamentos financeiros!

