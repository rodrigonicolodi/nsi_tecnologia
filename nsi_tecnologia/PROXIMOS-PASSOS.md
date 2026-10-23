# 🧭 Próximos passos — NSI Tecnologia

Resumo do que já foi feito e do que falta. Para continuar em qualquer PC, diga ao
Claude Code: **"leia o PROXIMOS-PASSOS.md e vamos continuar"**.
Atualize este arquivo sempre que uma etapa for concluída.

## ✅ Feito (22/10/2026)
- Branch `develop` criada para o dia a dia; `main` = produção (intacta em `e17b56f`).
- `node_modules` saiu do Git (estava incompleto e com bcrypt compilado para Windows).
  Cada PC roda `npm ci`.
- `.gitignore` corrigido: arquivos novos em `public/` agora vão para o GitHub.
- `config.env.example` criado (modelo do `.env`, sem senhas).
- CI no GitHub Actions: a cada push na `develop`, testa se o sistema instala e sobe.
- Deploy automático pronto, **mas desligado** (`deploy.yml` + `scripts/deploy-remote.sh`).
- `CLAUDE.md` com as regras do projeto para o Claude Code.
- Notebook: tudo enviado ao GitHub; primeiro CI passou ✅.

## ⚠️ Descoberto em 22/10/2026
- **PCs podem ter alterações nunca commitadas.** No PC de casa, ao trocar para a
  `develop`, apareceram 6 arquivos modificados: `app.js`, `routes/financeiro.js`,
  `views/financeiro/editar.ejs`, `views/financeiro/exibir.ejs`, `views/os/editar.ejs`,
  `views/os/exibir.ejs`. Provavelmente foram publicados na produção pelo cPanel
  sem commit. **Nunca descartar** (nada de checkout/restore/reset/stash).
- **A produção pode ter código que não está no GitHub.** Publicar a versão do
  GitHub por cima apagaria essas alterações.
- **`npm ci` falha no PC de casa compilando o `bcrypt`** (nativo). Solução proposta:
  trocar por `bcryptjs` (100% JS, mesmo formato de hash, senhas atuais continuam válidas).

## 🔜 A fazer (em ordem)

### 1. Salvar no GitHub o que só existe nos PCs
- [x] PC de casa: commit `b6ca899` — 6 arquivos (problema informado da OS no
  financeiro, títulos das telas de OS, link da OS corrigido) + 5 arquivos de `public/`
  que o `.gitignore` antigo escondia (`notifications.js`, `loading.js`, `validation.js`,
  `cupom-print.js/.css`), usados no layout e na impressão do cupom. Revisado e testado.
- [x] PC de casa: `git log --oneline origin/main..main` e `git stash list` vazios — 100% salvo
- [ ] PC do escritório: `git status` **antes** de trocar de branch; se houver código
  modificado, commit + push primeiro

### 2. Trocar bcrypt por bcryptjs
- [x] Feito: `routes/auth.js` e `routes/usuarios.js` usam `bcryptjs`; `bcrypt` removido do
  `package.json`. Testado: bcryptjs aceita hashes antigos (`$2a$`/`$2b$`) e recusa senha errada.
  Não sobrou nenhuma dependência que precise compilar.

### 3. Atualizar os outros PCs
- [ ] PC de casa
- [ ] PC do escritório

Em cada um (com o Cursor fechado, para evitar erro EPERM): `git fetch`,
`git switch develop`, `npm ci`. **Não apagar o `.env`.**

### 4. Conferir produção × GitHub (ANTES de ligar o deploy)
- [ ] Usuário baixa pelo cPanel um `.zip` da pasta do app, **sem `node_modules` e sem `.env`**
  (só download, não altera nada).
- [ ] Comparar com a `develop` arquivo por arquivo e trazer para o GitHub o que só
  existe na produção.
- Até isso ser feito: publicar pelo cPanel **só os arquivos alterados**, nunca a pasta inteira.

### 5. Configurar o deploy automático (só depois do passo 4)
Passo a passo em `deploy-instructions.md`. Primeiro, anotar no painel do
Integrator (**Setup Node.js App**), só olhando:
- [ ] pasta do app (Application root)
- [ ] versão do Node do servidor (o CI usa a 22)
- [ ] caminho do `activate` do nodevenv
- [ ] como o app é reiniciado hoje (botão Restart do painel ou PM2)

Depois: chave SSH, secrets e variáveis no GitHub, ambiente `production` com
aprovação manual, proteção da `main` e, por fim, `DEPLOY_ENABLED=true`.
A primeira publicação deve ser acompanhada.

### 6. Banco de desenvolvimento
Hoje o `.env` dos PCs aponta para o **banco de produção** (testes mexem em dados reais).
- [ ] Confirmar qual banco a produção usa: o do Integrator ou o antigo da Locaweb
  (houve migração; pode haver dois).
- [ ] Usuário cria, pelo painel, um banco `rodri6000_nsi_dev` com a mesma estrutura.
- [ ] Trocar o `.env` dos 3 PCs para o banco novo.
- [ ] Versionar a estrutura do banco (arquivo `.sql` só com o schema, sem dados).

### 7. Melhorias no código (sem tocar em produção)
- [ ] Aviso vermelho na tela quando o sistema roda no PC conectado ao banco de produção.
- [ ] Tratar as 56 vulnerabilidades do `npm audit` (3 críticas), testando com calma.
- [ ] Scripts `backup*` do `package.json` apontam para `backup_database.js`, que não existe.
- [ ] `SESSION_SECRET` tem valor padrão fixo no `app.js` se faltar no `.env`.
- [ ] Criar os primeiros testes automáticos (o Jest está instalado, mas não há testes).

## ⚠️ Lembretes
- Publicação ainda é manual pelo cPanel até o deploy automático ser ligado:
  nunca enviar `node_modules` nem o `.env` do PC.
- Nada de mexer em banco ou servidor de produção sem decisão explícita do usuário.
