# 🚀 Deploy — NSI Tecnologia

## Como funciona
```
develop ── trabalho do dia a dia (3 PCs). Cada push roda o teste automático (CI).
   │
   ▼  merge quando estiver pronto
main ───── GitHub Actions: testa → espera SUA aprovação → publica no Integrator
```
O deploy (`.github/workflows/deploy.yml` + `scripts/deploy-remote.sh`):
1. envia **só os arquivos do Git** (nunca `node_modules` nem `.env`);
2. faz **backup** da versão atual em `~/backups/nsi_tecnologia/` (guarda os 10 últimos);
3. aplica a nova versão por cima (não apaga arquivos que só existem no servidor);
4. roda `npm install` **apenas se o `package-lock.json` mudou**;
5. reinicia o app e confere se `/login` responde;
6. se algo falhar, **volta sozinho** para o backup.

O banco de dados **não é tocado** pelo deploy. A versão publicada fica em `.versao` na pasta do app.

## Dia a dia
```bash
git pull                 # ao chegar no PC
npm ci                   # se o package.json mudou (ou 1ª vez no PC)
# ... trabalha ...
git add -A
git commit -m "descrição"
git push                 # na develop
```
Para publicar: no GitHub, abra um Pull Request de `develop` → `main`, confira e faça o merge.
Depois, em **Actions → Deploy produção**, clique em **Review deployments → Approve**.

## Configuração única (servidor + GitHub)
Feita uma vez só. Até lá o deploy fica desligado.

### 1. Dados do servidor (levantados em 23/10/2026)
O painel é o **Integrator Node.js** (não o "Setup Node.js App" padrão do cPanel) e roda o app com **PM2 global** (`/bin/pm2`).
- `APP_DIR`: `/home/rodri6000/applications/nsi_tecnologia`
- Node **v23.1.0** (o teste usa a mesma)
- Nome no PM2: **`nsi_tecnologia`** (`pm2 list`) → reinício com `pm2 restart nsi_tecnologia`
- No mesmo servidor roda **outro app**, `controle_nsitecnologia` — o deploy não mexe nele.
- `NODEVENV_ACTIVATE`: não existe nesse painel (deixar vazio, se `node`/`npm` funcionarem pelo SSH)

### 2. Criar chave SSH só para o GitHub
No cPanel → **Acesso SSH → Gerenciar chaves SSH → Gerar nova chave** (nome `github_deploy`, sem senha).
Depois **Gerenciar → Autorizar** a chave pública, e **Exibir/Baixar** a chave **privada**.

### 3. Cadastrar no GitHub
Repositório → **Settings → Secrets and variables → Actions**.

**Secrets** (ficam ocultos):
| Nome | Valor |
|---|---|
| `SSH_HOST` | endereço SSH do Integrator |
| `SSH_PORT` | porta SSH (se não for 22) |
| `SSH_USER` | `rodri6000` |
| `SSH_PRIVATE_KEY` | conteúdo da chave privada do passo 2 |
| `SSH_KNOWN_HOSTS` | saída de `ssh-keyscan -p PORTA HOST` (rodar no PC) |

**Variables**:
| Nome | Exemplo |
|---|---|
| `APP_DIR` | `/home/rodri6000/applications/nsi_tecnologia` |
| `APP_URL` | `https://sistema.nsitecnologia.com.br` |
| `RESTART_METHOD` | `pm2` (padrão) |
| `NODEVENV_ACTIVATE` | não criar (o painel Integrator não usa) |
| `PM2_NAME` | `nsi_tecnologia` (padrão) |
| `DEPLOY_ENABLED` | `true` — **criar por último**, liga o deploy |

### 4. Exigir aprovação
**Settings → Environments → New environment** `production` → marque **Required reviewers** e adicione você.

### 5. Proteger a main
**Settings → Branches → Add rule** para `main`: exigir Pull Request e o check **CI** passando.

## Voltar uma versão manualmente
Os backups ficam em `~/backups/nsi_tecnologia/AAAAMMDD-HHMMSS.tar.gz`. Para restaurar o último:
```bash
APP_DIR=/home/rodri6000/applications/nsi_tecnologia RESTART_METHOD=pm2 \
  bash ~/applications/nsi_tecnologia/scripts/deploy-remote.sh rollback
```

## ⚠️ Nunca
- enviar `node_modules` para o servidor (o servidor instala as próprias dependências);
- enviar o `.env` de um PC para o servidor;
- commitar `.env`.
