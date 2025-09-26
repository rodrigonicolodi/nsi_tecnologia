# Sistema de Parcelamento Financeiro

## 📋 Funcionalidades Implementadas

O sistema financeiro agora suporta parcelamento de lançamentos, permitindo dividir pagamentos e recebimentos em múltiplas parcelas.

### ✨ Novas Funcionalidades

1. **Parcelamento de Lançamentos**
   - Opção de criar lançamentos à vista ou parcelados
   - Configuração do número de parcelas (2 a 24)
   - Definição do intervalo entre parcelas (1 a 365 dias)
   - Cálculo automático do valor por parcela

2. **Visualização de Parcelas**
   - Lista todas as parcelas de um lançamento
   - Informações detalhadas de cada parcela
   - Status individual de cada parcela
   - Botão para visualizar parcelas na listagem principal

3. **Interface Atualizada**
   - Formulário com campos de parcelamento
   - Listagem com informações de parcelas
   - Relatórios incluindo dados de parcelamento
   - Estilos visuais para identificar parcelas

## 🗄️ Migração do Banco de Dados

### ⚠️ IMPORTANTE: Execute a migração antes de usar as novas funcionalidades

Execute o arquivo `migration_parcelamento.sql` no seu banco de dados MySQL:

```sql
-- Adicionar colunas para suporte a parcelamento
ALTER TABLE financeiro 
ADD COLUMN parcela_atual INT DEFAULT 1,
ADD COLUMN total_parcelas INT DEFAULT 1,
ADD COLUMN parcela_pai_id INT NULL,
ADD COLUMN data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Adicionar índices para melhor performance
CREATE INDEX idx_parcela_pai ON financeiro(parcela_pai_id);
CREATE INDEX idx_parcela_info ON financeiro(parcela_atual, total_parcelas);

-- Atualizar registros existentes
UPDATE financeiro 
SET parcela_atual = 1, 
    total_parcelas = 1, 
    data_criacao = NOW() 
WHERE parcela_atual IS NULL;
```

### Como Executar a Migração

1. **Via MySQL Workbench ou phpMyAdmin:**
   - Abra o arquivo `migration_parcelamento.sql`
   - Execute todas as queries no seu banco de dados

2. **Via Linha de Comando:**
   ```bash
   mysql -h nsi_tecnologia.mysql.dbaas.com.br -u nsi_tecnologia -p nsi_tecnologia < migration_parcelamento.sql
   ```

## 🚀 Como Usar

### Criando um Lançamento Parcelado

1. Acesse **Financeiro > Novo Lançamento**
2. Preencha os dados básicos (tipo, pessoa, caixa, valor)
3. Selecione **"Parcelado"** no campo Parcelamento
4. Defina o número de parcelas e intervalo entre elas
5. Informe a data de vencimento da primeira parcela
6. Clique em **Salvar Lançamento**

### Visualizando Parcelas

1. Na listagem de lançamentos, procure por lançamentos com ícone de lista (📋)
2. Clique no botão **"Ver Parcelas"** para visualizar todas as parcelas
3. Na tela de parcelas, você pode:
   - Ver todas as parcelas do grupo
   - Quitar parcelas individualmente
   - Editar parcelas específicas

### Relatórios

Os relatórios financeiros agora incluem informações de parcelamento, mostrando:
- Número da parcela (ex: 1/3, 2/3, 3/3)
- Identificação da parcela principal (👑)
- Lançamentos à vista marcados como "À Vista"

## 🔧 Estrutura Técnica

### Novos Campos na Tabela `financeiro`

- `parcela_atual`: Número da parcela atual (1, 2, 3, etc.)
- `total_parcelas`: Total de parcelas do lançamento
- `parcela_pai_id`: ID da parcela principal (primeira parcela)
- `data_criacao`: Data de criação do lançamento

### Lógica de Parcelamento

- A primeira parcela é sempre a "parcela principal" (`parcela_pai_id` = seu próprio ID)
- Todas as outras parcelas referenciam a parcela principal
- O valor total é dividido igualmente entre as parcelas
- As datas de vencimento são calculadas automaticamente baseadas no intervalo

## 🎨 Estilos Visuais

- **Parcelas**: Badge azul com formato "X/Y"
- **Parcela Principal**: Ícone de coroa (👑)
- **À Vista**: Texto em itálico cinza
- **Parcelas Pagas**: Fundo verde claro
- **Parcelas Pendentes**: Fundo normal

## 📝 Notas Importantes

1. **Compatibilidade**: Lançamentos existentes continuam funcionando normalmente
2. **Integridade**: O sistema mantém a integridade referencial entre parcelas
3. **Performance**: Índices foram criados para otimizar consultas de parcelamento
4. **Flexibilidade**: Suporte a 2 a 24 parcelas com intervalos de 1 a 365 dias

## 🐛 Resolução de Problemas

Se encontrar problemas após a migração:

1. Verifique se todas as colunas foram criadas corretamente
2. Confirme se os índices foram criados
3. Verifique se os registros existentes foram atualizados
4. Teste criando um novo lançamento parcelado

Para suporte técnico, verifique os logs do servidor para mensagens de erro específicas.

