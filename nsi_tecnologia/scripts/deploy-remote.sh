#!/usr/bin/env bash
# Executado NO SERVIDOR (Integrator) pelo GitHub Actions, via ssh. Não rodar no PC.
#
# Uso: APP_DIR=... RESTART_METHOD=... bash deploy-remote.sh deploy|rollback
#
# deploy:   faz backup da pasta do app, extrai ~/deploy_nsi/release.tar.gz por cima
#           (nunca toca em .env nem node_modules), reinstala dependências só se o
#           package-lock.json mudou e reinicia o app.
# rollback: restaura o último backup e reinicia.
set -euo pipefail

ACAO="${1:-deploy}"
: "${APP_DIR:?APP_DIR não definido}"
RESTART_METHOD="${RESTART_METHOD:-passenger}"   # passenger | pm2 | none
PM2_NAME="${PM2_NAME:-nsi-tecnologia}"
DEPLOY_SHA="${DEPLOY_SHA:-desconhecido}"

TRABALHO="$HOME/deploy_nsi"
BACKUPS="$HOME/backups/nsi_tecnologia"
MANTER_BACKUPS=10

log() { echo "[deploy $(date '+%F %T')] $*"; }

ativar_node() {
  if [ -n "${NODEVENV_ACTIVATE:-}" ]; then
    if [ -f "$NODEVENV_ACTIVATE" ]; then
      set +u; source "$NODEVENV_ACTIVATE"; set -u
    else
      log "AVISO: NODEVENV_ACTIVATE não encontrado: $NODEVENV_ACTIVATE"
    fi
  fi
  command -v npm >/dev/null || { log "ERRO: npm não encontrado no servidor"; exit 1; }
  log "Node $(node -v), npm $(npm -v)"
}

instalar_dependencias() {
  ativar_node
  log "Instalando dependências (npm install --omit=dev)..."
  # --no-save: não reescreve o package-lock.json (ele deve continuar igual ao do Git)
  ( cd "$APP_DIR" && npm install --omit=dev --no-save --no-audit --no-fund )
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
      if command -v pm2 >/dev/null; then pm2 restart "$PM2_NAME"
      else "$APP_DIR/node_modules/.bin/pm2" restart "$PM2_NAME"; fi
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
