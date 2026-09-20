# syntax=docker/dockerfile:1

# Node 24 ships npm 11, the version that wrote package-lock.json (npm 10 cannot `npm ci` it).
FROM node:24-bookworm-slim AS base
WORKDIR /app
COPY package.json package-lock.json ./

# ---- deps: full install (dev deps needed for build + prisma CLI) -------------
FROM base AS deps
# Prisma's schema engine (migrate) needs OpenSSL on Debian slim.
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
RUN npm ci --ignore-scripts

# ---- build: generate the Prisma client and compile ---------------------------
# Also used by the compose `migrate` job (it needs the prisma CLI + migrations).
FROM deps AS build
COPY . .
RUN npx prisma generate && npm run build

# ---- prod-deps: runtime dependencies only ------------------------------------
# Installed from scratch, and with --omit=optional as well: @prisma/client lists
# prisma/typescript/... as optional peers, which npm records as "devOptional" and keeps
# under a plain --omit=dev (~300MB of tooling that the running API never loads).
FROM base AS prod-deps
RUN npm ci --omit=dev --omit=optional --ignore-scripts

# ---- runtime -----------------------------------------------------------------
FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./
USER node
EXPOSE 4000
CMD ["node", "dist/main"]
