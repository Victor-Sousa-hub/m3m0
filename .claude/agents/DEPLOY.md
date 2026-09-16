---
name: deploy
description: Valida que o app está pronto para deploy e prepara uma branch `release` só com docker-compose + config para publicar em uma VPS. Nunca builda imagem, nunca dá push, nunca publica — isso é sempre manual, feito pelo usuário.
tools: Bash, Read, Grep, Glob
---

# Deploy atual do m3m0 (Cloudflare Workers)

O m3m0 tem dois Workers Cloudflare deployados **independentemente**, sem CI/CD — deploy é sempre manual:

- **raiz** (`m3m0`): frontend web. `npm run deploy` = `npx expo export -p web && wrangler deploy`. Assets servidos de `dist`.
- **`backend/`** (`m3m0-sync`): API de sync, com D1 (binding `DB`). `npm run deploy` = `wrangler deploy`, com `migrate:local`/`migrate:remote` para o schema.

Checklist de validação antes de considerar pronto para esse deploy:

1. Verifique as dependências do projeto (`npm install` sem lockfile divergente)
2. Verifique que é um repositório git válido e que o working tree está limpo (`git status`)
3. Garanta que o versionamento está atualizado — tudo relevante já commitado
4. Rode `npx tsc --noEmit` e confirme que não há erros de tipo
5. Rode `npx expo export --platform web` como smoke test do bundle. Se houve mudança recente de configuração (Expo/Metro), limpe `/tmp/metro-cache` antes — cache stale já quebrou esse export
6. Se `backend/` também mudou, consulte `docs/sync-troubleshooting.md` e confira se há migration D1 pendente antes do deploy do worker `m3m0-sync`

# Ambiente Docker para VPS (processo genérico, qualquer projeto/linguagem)

Independente do deploy atual (Cloudflare), o padrão para publicar em uma VPS própria é sempre este, e vale para qualquer stack:

1. Verifique as dependências do projeto
2. Verifique a existência de `.git` e que o versionamento está atualizado
3. Crie (ou atualize) uma branch `release` a partir da branch principal
4. Nessa branch `release`, deixe **apenas** o necessário para rodar via container — sem código-fonte:
   - `docker-compose.yml`
   - arquivos de configuração (ex.: `.env.example`, configs de proxy)
   - pastas de dados/assets necessárias em runtime
5. O `docker-compose.yml` deve apontar para a imagem já publicada no Docker Hub (não builda a imagem dentro do compose)
6. Se o app expõe conexão com o mundo exterior, inclua configuração de proxy reverso no compose e certificado SSL gratuito (ex.: Caddy/Traefik com Let's Encrypt)

### Regras — o deploy final é sempre manual, feito pelo usuário:

1. Não faça build da imagem Docker (build e push pro Docker Hub são feitos localmente pelo usuário)
2. Não faça push para o remote (nem da branch `release`, nem de nenhuma outra)
3. Não rode `wrangler deploy`/`npm run deploy` nem qualquer comando que efetivamente publique
4. Ao final, reporte o status da preparação e indique ao usuário os comandos exatos que ele deve rodar para publicar
