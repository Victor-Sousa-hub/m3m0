# m3m0 web — deploy branch

This branch (`release`) has no application source code and no Dockerfile.
It only holds what's needed to *run* the already-published m3m0 web image
as a backend behind the VPS's shared edge proxy (see `/PROXY` at the repo
root, sibling to `m3m0/` and `ramadam/`):

- `docker-compose.yml` — runs the image already published on Docker Hub
  (built from the `Dockerfile` on the `main` branch). It never builds
  anything itself. No ports are published to the host — the container only
  joins the external `edge_net` network, reachable by the edge proxy as
  `m3m0_web:80`.
- `Caddyfile` — reference copy of the config baked into the image at
  build time. Serves the static bundle on plain HTTP (`:80`); it does
  **not** terminate TLS — that's the edge proxy's job now. Not used unless
  you uncomment the volume mount in `docker-compose.yml`, which lets you
  tweak it (headers, etc.) without rebuilding/republishing the image.
- `.env.example` — copy to `.env` and fill in `DOCKERHUB_IMAGE`/`IMAGE_TAG`
  before starting. No domain/TLS variables here anymore — those live once,
  for every project, in `/PROXY/.env` (`M3M0_DOMAIN`).

## Manual publish flow (never automated)

```bash
# 1. On the main branch checkout (where the Dockerfile + source live),
#    build the image
docker build -t <dockerhub-user>/m3m0-web:latest .

# 2. Push it to Docker Hub
docker push <dockerhub-user>/m3m0-web:latest

# 3. On the target host: make sure the shared edge network exists (created
#    once, shared with every project behind the edge proxy)
docker network create edge_net   # no-op if it already exists

# 4. Copy this branch's files (or `git clone --branch release
#    --single-branch`), fill in .env, then start it
cp .env.example .env   # edit DOCKERHUB_IMAGE / IMAGE_TAG
docker compose up -d

# 5. Point the edge proxy at it — set M3M0_DOMAIN in /PROXY/.env and
#    (re)start the edge proxy compose. See /PROXY/README.md.
```
