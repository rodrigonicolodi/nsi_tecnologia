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

## 🔜 A fazer (em ordem)

### 1. Atualizar os outros PCs
- [ ] PC de casa
- [ ] PC do escritório

Em cada um: conferir `git status` (nada de código pendente), apagar a pasta
`node_modules` e rodar `git fetch`, `git switch develop`, `npm ci`.
**Não apagar o `.env`.**

### 2. Configurar o deploy automático
Passo a passo em `deploy-instructions.md`. Primeiro, anotar no painel do
Integrator (**Setup Node.js App**), só olhando:
- [ ] pasta do app (Application root)
- [ ] versão do Node do servidor (o CI usa a 22)
- [ ] caminho do `activate` do nodevenv
- [ ] como o app é reiniciado hoje (botão Restart do painel ou PM2)

Depois: chave SSH, secrets e variáveis no GitHub, ambiente `production` com
aprovação manual, proteção da `main` e, por fim, `DEPLOY_ENABLED=true`.
A primeira publicação deve ser acompanhada.

### 3. Banco de desenvolvimento
Hoje o `.env` dos PCs aponta para o **banco de produção** (testes mexem em dados reais).
- [ ] Confirmar qual banco a produção usa: o do Integrator ou o antigo da Locaweb
  (houve migração; pode haver dois).
- [ ] Usuário cria, pelo painel, um banco `rodri6000_nsi_dev` com a mesma estrutura.
- [ ] Trocar o `.env` dos 3 PCs para o banco novo.
- [ ] Versionar a estrutura do banco (arquivo `.sql` só com o schema, sem dados).

### 4. Melhorias no código (sem tocar em produção)
- [ ] Aviso vermelho na tela quando o sistema roda no PC conectado ao banco de produção.
- [ ] Tratar as 56 vulnerabilidades do `npm audit` (3 críticas), testando com calma.
- [ ] Remover `bcryptjs` (instalado, mas não usado).
- [ ] Scripts `backup*` do `package.json` apontam para `backup_database.js`, que não existe.
- [ ] `SESSION_SECRET` tem valor padrão fixo no `app.js` se faltar no `.env`.
- [ ] Criar os primeiros testes automáticos (o Jest está instalado, mas não há testes).

## ⚠️ Lembretes
- Publicação ainda é manual pelo cPanel até o deploy automático ser ligado:
  nunca enviar `node_modules` nem o `.env` do PC.
- Nada de mexer em banco ou servidor de produção sem decisão explícita do usuário.
