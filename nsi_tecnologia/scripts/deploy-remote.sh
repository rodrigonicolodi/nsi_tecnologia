#!/usr/bin/env bash
# Executado NO SERVIDOR (Integrator) pelo GitHub Actions, via ssh. Não rodar no PC.
#
# Uso: APP_DIR=... RESTART_METHOD=... bash deploy-remote.sh deploy|rollback
#
# deploy:   faz backup da pasta do app, extrai ~/deploy_nsi/release.tar.gz por cima
#           (nunca toca em .env nem node_modules), reinstala dependências só se o
#           package-lock.json mudou e reinicia o app (conferindo que o pm2 reiniciou).
# rollback: restaura o último backup e reinicia.
set -euo pipefail

ACAO="${1:-deploy}"
: "${APP_DIR:?APP_DIR não definido}"
RESTART_METHOD="${RESTART_METHOD:-pm2}"   # pm2 (painel Integrator Node.js) | passenger | none
PM2_NAME="${PM2_NAME:-nsi_tecnologia}"   # nome no `pm2 list` do servidor
DEPLOY_SHA="${DEPLOY_SHA:-desconhecido}"

TRABALHO="$HOME/deploy_nsi"
BACKUPS="$HOME/backups/nsi_tecnologia"
MANTER_BACKUPS=10

log() { echo "[deploy $(date '+%F %T')] $*"; }

# No Integrator, "npm" e "pm2" do sistema são atalhos do painel que só acham o app
# quando rodam DENTRO da pasta dele; fora dela respondem "Project Node.js not found"
# e saem sem erro. Por isso tudo roda a partir do APP_DIR.
[ -d "$APP_DIR" ] || { log "ERRO: pasta do app não existe: $APP_DIR"; exit 1; }
cd "$APP_DIR"

ativar_node() {
  if [ -n "${NODEVENV_ACTIVATE:-}" ]; then
    if [ -f "$NODEVENV_ACTIVATE" ]; then
      set +u; source "$NODEVENV_ACTIVATE"; set -u
    else
      log "AVISO: NODEVENV_ACTIVATE não encontrado: $NODEVENV_ACTIVATE"
    fi
  fi
  # O Node que o app usa é o "interpreter" do app.yaml (o node solto do servidor é antigo)
  local interp
  interp="$(sed -n 's/^[[:space:]]*interpreter:[[:space:]]*//p' "$APP_DIR/app.yaml" 2>/dev/null | head -n1 | tr -d "\"' ")"
  if [ -n "$interp" ] && [ -x "$interp" ]; then
    export PATH="$(dirname "$interp"):$PATH"
  else
    log "AVISO: interpreter do app.yaml não encontrado; usando o node do sistema"
  fi
  command -v npm >/dev/null || { log "ERRO: npm não encontrado no servidor"; exit 1; }
  log "Node $(node -v) ($(command -v node)), npm $(npm -v)"
}

# Roda um comando e falha se ele der erro OU se for um atalho do painel dizendo que
# não achou o projeto (esses saem com sucesso mesmo sem fazer nada)
rodar() {
  local saida
  if ! saida="$("$@" 2>&1)"; then
    echo "$saida"
    log "ERRO: falhou: $*"
    exit 1
  fi
  echo "$saida"
  if echo "$saida" | grep -qiE 'Project Node\.js not found|NodeJS Selector demands'; then
    log "ERRO: o comando não encontrou o projeto: $*"
    exit 1
  fi
}

instalar_dependencias() {
  ativar_node
  log "Instalando dependências (npm install --omit=dev)..."
  # --no-save: não reescreve o package-lock.json (ele deve continuar igual ao do Git)
  rodar npm install --omit=dev --no-save --no-audit --no-fund
}

# Momento em que o PM2 (re)iniciou o app; muda a cada reinício
inicio_pm2() {
  pm2 jlist 2>/dev/null | node -e '
    let s = "";
    process.stdin.on("data", d => s += d).on("end", () => {
      try {
        // o atalho do painel pode escrever avisos antes do JSON: pegar só a lista
        const app = JSON.parse(s.slice(s.indexOf("[{"))).find(a => a.name === process.argv[1]);
        if (app) console.log(app.pm2_env.pm_uptime);
      } catch (e) {}
    });' "$PM2_NAME" || true
}

