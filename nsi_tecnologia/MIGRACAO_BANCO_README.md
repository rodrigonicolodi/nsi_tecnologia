# 🔄 Guia de Migração do Banco de Dados

## Problema Identificado
O erro "Erro ao salvar OS. Verifique os dados e tente novamente." está ocorrendo porque as configurações de conexão do banco de dados não foram atualizadas após a migração para a nova hospedagem.

## ✅ Soluções Implementadas

### 1. **Arquivo de Configuração Atualizado** (`db.js`)
- Configurações flexíveis com variáveis de ambiente
- Pool de conexões otimizado
- Teste automático de conexão
- Reconexão automática

### 2. **Script de Teste** (`test-db-connection.js`)
- Testa conexão com o banco
- Verifica se a tabela `ordens_servico` existe
- Diagnostica problemas específicos

## 🛠️ Passos para Resolver

### Passo 1: Atualizar Configurações
Edite o arquivo `db.js` e substitua os valores:

```javascript
const dbConfig = {
  host: 'SEU_NOVO_HOST_AQUI',           // Ex: localhost, seu-servidor.com.br
  user: 'SEU_NOVO_USUARIO_AQUI',        // Seu usuário do banco
  password: 'SUA_NOVA_SENHA_AQUI',     // Sua senha do banco
  database: 'SEU_NOVO_BANCO_AQUI',      // Nome do seu banco
  port: 3306
};
```

### Passo 2: Testar Conexão
Execute o script de teste:
```bash
node test-db-connection.js
```

### Passo 3: Verificar Estrutura do Banco
Certifique-se de que:
- ✅ O backup SQL foi importado corretamente
- ✅ A tabela `ordens_servico` existe
- ✅ A tabela `pessoas` existe
- ✅ As permissões do usuário estão corretas

## 🔍 Possíveis Problemas e Soluções

### Problema: "ECONNREFUSED"
**Causa:** Host ou porta incorretos
**Solução:** Verifique host e porta (padrão: 3306)

### Problema: "ER_ACCESS_DENIED_ERROR"
**Causa:** Usuário ou senha incorretos
**Solução:** Verifique credenciais do banco

### Problema: "ER_BAD_DB_ERROR"
**Causa:** Banco de dados não existe
**Solução:** Verifique se o backup foi importado

### Problema: "Table 'ordens_servico' doesn't exist"
**Causa:** Estrutura do banco não foi importada
**Solução:** Reimporte o backup SQL

## 📋 Checklist de Migração

- [ ] Atualizar configurações em `db.js`
- [ ] Testar conexão com `test-db-connection.js`
- [ ] Verificar se todas as tabelas existem
- [ ] Testar salvamento de OS
- [ ] Verificar se dados antigos estão acessíveis

## 🚀 Após a Correção

1. **Reinicie o servidor** para aplicar as novas configurações
2. **Teste o salvamento de OS** para confirmar que está funcionando
3. **Verifique outras funcionalidades** que dependem do banco

## 📞 Suporte

Se ainda houver problemas após seguir este guia:
1. Execute `node test-db-connection.js` e envie o resultado
2. Verifique os logs do servidor
3. Confirme se o backup SQL foi importado completamente

