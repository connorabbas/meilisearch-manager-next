# Meilisearch Manager

A Nuxt-based web UI for managing Meilisearch instances.

This project is the refactored Nuxt version of the original Vue SPA project: [connorabbas/meilisearch-manager](https://github.com/connorabbas/meilisearch-manager).

## Features

- :rocket: **Multi-instance** mode for local development and testing
- :lock: **Secure single-instance** mode for production deployments
- :bar_chart: **Dashboard** with stats and version details
- :open_file_folder: **Indexes** listing, creation, inspection, primary key updates, and deletion
- :gear: **Index settings** full JSON viewer/editor
- :page_facing_up: **Documents** import, search (full-text, geo), sort, filter, pagination, edit, and delete flows
- :key: **API keys** create, view, edit, copy, and delete flows
- :ballot_box_with_check: **Tasks** history with filtering, infinite scroll, and optional polling
- :hourglass: **Data backups** with dump and snapshot exports
- :test_tube: **Experimental features** toggling
- :iphone: **Responsive** layout
- :waning_crescent_moon: **Dark mode** support

## Getting Started

### Demo

Check out the live demo (hosted with GitHub pages): [https://connorabbas.github.io/meilisearch-manager-next/](https://connorabbas.github.io/meilisearch-manager-next/)

## Configuration

The app supports two distinct operational modes, each designed for a different use case.

### Multi-Instance Mode

Designed for **local development, testing, and exploration**.

In this mode, the app behaves as a pure client-side SPA. You can add, manage, and switch between multiple Meilisearch instances directly from the browser UI. Instance credentials (host and API key) are stored in the browser's `localStorage`.

**Characteristics:**

- Manage multiple Meilisearch instances from one dashboard
- Credentials stored in browser `localStorage` (never sent to any backend server)
- The Meilisearch JavaScript client runs directly in the browser
- Your Meilisearch instance must expose appropriate CORS headers
- Can be deployed statically (GitHub Pages, S3, CDN, etc.)

> [!NOTE]
> Credentials in `localStorage` are isolated to the browser and the app's origin. They are not transmitted to any server. This is generally safe for development and testing, but may not meet organizational security requirements for production use.

### Secure Single-Instance Mode (Production)

Designed for **production deployments** where you want to manage a single Meilisearch instance without exposing admin credentials to the browser.

In this mode, the app runs behind a Nitro server. The admin API key lives only in server-side environment variables. All Meilisearch requests are transparently proxied through the app's backend, which injects the real credentials server-side.

```env
NUXT_MEILISEARCH_HOST=https://your-instance-domain.com
NUXT_MEILISEARCH_API_KEY=yourAdminApiKey
```

**Characteristics:**

- Admin API key is **server-side only** - never exposed to the client
- All requests proxied through `/api/meilisearch/*` with credentials injected by Nitro
- Instance management UI is disabled (single pre-configured instance only)
- Eliminates CORS concerns (browser talks to same-origin proxy)
- **Requires a running Nitro server (Node environment)** - cannot be used with static hosting

**Typical deployment:** Host the app alongside your Meilisearch instance (same network/VPC, or behind the same reverse proxy) so the Nitro server can reach Meilisearch securely.

### Explicit Mode Control

You can explicitly force a mode with `NUXT_SECURE_MODE`:

```env
NUXT_SECURE_MODE=true   # Force secure mode (throws on startup if credentials missing)
NUXT_SECURE_MODE=false  # Force multi-instance mode (even if credentials are set)
```

If omitted (default is `'auto'`), the app auto-detects: secure mode activates when both `NUXT_MEILISEARCH_HOST` and `NUXT_MEILISEARCH_API_KEY` are present.

### Static Deployments

For static hosting (GitHub Pages, S3, CDN), set:

```env
NUXT_PUBLIC_STATIC_DEPLOY=true
```

This skips the server configuration check entirely and boots directly into multi-instance mode. This is automatically set in the GitHub Pages workflow.

## Docker Images

Pre-built images are published to [Docker Hub](https://hub.docker.com/r/cabbas23/meilisearch-manager) for both operational modes.

### Available Tags

| Target | Tag | Description |
|--------|-----|-------------|
| Node | `node-latest` | Latest Node single-instance build |
| Node | `node-<semver>` | Specific release (e.g., `node-1.6.0`) |
| Nginx | `nginx-latest` | Latest nginx static multi-instance build |
| Nginx | `nginx-<semver>` | Specific release (e.g., `nginx-1.6.0`) |

Both support `linux/amd64` and `linux/arm64`.

### Nginx Image (Multi-Instance)

The `nginx` images run in multi-instance (browser-only) mode, and are meant for local, development, or testing environments.

> [!INFO]
> The `nginx` images expose **port 8080**

#### docker run

```bash
docker run -p 3000:8080 \
  cabbas23/meilisearch-manager:nginx-latest
```

#### Docker Compose

A simple compose stack to setup a running meilisearch instance and manager UI locally.

```yml
services:
  manager:
    image: cabbas23/meilisearch-manager:nginx-latest
    container_name: meilisearch-manager-nginx
    ports:
      - '${FORWARD_MEILISEARCH_MANAGER_PORT:-8080}:8080'
    networks:
      - meili

  meilisearch:
    image: getmeili/meilisearch:${MEILISEARCH_VERSION:-latest}
    container_name: meilisearch-manager-nginx-instance
    ports:
      - '${FORWARD_MEILISEARCH_PORT:-7700}:7700'
    environment:
      MEILI_NO_ANALYTICS: ${MEILISEARCH_NO_ANALYTICS:-true}
      MEILI_MASTER_KEY: ${MEILISEARCH_MASTER_KEY:-masterKey}
      MEILI_ENV: ${MEILISEARCH_ENV:-development}
    volumes:
      - ./meili_data:/meili_data
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--spider", "http://127.0.0.1:7700/health"]
      retries: 3
      timeout: 5s
    networks:
      - meili

networks:
  meili:
```

### Node Image (Secure Single-Instance)

The `node` images run in the secure single instance mode, and are meant for production use. The images are built on top of the official [Docker Hardened Images](https://www.docker.com/products/hardened-images/) (`dhi.io/node:22-alpine`), providing a minimal runtime with near-zero CVEs.

> [!INFO]
> The `node` images expose **port 3000** and require the `NUXT_MEILISEARCH_HOST` and `NUXT_MEILISEARCH_API_KEY` runtime variables to be set

#### docker run

```bash
docker run -p 8080:3000 \
  -e NUXT_MEILISEARCH_HOST=https://your-instance-domain.com \
  -e NUXT_MEILISEARCH_API_KEY=yourAdminApiKey \
  cabbas23/meilisearch-manager:node-latest
```

#### Docker Compose

Example production-ready compose stack using [Traefik](https://doc.traefik.io/traefik/reference/install-configuration/providers/docker/) as a reverse proxy. Treafik would typically be setup as it's own service in a different compose stack, you can reference [this example](https://github.com/connorabbas/traefik-docker-compose/blob/master/docker-compose.yml).

```yml
services:
  manager:
    image: cabbas23/meilisearch-manager:node-latest
    container_name: meilisearch-manager
    environment:
      NUXT_MEILISEARCH_HOST: ${MEILISEARCH_HOST:-http://meilisearch:7700}
      NUXT_MEILISEARCH_API_KEY: ${MEILISEARCH_MASTER_KEY:?Set MEILISEARCH_MASTER_KEY}
    depends_on:
      meilisearch:
        condition: service_healthy
    labels:
      - 'traefik.enable=true'
      - 'traefik.docker.network=traefik_proxy'
      - 'traefik.http.routers.meilisearch-manager.rule=Host(`${MEILISEARCH_MANAGER_DOMAIN:-meilisearch-manager.yourdomain.com}`)'
      - 'traefik.http.routers.meilisearch-manager.entrypoints=websecure'
      - 'traefik.http.routers.meilisearch-manager.tls=true'
      - 'traefik.http.routers.meilisearch-manager.tls.certresolver=letsencrypt'
      - 'traefik.http.services.meilisearch-manager.loadbalancer.server.port=3000'
      - 'traefik.http.services.meilisearch-manager.loadbalancer.healthcheck.path=/up'
      - 'traefik.http.services.meilisearch-manager.loadbalancer.healthcheck.interval=30s'
      - 'traefik.http.services.meilisearch-manager.loadbalancer.healthcheck.timeout=5s'
      - 'traefik.http.services.meilisearch-manager.loadbalancer.healthcheck.scheme=http'
    networks:
      - proxy
      - meili

  meilisearch:
    image: getmeili/meilisearch:${MEILISEARCH_VERSION:-latest}
    container_name: meilisearch-manager-instance
    environment:
      MEILI_NO_ANALYTICS: ${MEILISEARCH_NO_ANALYTICS:-true}
      MEILI_MASTER_KEY: ${MEILISEARCH_MASTER_KEY:?Set MEILISEARCH_MASTER_KEY}
      MEILI_ENV: ${MEILISEARCH_ENV:-production}
    volumes:
      - meilisearch-data:/meili_data
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--spider", "http://127.0.0.1:7700/health"]
      retries: 3
      timeout: 5s
    networks:
      - meili

volumes:
  meilisearch-data:

networks:
  meili:
    internal: true
  proxy:
    name: traefik_proxy
    external: true
```

## Tech Stack

- [Nuxt 4](https://nuxt.com/)
- [Vue 3](https://vuejs.org/) with Composition API and [TypeScript](https://www.typescriptlang.org/)
- [PrimeVue](https://primevue.org/)
- [Pinia](https://pinia.vuejs.org/) via [`@pinia/nuxt`](https://nuxt.com/modules/pinia)
- [VueUse](https://vueuse.org/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [`@nuxt/fonts`](https://nuxt.com/modules/fonts)
- [Lucide Vue](https://lucide.dev/)
- [Meilisearch JavaScript/TypeScript client](https://github.com/meilisearch/meilisearch-js)
- [Zod](https://zod.dev/)