reiniciar() {
  case "$RESTART_METHOD" in
    passenger)
      mkdir -p "$APP_DIR/tmp"
      touch "$APP_DIR/tmp/restart.txt"
      log "Reinício solicitado (tmp/restart.txt)"
      ;;
    pm2)
      ativar_node
      command -v pm2 >/dev/null || { log "ERRO: pm2 não encontrado no servidor"; exit 1; }
      local antes depois
      antes="$(inicio_pm2)"
      [ -n "$antes" ] || { log "ERRO: processo \"$PM2_NAME\" não aparece no pm2"; exit 1; }
      rodar pm2 restart "$PM2_NAME"
      depois="$(inicio_pm2)"
      if [ -z "$depois" ] || [ "$depois" = "$antes" ]; then
        log "ERRO: o pm2 não reiniciou o app \"$PM2_NAME\""
        exit 1
      fi
      log "App reiniciado pelo pm2"
      ;;
    none)
      log "AVISO: RESTART_METHOD=none — reinicie o app manualmente no painel"
      ;;
    *)
      log "ERRO: RESTART_METHOD inválido: $RESTART_METHOD"; exit 1
      ;;
  esac
}

hash_lock() { sha256sum "$APP_DIR/package-lock.json" 2>/dev/null | cut -d' ' -f1 || true; }

deploy() {
  local release="$TRABALHO/release.tar.gz"
  [ -f "$APP_DIR/app.js" ] || { log "ERRO: $APP_DIR não parece ser a pasta do app"; exit 1; }
  [ -f "$release" ] || { log "ERRO: pacote $release não encontrado"; exit 1; }
  [ -f "$APP_DIR/.env" ] || log "AVISO: sem .env em $APP_DIR (ok se as variáveis estão no painel)"

  mkdir -p "$BACKUPS"
  local ts backup
  ts="$(date '+%Y%m%d-%H%M%S')"
  backup="$BACKUPS/$ts.tar.gz"
  log "Backup da versão atual em $backup"
  tar czf "$backup" -C "$APP_DIR" --exclude=./node_modules --exclude=./tmp .
  echo "$backup" > "$TRABALHO/ultimo_backup"
  rm -f "$TRABALHO/dependencias_alteradas"
  ls -1t "$BACKUPS"/*.tar.gz | tail -n +$((MANTER_BACKUPS + 1)) | xargs -r rm -f

  local antes depois
  antes="$(hash_lock)"
  log "Aplicando versão $DEPLOY_SHA"
  tar xzf "$release" -C "$APP_DIR"
  depois="$(hash_lock)"

  if [ "$antes" != "$depois" ]; then
    touch "$TRABALHO/dependencias_alteradas"
    instalar_dependencias
  else
    log "package-lock.json igual — dependências mantidas"
  fi

  printf '%s %s\n' "$DEPLOY_SHA" "$(date '+%F %T')" > "$APP_DIR/.versao"
  reiniciar
  rm -f "$release"
  log "Deploy concluído: $DEPLOY_SHA"
}

rollback() {
  local backup
  backup="$(cat "$TRABALHO/ultimo_backup" 2>/dev/null || true)"
  [ -n "$backup" ] && [ -f "$backup" ] || { log "ERRO: nenhum backup para restaurar"; exit 1; }
  log "Restaurando $backup"
  tar xzf "$backup" -C "$APP_DIR"
  if [ -f "$TRABALHO/dependencias_alteradas" ]; then
    instalar_dependencias
    rm -f "$TRABALHO/dependencias_alteradas"
  fi
  reiniciar
  log "Rollback concluído"
}

case "$ACAO" in
  deploy) deploy ;;
  rollback) rollback ;;
  *) log "Ação inválida: $ACAO (use deploy ou rollback)"; exit 1 ;;
esac
