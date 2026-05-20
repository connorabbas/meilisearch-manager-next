# Meilisearch Manager Docker Images

Pre-built Docker images are published to [Docker Hub](https://hub.docker.com/r/cabbas23/meilisearch-manager) for both operational modes.

## Image Variants

Meilisearch Manager publishes two image variants:

- `node` images run the single-instance proxy mode behind a Nitro server.
- `nginx` images run the static multi-instance mode as a browser-only app.

Both variants support `linux/amd64` and `linux/arm64`.

## Available Tags

| Target | Tag | Description |
|--------|-----|-------------|
| Node | `node-latest` | Latest Node single-instance build |
| Node | `node-<semver>` | Specific release, such as `node-1.6.0` |
| Nginx | `nginx-latest` | Latest nginx static multi-instance build |
| Nginx | `nginx-<semver>` | Specific release, such as `nginx-1.6.0` |

## Nginx Image (Multi-Instance)

The `nginx` images run in multi-instance browser-only mode and are meant for local development, testing, and exploration.

> [!NOTE]
> The `nginx` images expose port `8080`.

### docker run

```bash
docker run -p 3000:8080 \
  cabbas23/meilisearch-manager:nginx-latest
```

### Docker Compose

A simple compose stack to run a local Meilisearch instance and Manager UI.

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

## Node Image (Single-Instance Proxy)

The `node` images run the single-instance proxy mode behind a Nitro server. The images are built on top of the official [Docker Hardened Images](https://www.docker.com/products/hardened-images/) (`dhi.io/node:22-alpine`), providing a minimal runtime with near-zero CVEs.

> [!NOTE]
> The `node` images expose port `3000` and require the `NUXT_MEILISEARCH_HOST` and `NUXT_MEILISEARCH_API_KEY` runtime variables to be set.

### Security Warning

> [!CAUTION]
> **By default, the single-instance proxy route has no built-in authentication.** The `/api/meilisearch/*` catch-all proxy injects the admin API key server-side, but the route itself accepts any request that reaches it.
>
> **You MUST deploy this behind an authentication layer in production environments** (e.g., Traefik Basic Auth, VPN, Cloudflare Access), enable the optional built-in auth, or restrict it to a private network. Exposing the node image directly to the internet without authentication is equivalent to giving public admin access to your Meilisearch instance.

#### Optional Built-in Authentication

You can enable a minimal login layer directly in the app so you don't need an external reverse-proxy auth mechanism:

```env
NUXT_AUTH_ENABLED=true
NUXT_ADMIN_USERNAME=admin
NUXT_ADMIN_PASSWORD=yourStrongPassword
NUXT_SESSION_PASSWORD=a-random-password-with-at-least-32-characters
```

When enabled, all proxy requests require an authenticated session and unauthenticated users are redirected to `/login`.

### Docker Compose

Example production-ready compose stack using [Traefik](https://doc.traefik.io/traefik/reference/install-configuration/providers/docker/) as a reverse proxy with [Basic Auth](https://doc.traefik.io/traefik/reference/routing-configuration/http/middlewares/basicauth/) middleware. Traefik would typically be set up as its own service in a different compose stack. You can reference [this example](https://github.com/connorabbas/traefik-docker-compose/blob/master/docker-compose.yml).

> [!IMPORTANT]
> This example includes Traefik Basic Auth via inline labels. The proxy route (`/api/meilisearch/*`) has no built-in authentication, so the reverse proxy must enforce auth before requests reach the app.

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

### Architecture Notes

**Manager -> Meilisearch:** The Manager connects directly to Meilisearch via the internal `meili` network (`http://meilisearch:7700`). This traffic never leaves the Docker network and is not exposed publicly.

**External Apps -> Meilisearch:** Meilisearch is also exposed via Traefik on its own subdomain (`MEILISEARCH_INSTANCE_DOMAIN`). External applications, such as Laravel Scout, connect to this public endpoint using Meilisearch's API key authentication. The Manager app can create and manage scoped API keys for each consumer.

**Security:**

- The Manager app is protected by Traefik Basic Auth because it has no built-in authentication.
- Meilisearch relies on its own API key system for external access.
- The `meili` network is internal-only, isolating direct container-to-container communication.

### Path Prefix Deployments

You can host the Manager and/or Meilisearch under path prefixes on an existing domain instead of using dedicated subdomains.

Example URLs:

- Manager: `https://admin.example.com/manager`
- Meilisearch: `https://admin.example.com/search`

Path-prefix deployments can involve two separate prefixes:

- `NUXT_APP_BASE_URL=/manager/` tells Nuxt that the Manager app itself is served under `/manager`.
- `NUXT_MEILISEARCH_HOST=https://admin.example.com/search` tells the Manager proxy that Meilisearch is reachable through a `/search` upstream base path.

Use non-overlapping prefixes, such as `/manager` and `/search`. Avoid pairs like `/meilisearch` and `/meilisearch-manager` unless you explicitly configure Traefik router priorities, because both paths can match the shorter prefix.

#### Manager Under a Path Prefix

When the Manager is served under a prefix, set `NUXT_APP_BASE_URL` to that prefix and do not strip the prefix in Traefik. Nuxt needs to receive the prefixed path so client assets, API calls, and routes resolve correctly.

```yml
services:
  manager:
    image: cabbas23/meilisearch-manager:node-latest
    container_name: meilisearch-manager
    environment:
      NUXT_APP_BASE_URL: /manager/
      NUXT_MEILISEARCH_HOST: http://meilisearch:7700
      NUXT_MEILISEARCH_API_KEY: ${MEILISEARCH_MANAGER_API_KEY:?Set MEILISEARCH_MANAGER_API_KEY}
    labels:
      - 'traefik.enable=true'
      - 'traefik.docker.network=traefik_proxy'
      - 'traefik.http.routers.meilisearch-manager.rule=Host(`admin.example.com`) && PathPrefix(`/manager`)'
      - 'traefik.http.routers.meilisearch-manager.entrypoints=websecure'
      - 'traefik.http.routers.meilisearch-manager.tls=true'
      - 'traefik.http.routers.meilisearch-manager.tls.certresolver=letsencrypt'
      - 'traefik.http.routers.meilisearch-manager.middlewares=meilisearch-manager-auth'
      - 'traefik.http.middlewares.meilisearch-manager-auth.basicauth.users=${TRAEFIK_AUTH_USERS}'
      - 'traefik.http.middlewares.meilisearch-manager-auth.basicauth.removeheader=true'
      - 'traefik.http.services.meilisearch-manager.loadbalancer.server.port=3000'
    networks:
      - proxy
      - meili
```

If the Manager and Meilisearch are on the same Docker network, prefer the internal URL for `NUXT_MEILISEARCH_HOST`, such as `http://meilisearch:7700`. This avoids sending Manager-to-Meilisearch traffic out through the public reverse proxy.

#### Meilisearch Under a Path Prefix

If you expose Meilisearch itself under a path prefix, Traefik should strip that prefix before forwarding requests to the Meilisearch container. Meilisearch expects API paths like `/indexes`, not `/search/indexes`.

```yml
services:
  meilisearch:
    image: getmeili/meilisearch:${MEILISEARCH_VERSION:-latest}
    container_name: meilisearch-instance
    environment:
      MEILI_NO_ANALYTICS: ${MEILISEARCH_NO_ANALYTICS:-true}
      MEILI_MASTER_KEY: ${MEILISEARCH_MASTER_KEY:?Set MEILISEARCH_MASTER_KEY}
      MEILI_ENV: ${MEILISEARCH_ENV:-production}
    labels:
      - 'traefik.enable=true'
      - 'traefik.docker.network=traefik_proxy'
      - 'traefik.http.routers.meilisearch-instance.rule=Host(`admin.example.com`) && PathPrefix(`/search`)'
      - 'traefik.http.routers.meilisearch-instance.entrypoints=websecure'
      - 'traefik.http.routers.meilisearch-instance.tls=true'
      - 'traefik.http.routers.meilisearch-instance.tls.certresolver=letsencrypt'
      - 'traefik.http.routers.meilisearch-instance.middlewares=meilisearch-strip-prefix'
      - 'traefik.http.middlewares.meilisearch-strip-prefix.stripprefix.prefixes=/search'
      - 'traefik.http.services.meilisearch-instance.loadbalancer.server.port=7700'
    networks:
      - proxy
      - meili
```

If the Manager must connect through that public path-prefixed endpoint, set:

```env
NUXT_MEILISEARCH_HOST=https://admin.example.com/search
```

The Manager proxy preserves that base path, so a browser request to `/manager/api/meilisearch/indexes` is forwarded by the Manager to `https://admin.example.com/search/indexes`. Traefik then strips `/search` before forwarding to Meilisearch as `/indexes`.

### Setting Up Traefik Basic Auth

Check out the [following guide](https://github.com/connorabbas/traefik-docker-compose#setting-up-traefik-basic-auth) on how to setup [BasicAuth](https://doc.traefik.io/traefik/reference/routing-configuration/http/middlewares/basicauth/) middleware for production use.

### Network-Level Security Alternatives

If Traefik Basic Auth does not fit your setup, consider these alternatives to restrict access:

- VPN or private network: deploy the Manager and Meilisearch on an internal network with no public ingress.
- Cloudflare Access: use Zero Trust authentication in front of your domain.
- Firewall IP allowlisting: restrict access to known office or home IPs.
- Authentik, Authelia, or OAuth2 Proxy: use centralized identity-aware proxy authentication.
