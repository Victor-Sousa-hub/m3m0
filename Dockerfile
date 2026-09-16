# syntax=docker/dockerfile:1.7

# m3m0 web — static export served by Caddy
#
# This file lives on the `release` branch, which never carries the app's
# source code. The build stage fetches the source straight from git (a
# public clone by default) at GIT_REF, runs the same Expo web export used
# for the Cloudflare deploy, and the final stage ships only the resulting
# static bundle behind Caddy (which also terminates TLS — see Caddyfile).
#
# node:22-bookworm-slim (glibc), not alpine, on purpose: `expo export`
# pulls in `sharp` for asset processing, and its prebuilt musl binaries
# have historically been flaky on alpine. The final image is caddy:2-alpine
# regardless, so this only affects the (discarded) build layer.
#
# Build & publish locally — never done automatically:
#   docker build -t <dockerhub-user>/m3m0-web:latest .
#   docker push <dockerhub-user>/m3m0-web:latest
#
# To build a specific commit/tag instead of main:
#   docker build --build-arg GIT_REF=<tag-or-sha> -t <dockerhub-user>/m3m0-web:<tag> .
#
# For a private repo, pass an HTTPS URL with an embedded token:
#   docker build --build-arg GIT_REPO=https://<token>@github.com/Victor-Sousa-hub/m3m0.git .

ARG GIT_REPO=https://github.com/Victor-Sousa-hub/m3m0.git
ARG GIT_REF=main

FROM node:22-bookworm-slim AS build
ARG GIT_REPO
ARG GIT_REF
RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
RUN git clone --depth 1 --branch "${GIT_REF}" "${GIT_REPO}" .
RUN npm ci
RUN npx expo export --platform web

FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
EXPOSE 80 443
