# syntax=docker/dockerfile:1.7

# m3m0 web — static export served by Caddy
#
# Multi-stage build: stage 1 runs the same `expo export --platform web`
# used for the Cloudflare deploy; stage 2 ships only the resulting static
# bundle in a `caddy:2-alpine` image. This Caddy only serves plain HTTP on
# :80 — TLS is terminated by the VPS edge proxy in front of it (see
# /PROXY at the repo root, and this image's Caddyfile).
#
# node:22-bookworm-slim (glibc), not alpine, on purpose: `expo export`
# pulls in `sharp` for asset processing, and its prebuilt musl binaries
# have historically been flaky on alpine. The final image is caddy:2-alpine
# regardless, so this only affects the (discarded) build layer.
#
# Build & publish locally, from this checkout's repo root — never done
# automatically:
#   docker build -t <dockerhub-user>/m3m0-web:latest .
#   docker push <dockerhub-user>/m3m0-web:latest
#
# The `release` branch's docker-compose.yml only ever *runs* the image
# published here; it has no Dockerfile and never builds anything.

FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx expo export --platform web

FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
EXPOSE 80
