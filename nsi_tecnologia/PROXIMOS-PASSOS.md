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
- [x] PC do escritório (23/10/2026): estava parado em `0a55a62` (29/09/2025), sem commits
  perdidos. Só tinha `routes/usuarios.js` com `console.log` de depuração (com bug:
  variável `ativvo`) e uma alteração no `deploy-instructions.md` — descartados após
  backup em `C:\DivGit\backup-escritorio-alteracoes.txt` (no próprio PC do escritório).

### 2. Trocar bcrypt por bcryptjs
- [x] Feito: `routes/auth.js` e `routes/usuarios.js` usam `bcryptjs`; `bcrypt` removido do
  `package.json`. Testado: bcryptjs aceita hashes antigos (`$2a$`/`$2b$`) e recusa senha errada.
  Não sobrou nenhuma dependência que precise compilar.

### 3. Atualizar os outros PCs
- [x] PC de casa
- [x] PC do escritório
- ✅ Os 3 PCs (notebook, casa, escritório) estão na `develop`, iguais ao GitHub.

Em cada um (com o Cursor fechado, para evitar erro EPERM): `git fetch`,
`git switch develop`, `npm ci`. **Não apagar o `.env`.**

### 4. Conferir produção × GitHub (ANTES de ligar o deploy)
- [x] Zip da produção baixado em 23/10/2026 (`D:\DevGit\producao-2026-10-23.zip`, no notebook).
- [x] Comparado com a `develop` (`d725fec`). Resultado:
  - ✅ **84 arquivos idênticos** — inclusive os 5 de `public/` e as alterações do PC de casa
    (a produção estava igual ao PC de casa).
  - ✅ **A produção já usa `bcryptjs` desde 05/10/2025** (nunca tinha ido para o GitHub);
    a troca de hoje só alinhou o GitHub.
  - 📦 Mais novo no GitHub (ainda não publicado): `views/financeiro/parcelas.ejs` (botão
    "Quitar" azul; na produção está verde) e `app.js` (só formatação, sem efeito).
  - 🗂️ Só na produção, **do servidor — não trazer para o Git e não apagar**: `app.yaml` e
    `start.json` (configuração do processo no Integrator: Node **23.1.0**, porta **61910**,
    `NODE_ENV=production`), `stdout.log` (log), `pid-0.pid`.
  - 🗑️ Só na produção, sobras antigas sem uso: `app.js antigo`, `DEPLOYMENT_GUIDE.md`,
    `fix_nivel.js` (ajuste de coluna já aplicado), `start-server.bat`, `stop-server.bat`.
  - ⚠️ `package.json` da produção tem `escpos` e `pm2`, que **não são usados no código**.
- **Conclusão: não há código da produção faltando no GitHub.**

**Decidir antes do 1º deploy automático:** o deploy roda `npm install` quando o
`package-lock.json` muda (e vai mudar na 1ª vez), o que **remove `escpos` e `pm2`** do
`node_modules` do servidor. `escpos` não faz falta. Confirmar se o Integrator reinicia o
app com um `pm2` próprio (global) ou com o do projeto; se for o do projeto, adicionar
`pm2` ao `package.json` antes.

### 5. Configurar o deploy automático (passo 4 ✅ — pode seguir)
Já sabido pela comparação: Node **23.1.0** no servidor (CI alinhado para 23.1.0 em 23/10/2026),
porta 61910, processo gerenciado pelo painel do Integrator (`app.yaml`/`start.json`).
Falta o print da tela **Setup Node.js App** e o acesso ao cPanel (recuperado em 23/10/2026).
Passo a passo em `deploy-instructions.md`. Primeiro, anotar no painel do
Integrator (**Setup Node.js App**), só olhando:
- [x] pasta do app: `applications/nsi_tecnologia` (provável `/home/rodri6000/applications/nsi_tecnologia`)
- [x] versão do Node do servidor: **v23.1.0** (igual ao CI) — conferido no painel em 23/10/2026
- [ ] caminho do `node`/`npm` no servidor (o painel **não é** o "Setup Node.js App" do
  cPanel, e sim o **"Integrator Node.js"**, próprio da Integrator; talvez não exista `activate`)
