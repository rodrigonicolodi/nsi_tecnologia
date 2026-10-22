# NSI Tecnologia — guia para o Claude Code

Sistema de gestão (OS, pessoas, estoque, financeiro, caixas, relatórios, PDF) em
Node.js + Express 4 + EJS (express-ejs-layouts) + MySQL (mysql2/promise).

## Regras de segurança (obrigatórias)
- **Produção tem dados reais.** Nunca conectar, consultar ou alterar banco de
  produção nem acessar o servidor sem pedido explícito do usuário naquela hora.
- O `.env` local pode apontar para o banco de produção. Para testar o sistema,
  usar o "modo seguro" abaixo, que não toca em banco nenhum.
- Nunca commitar `.env` nem `node_modules/`. Nunca dar push na `main` sem pedido.
- O usuário está aprendendo: explicar passos de forma simples e confirmar antes
  de ações difíceis de desfazer.

## Estrutura
- `app.js` — entrada; o middleware de login global protege tudo exceto `rotasPublicas`.
  Novos routers devem ser montados **abaixo** dele.
- `routes/` e `controllers/` — regras de negócio e SQL (sempre com placeholders `?`).
- `views/` — telas EJS, uma pasta por módulo; `views/layout.ejs` é o layout.
- `public/` — CSS, JS e imagens estáticos.
- `db.js` — pool MySQL a partir das variáveis do `.env` (modelo: `config.env.example`).
- O repositório Git começa uma pasta acima: o código fica em `nsi_tecnologia/`
  e os workflows em `../.github/workflows/`.

## Rodar
```bash
npm ci        # depois de clonar ou quando o package.json mudar
npm start     # http://localhost:3000 — usa o banco do .env!
```
Modo seguro (sobe o sistema sem tocar em banco; login e telas com dados falham):
```bash
DB_HOST=127.0.0.1 DB_NAME=nao_existe DB_USER=x DB_PASSWORD=x PORT=3001 node app.js
```

## Fluxo de trabalho
- O usuário trabalha em 3 PCs (notebook, escritório, casa) sincronizando pelo GitHub.
- `develop` = trabalho do dia a dia. `main` = o que está em produção.
- Publicar = merge de `develop` em `main`; o GitHub Actions testa e, após
  aprovação manual no GitHub, publica no Integrator (ver `deploy-instructions.md`).
- Nunca enviar `node_modules` para o servidor (o bcrypt é nativo e muda por sistema).
