# ==========================================
# DEV TARGET
# Intended for local/development use
# ==========================================
FROM node:22-bookworm-slim AS dev
USER root
RUN apt-get update && apt-get install -y \
    git \
    openssh-client \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*
RUN npm install -g opencode-ai

USER node

COPY --chown=node:node .devcontainer/.bashrc /home/node/.bashrc
RUN git config --global --add safe.directory /workspace
WORKDIR /workspace

EXPOSE 3000

CMD ["bash"]


# ==========================================
# BUILD BASE (shared dependencies for prod builds)
# ==========================================
FROM node:22-alpine AS build-base
WORKDIR /app
COPY package*.json ./
RUN npm ci


# ==========================================
# BUILD-NODE TARGET (intermediate)
# ==========================================
FROM build-base AS build-node
COPY . ./
RUN npm run build --if-present


# ==========================================
# RELEASE-NODE TARGET (Single-Instance Production)
# Requires runtime env vars:
#   NUXT_MEILISEARCH_HOST
#   NUXT_MEILISEARCH_API_KEY
# ==========================================
FROM dhi.io/node:22-alpine AS release-node
WORKDIR /app
COPY --from=build-node --chown=nonroot:nonroot /app/.output/ ./

ENV PORT=3000
ENV HOST=0.0.0.0
ENV NUXT_SECURE_MODE=true
ENV NODE_ENV=production

USER nonroot

EXPOSE 3000

CMD ["/app/server/index.mjs"]


# ==========================================
# BUILD-NGINX TARGET (intermediate)
# ==========================================
FROM build-base AS build-nginx
ENV NUXT_PUBLIC_STATIC_DEPLOY=true
COPY . ./
RUN npm run generate --if-present


# ==========================================
# RELEASE-NGINX TARGET (Multi-Instance Static)
# Serves pre-generated static files via nginx
# ==========================================
FROM nginxinc/nginx-unprivileged:alpine AS release-nginx
COPY --from=build-nginx /app/.output/public /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