- [ ] como o app é reiniciado hoje (chave liga/desliga do painel? aba **Deploy** do painel?)
  Suporte da Integrator (23/10/2026): o painel **opera com PM2** (e lê o `app.yaml`) —
  o `tmp/restart.txt` do script **não serve**. Via PuTTY (SSH `rodri6000@sistema.nsitecnologia.com.br`):
  `which pm2` → `/bin/pm2` (**global** — tirar `pm2` do `package.json` não quebra nada);
  `pm2 list` → processo **`nsi_tecnologia`** (id 0, online). Script e instruções já
  ajustados para `pm2 restart nsi_tecnologia`.
- [x] `node`/`npm`: o script pergunta ao PM2 qual Node roda o app (`pm2 jlist`) e usa
  o `npm` da mesma pasta; o log do deploy mostra a versão usada.
- [x] SSH: `sistema.nsitecnologia.com.br`, porta **22**, usuário `rodri6000`
  (sessão "NSI" salva no PuTTY do notebook).
- ✅ **Decidido (23/10/2026): usar o nosso script** (`deploy.yml` + `deploy-remote.sh`),
  que tem backup e volta automática. O Git do painel fica sem uso.
- Alternativa oferecida pela Integrator (não escolhida): deploy por Git do próprio painel
  ([wiki](https://wiki.integrator.com.br/index.php?title=Realizando_Deploy_via_Git_com_Node.js)).
  Com "Repositório Git: Automático" (já marcado), um push na `master` do repositório
  do servidor desliga o app, roda o NPM, troca os arquivos e religa. Suporte: arquivos
  que só existem no servidor (`.env` etc.) são **mantidos** por padrão.
  Não tem backup/rollback. O código fica na subpasta `nsi_tecnologia/` do nosso repo.
  Caminho do repositório: ícone **?** ao lado do app na aba Aplicativos.
- Tela de edição do app (23/10/2026): Index `app.js`, modo **Produção**, memória 128 MB,
  **nenhuma variável de ambiente no painel** (o sistema lê o `.env` da pasta do app —
  o deploy já preserva o `.env`). Opção "Repositório Git: Automático" marcada (ver o que faz).
- ⚠️ No mesmo painel há **outro app**, `controle_nsitecnologia` (porta 61911,
  `applications/controle_nsitecnologia`) — **não mexer nele**.

Feito em 23/10/2026 (notebook):
- [x] Chave SSH `github_deploy_nsi` (ed25519, sem senha) gerada no PC, pública importada
  e **autorizada** no cPanel (SSH Access → Manage SSH Keys). Cópia local apagada.
- [x] Secrets no GitHub: `SSH_PRIVATE_KEY`, `SSH_HOST` (`sistema.nsitecnologia.com.br`),
  `SSH_USER` (`rodri6000`). `SSH_PORT` não precisa (porta 22).
- [x] Login do Git no notebook trocado para **código de dispositivo**
  (`git config --global credential.gitHubAuthModes device`) — o antivírus bloqueava o
  login pelo navegador. Se acontecer nos outros PCs, usar o mesmo comando.

Feito em 23/10/2026 (PC de casa):
- [x] Secret `SSH_KNOWN_HOSTS` (saída do `ssh-keyscan -p 22 sistema.nsitecnologia.com.br`:
  chaves rsa, ecdsa e ed25519). Agora são 4 secrets.
- [x] Variables (conferido por print): `APP_DIR` = `/home/rodri6000/applications/nsi_tecnologia`,
  `APP_URL` = `https://sistema.nsitecnologia.com.br`.
  (`RESTART_METHOD` e `PM2_NAME` já têm padrão certo no script; não criar `NODEVENV_ACTIVATE`.)
- [x] Ambiente `production` (conferido pela API do GitHub): Required reviewers
  `rodrigonicolodi`, sem "Prevent self-review", só a `main` publica; bypass do admin ligado.

- [x] Proteção da `main` (classic rule; conferido pela API: protegida, check `teste` obrigatório):
  exige PR **sem** "Require approvals" (ninguém aprova o próprio PR); bypass do admin liberado.

**Continuar daqui:**
- [x] ⚠️ **O repositório no GitHub é público** (descoberto em 23/10/2026): o código é visível
  a todos, sem senhas nele. Conferido no cPanel: o `.env` **da produção** tem `SESSION_SECRET`
  próprio, então o valor padrão do `app.js` não é usado lá. Se um dia for deixar o repositório
  privado: no plano grátis, privado perde a aprovação manual do ambiente e a proteção da `main`.
- [x] Variável `DEPLOY_ENABLED` = `true` (23/10/2026, conferida por print). **Deploy ligado.**
  Sozinha ela não publica nada: o deploy só roda num merge na `main` (ou pelo botão
  "Run workflow") e ainda espera a aprovação.
- [ ] **1ª publicação, acompanhada e fora do horário de uso.** O que vai: botão "Quitar" azul
  (`parcelas.ejs`), formatação do `app.js` e documentação. Como o `package-lock.json` muda, o
  servidor roda `npm install`, que remove `escpos` e `pm2` do projeto (sem uso; o `pm2` do
  servidor é o global `/bin/pm2`). Ficar de olho: se a versão do `puppeteer` mudar, o
  `npm install` baixa um Chrome novo (~170 MB), o que pode demorar e ocupar espaço.

**Como publicar com o deploy ligado:** trabalhar na `develop` → no GitHub, abrir PR
`develop` → `main` → teste verde → **Merge** → o deploy espera → **Review deployments →
Approve and deploy**.

### 6. Banco de desenvolvimento
Hoje o `.env` dos PCs aponta para o **banco de produção** (testes mexem em dados reais).
- [ ] Confirmar qual banco a produção usa: o do Integrator ou o antigo da Locaweb
  (houve migração; pode haver dois).
- [ ] Usuário cria, pelo painel, um banco `rodri6000_nsi_dev` com a mesma estrutura.
- [ ] Trocar o `.env` dos 3 PCs para o banco novo.
- [ ] Versionar a estrutura do banco (arquivo `.sql` só com o schema, sem dados).

### 7. Melhorias no código (sem tocar em produção)
- [ ] ⚠️ **Trocar o Node 23.1.0 do servidor por uma versão LTS** (Node 22 ≥ 22.23.4 ou
  Node 24 ≥ 24.22.1). O Node 23 está sem suporte desde 2025, então **não recebe correções de
  segurança**, como a da falha do Brotli (CVE-2026-111497, corrigida em 21/10/2026).
  O risco direto no nosso sistema é baixo: o servidor não usa `fetch` nem descompacta Brotli,
  e o Express 4 não decodifica Brotli. Mesmo assim, o Node 23 vai acumular falhas sem correção.
  Antes, ver no painel do Integrator quais versões existem; testar no PC e no CI
  (`ci.yml`) antes de trocar na produção.
- [ ] Aviso vermelho na tela quando o sistema roda no PC conectado ao banco de produção.
- [ ] Tratar as 56 vulnerabilidades do `npm audit` (3 críticas), testando com calma.
- [ ] Scripts `backup*` do `package.json` apontam para `backup_database.js`, que não existe.
- [ ] `SESSION_SECRET` tem valor padrão fixo no `app.js` se faltar no `.env`.
- [ ] Criar os primeiros testes automáticos (o Jest está instalado, mas não há testes).
- [ ] **O sistema às vezes cai na produção** e precisava ser reiniciado (motivo do contato
  com o suporte). Investigar pelo `stdout.log`: suspeitas são a memória de só **128 MB**
  (o Puppeteer/Chrome do PDF consome muito) e erros não tratados ou queda da conexão com o banco.

## ⚠️ Lembretes
- Publicação ainda é manual pelo cPanel até o deploy automático ser ligado:
  nunca enviar `node_modules` nem o `.env` do PC.
- Nada de mexer em banco ou servidor de produção sem decisão explícita do usuário.

---

# 📋 Comandos — guia rápido

> 🥇 **Regra de ouro: chegou no PC → `git pull`. Terminou → `git push`.**
> Os PCs não conversam entre si; tudo passa pelo GitHub.

## 🟢 Ao começar a trabalhar (sempre)
```bash
git status        # 1ª linha deve ser "On branch develop"
git pull          # recebe o que foi feito nos outros PCs
npm ci            # SÓ se o pull trouxe package.json ou package-lock.json
```
⚠️ Se aparecer `On branch main` → `git switch develop` antes de mexer em qualquer coisa.

## 🧪 Testar no PC
```bash
npm start         # abre em http://localhost:3000 — parar com Ctrl+C
```
⚠️ **O `.env` aponta para o BANCO DE PRODUÇÃO**: olhar à vontade, mas não cadastrar,
editar ou excluir dados de teste.

## 🔴 Ao terminar (nunca sair sem isso)
```bash
git status                      # confere o que mudou (nunca deve aparecer .env)
git add -A
git commit -m "o que foi feito"
git push                        # envia para o GitHub
```
Ou peça ao Claude: **"faça o commit e o push do que fizemos"**.

## 🔍 Conferir se o PC está igual ao GitHub
```bash
git fetch
git status
```
| Mensagem | Significa | Fazer |
|---|---|---|
| `up to date` + `nothing to commit` | igual ✅ | nada |
| `Your branch is behind` | falta receber | `git pull` |
| `Your branch is ahead` | falta enviar | `git push` |
| arquivos em vermelho | alterações sem commit | commit + push |

Trabalho esquecido (os dois devem voltar **vazios**):
```bash
git log --oneline origin/main..main    # commits nunca enviados
git stash list                         # alterações guardadas e esquecidas
```

## 🚀 Publicar na produção (manual, até ligar o deploy automático)
1. Pergunte ao Claude: **"quais arquivos mudaram desde a última publicação?"**
2. cPanel → Gerenciador de Arquivos → subir **só esses arquivos**, na mesma pasta.
3. Mudou `routes/`, `controllers/` ou `app.js` → **reiniciar o app** no painel
   (Setup Node.js App). Só `views/` ou `public/` → costuma aparecer na hora.
4. Se mudou `package.json`: rodar **"Run NPM Install"** no painel antes de reiniciar.
   (O `bcryptjs` já está instalado na produção — conferido em 23/10/2026.)

❌ Nunca subir `node_modules` nem o `.env` do PC. Nunca subir a pasta inteira.

## 🏢 PC novo ou que estava parado (1ª vez na `develop`)
_(Usado no PC do escritório em 23/10/2026; serve para qualquer PC que ainda esteja na `main`.)_
**Primeiro só olhar** (não altera nada) e mandar o print:
```bash
git status
git log --oneline origin/main..main
git stash list
```
- ⚠️ Lá o `.gitignore` antigo **esconde arquivos novos de `public/`**: eles só
  aparecem depois de trocar para a `develop`.
- **Tudo limpo** (nothing to commit + os outros dois vazios):
  ```bash
  git fetch
  git switch develop
  npm ci
  ```
- **Com alterações** → não trocar de branch; pedir ajuda para salvar primeiro.
- ⚠️ Erro **"would be overwritten"** no `git switch` → **não forçar**: o escritório
  tem versões próprias de arquivos que já estão no GitHub; comparar antes.

## 🆘 Deu erro?
- `EPERM` no `npm ci` → fechar terminais com `npm start` rodando, apagar a pasta
  `node_modules` e rodar `npm ci` de novo.
- Push pede login → janela do GitHub: **"Sign in with your browser"**.
  ❌ Nunca digitar a senha no terminal nem na aba "Token" (não funciona e bloqueia a conta).
- Qualquer mensagem estranha → **parar e mostrar ao Claude** antes de continuar.

## ⛔ Comandos que APAGAM trabalho — não usar sem ajuda
```bash
git checkout -- <arquivo>     git restore <arquivo>     git reset --hard
git clean                     git stash drop            git push --force
```
Também não apagar a pasta do projeto nem o `.env`.
