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

> [!CAUTION]
> **The single-instance proxy route has no built-in authentication.** The `/api/meilisearch/*` catch-all proxy injects the admin API key server-side, but the route itself accepts any request that reaches it.
>
> **You MUST deploy this behind an authentication layer** (e.g., Traefik Basic Auth, VPN, Cloudflare Access) or restrict it to a private network. Exposing the node image directly to the internet without authentication is equivalent to giving public admin access to your Meilisearch instance.

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

> [!NOTE]
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

> [!NOTE]
> The `node` images expose **port 3000** and require the `NUXT_MEILISEARCH_HOST` and `NUXT_MEILISEARCH_API_KEY` runtime variables to be set

#### docker run

```bash
docker run -p 8080:3000 \
  -e NUXT_MEILISEARCH_HOST=https://your-instance-domain.com \
  -e NUXT_MEILISEARCH_API_KEY=yourAdminApiKey \
  cabbas23/meilisearch-manager:node-latest
```

#### Docker Compose

Example production-ready compose stack using [Traefik](https://doc.traefik.io/traefik/reference/install-configuration/providers/docker/) as a reverse proxy with [Basic Auth](https://doc.traefik.io/traefik/reference/routing-configuration/http/middlewares/basicauth/) middleware. Traefik would typically be set up as its own service in a different compose stack, you can reference [this example](https://github.com/connorabbas/traefik-docker-compose/blob/master/docker-compose.yml).

> [!IMPORTANT]
> This example includes **Traefik Basic Auth** via inline labels. The proxy route (`/api/meilisearch/*`) has no built-in authentication, so the reverse proxy MUST enforce auth before requests reach the app.

```yml
services:
  manager:
    image: cabbas23/meilisearch-manager:node-latest
    container_name: meilisearch-manager
    environment:
      NUXT_MEILISEARCH_HOST: ${MEILISEARCH_HOST:-http://meilisearch:7700}
      NUXT_MEILISEARCH_API_KEY: ${MEILISEARCH_MANAGER_API_KEY:?Set MEILISEARCH_MANAGER_API_KEY}
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
      - 'traefik.http.routers.meilisearch-manager.middlewares=meilisearch-manager-auth'
      - 'traefik.http.middlewares.meilisearch-manager-auth.basicauth.users=adminuser:<your_hashed_pw>'
      - 'traefik.http.middlewares.meilisearch-manager-auth.basicauth.removeheader=true'
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
    labels:
      - 'traefik.enable=true'
      - 'traefik.docker.network=traefik_proxy'
      - 'traefik.http.routers.meilisearch-instance.rule=Host(`${MEILISEARCH_INSTANCE_DOMAIN:-search.yourdomain.com}`)'
      - 'traefik.http.routers.meilisearch-instance.entrypoints=websecure'
      - 'traefik.http.routers.meilisearch-instance.tls=true'
      - 'traefik.http.routers.meilisearch-instance.tls.certresolver=letsencrypt'
      - 'traefik.http.services.meilisearch-instance.loadbalancer.server.port=7700'
    networks:
      - meili
      - proxy

volumes:
  meilisearch-data:

networks:
  meili:
    internal: true
  proxy:
    name: traefik_proxy
    external: true
```

#### Architecture Notes

**Manager -> Meilisearch:** The Manager connects directly to Meilisearch via the internal `meili` network (`http://meilisearch:7700`). This traffic never leaves the Docker network and is not exposed publicly.

**External Apps -> Meilisearch:** Meilisearch is also exposed via Traefik on its own subdomain (`MEILISEARCH_INSTANCE_DOMAIN`). External applications (e.g., Laravel Scout) connect to this public endpoint using Meilisearch's API key authentication. The Manager app can create and manage scoped API keys for each consumer.

**Security:**

- The Manager app is protected by Traefik Basic Auth (no built-in authentication)
- Meilisearch relies on its own API key system for external access
- The `meili` network is internal-only, isolating direct container-to-container communication

#### Setting Up Traefik Basic Auth

1. **Generate a bcrypt password hash** using a temporary Docker container (no host installation needed):

   ```bash
   docker run --rm -it httpd:alpine htpasswd -nB adminuser
   ```

   Enter your password when prompted. The output will look like:

   ```
   adminuser:$2y$05$abcdefghijklmnopqrstuvwxyz...
   ```

   > [!IMPORTANT]
   > **Escape `$` characters in Docker Compose.** Compose treats `$` as variable interpolation syntax, so every `$` in the bcrypt hash must become `$$` in the label. For example:
>
   > ```
   > adminuser:$2y$05$...  ->  adminuser:$$2y$$05$$...
   > ```

1. **Add the user to your compose labels.** For a single user:

   ```yml
   - 'traefik.http.middlewares.meilisearch-manager-auth.basicauth.users=adminuser:$$2y$$05$$...'
   ```

   For multiple users, separate with commas:

   ```yml
   - 'traefik.http.middlewares.meilisearch-manager-auth.basicauth.users=adminuser:$$2y$$05$$...,alice:$$2y$$05$$...'
   ```

   Or abstract to an environment variable:

   ```yml
   - 'traefik.http.middlewares.meilisearch-manager-auth.basicauth.users=${TRAEFIK_AUTH_USERS}'
   ```

After adding new users you must re-create the container:

```shell
docker compose up -d --force-recreate manager
```

1. **Deploy** - Traefik reads the inline label and enforces Basic Auth on every request. The browser will prompt for credentials on first visit and cache them for the session.

> [!NOTE]
> Password hashes are visible in Docker metadata (`docker inspect`) but remain bcrypt-hashed. Treat them as sensitive.

#### Replace The Bootstrap Master Key

The compose example separates `MEILISEARCH_MASTER_KEY` from `MEILISEARCH_MANAGER_API_KEY`. The master key is Meilisearch's root credential and should not be used by the Manager for continued production use.

For initial setup, you may temporarily set `MEILISEARCH_MANAGER_API_KEY` to the same value as `MEILISEARCH_MASTER_KEY` so the Manager can start and create keys. After first login, create a dedicated API key for the Manager, replace `MEILISEARCH_MANAGER_API_KEY` with that new key, and recreate the Manager container.

You can create the dedicated key in either of these ways:

- Use the Manager UI's API Keys page after starting once with the bootstrap master key.
- Use the Meilisearch API directly: [Create an API key](https://www.meilisearch.com/docs/reference/api/keys/create-api-key).

Recommended permissions for the dedicated Manager key:

```json
{
  "actions": [
    "search",
    "documents.*",
    "indexes.*",
    "tasks.*",
    "settings.*",
    "stats.*",
    "dumps.*",
    "snapshots.*",
    "keys.*",
    "version",
    "experimental.get",
    "experimental.update"
  ],
  "indexes": ["*"],
  "expiresAt": null
}
```

After updating `MEILISEARCH_MANAGER_API_KEY`, recreate the Manager container so the new environment value is loaded:

```shell
docker compose up -d --force-recreate manager
```

The dedicated Manager key is still powerful, but it can be revoked or rotated independently without replacing the Meilisearch root credential.

#### Network-Level Security Alternatives

If Traefik Basic Auth does not fit your setup, consider these alternatives to restrict access:

- **VPN / private network** - Deploy the manager and Meilisearch on an internal network with no public ingress
- **Cloudflare Access** - Zero Trust authentication in front of your domain
- **Firewall IP whitelisting** - Restrict access to known office/home IPs

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
