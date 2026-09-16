# m3m0 web — deploy branch

This branch (`release`) has no application source code. It only holds
what's needed to build and run the already-exported m3m0 web build behind
Caddy (static file server + automatic HTTPS):

- `Dockerfile` — multi-stage build: clones the app source from git,
  runs `npx expo export --platform web`, then ships only the static
  `dist/` output in a `caddy:2-alpine` image.
- `Caddyfile` — serves the static bundle and terminates TLS via Let's
  Encrypt (baked into the image, overridable at runtime — see
  `docker-compose.yml`).
- `docker-compose.yml` — runs the already-published image from Docker
  Hub. It does not build anything.
- `.env.example` — copy to `.env` and fill in `DOMAIN` / `ACME_EMAIL` /
  `DOCKERHUB_IMAGE` before starting.

## Manual publish flow (never automated)

```bash
# 1. Build the image (source is fetched from git inside the Dockerfile;
#    defaults to the `main` branch of the m3m0 repo)
docker build -t <dockerhub-user>/m3m0-web:latest .

# 2. Push it to Docker Hub
docker push <dockerhub-user>/m3m0-web:latest

# 3. On the target host: copy this branch's files (or `git clone --branch
#    release --single-branch`), fill in .env, then start it
cp .env.example .env   # edit DOMAIN / ACME_EMAIL / DOCKERHUB_IMAGE
docker compose up -d
```

Ports 80 and 443 must be reachable from the internet for Caddy to
complete the Let's Encrypt HTTP-01 challenge.
