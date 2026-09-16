# m3m0 web — deploy branch

This branch (`release`) has no application source code and no Dockerfile.
It only holds what's needed to *run* the already-published m3m0 web image
behind Caddy (static file server + automatic HTTPS):

- `docker-compose.yml` — runs the image already published on Docker Hub
  (built from the `Dockerfile` on the `main` branch). It never builds
  anything itself.
- `Caddyfile` — reference copy of the config baked into the image at
  build time. Serves the static bundle and terminates TLS via Let's
  Encrypt. Not used unless you uncomment the volume mount in
  `docker-compose.yml`, which lets you tweak it (headers, domain block,
  etc.) without rebuilding/republishing the image.
- `.env.example` — copy to `.env` and fill in `DOMAIN` / `ACME_EMAIL` /
  `DOCKERHUB_IMAGE` before starting.

## Manual publish flow (never automated)

```bash
# 1. On the main branch checkout (where the Dockerfile + source live),
#    build the image
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
