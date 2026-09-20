# syntax=docker/dockerfile:1

# Node 24 ships npm 11, the version that wrote package-lock.json.
FROM node:24-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# npm silently skips an optional native package it fails to download, and Docker would then
# cache that broken layer. Loading the two native modules the CSS build needs, in the same
# RUN, makes such an install fail (and stay uncached) instead of breaking `next build` later.
RUN npm ci && node -e "require('lightningcss'); require('@tailwindcss/oxide')"

# ---- build: `next build` with output "standalone" ---------------------------
FROM deps AS build
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# public/ may be empty (and so absent from a fresh clone); the runtime stage copies it.
RUN mkdir -p public && npm run build

# ---- runtime ------------------------------------------------------------------
FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000
WORKDIR /app
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
# BACKEND_URL (where the Training service listens) is read at request time.
CMD ["node", "server.js"]
