# Histórico de versões — NSI Tecnologia

Cada versão publicada na produção ganha um número **MAIOR.MENOR.CORREÇÃO**:
- **Correção** (1.1.0 → 1.1.1): conserta um erro, sem novidade.
- **Menor** (1.1.x → 1.2.0): novidade (tela, botão, relatório…).
- **Maior** (1.x → 2.0.0): mudança grande, que muda o jeito de usar.

Como publicar uma versão nova:
1. Anotar abaixo, em **"Próxima versão"**, o que mudou.
2. Antes de publicar, trocar "Próxima versão" pelo número e data, e mudar a versão
   no `package.json` (peça ao Claude: **"vamos fechar a versão 1.2.0"**).
3. Publicar normalmente (PR `develop` → `main`). O deploy cria sozinho a tag
   `v1.2.0` no GitHub.

## Próxima versão
- Publicação automática corrigida: agora reinicia o sistema de verdade (na 1.1.0 foi
  preciso reiniciar à mão) e confere que a versão nova está no ar.

## 1.1.0 — 24/10/2026
- Número da versão aparece no rodapé do menu e na tela de login.
- Botão **"Quitar"** das parcelas do financeiro na cor azul padrão.
- Publicação automática pelo GitHub (com aprovação, backup e volta automática se falhar).
- Banco de teste para os PCs: testes não mexem mais nos dados reais.
- Senhas com `bcryptjs` (sem compilação; as senhas atuais continuam valendo).
- Arquivos de `public/` (notificações, carregamento, validação e impressão do cupom)
  passaram a ser guardados no Git.

## 1.0.0 — até 22/02/2026
Versão que estava na produção antes do controle de versões. Principais recursos:
- Pessoas (clientes, técnicos, fornecedores), estoque com produtos novos e usados,
  movimentações.
- Ordens de serviço com agenda, impressão de cupom, recibo e envio por WhatsApp.
- Financeiro: contas a pagar e a receber, parcelas, filtros, relatórios e caixas
  (transferências, ajustes e conferência).
- Relatórios com exportação e PDF, paginação nas listas.
- Login com níveis de acesso (admin/comum) e auditoria.
