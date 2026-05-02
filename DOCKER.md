# Meilisearch Manager Docker Images

Pre-built Docker images are published to [Docker Hub](https://hub.docker.com/r/cabbas23/meilisearch-manager) for both operational modes.

## Image Variants

Meilisearch Manager publishes two image variants:

- `node` images run the secure single-instance mode behind a Nitro server.
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

## Node Image (Secure Single-Instance)

The `node` images run the secure single-instance mode and are meant for production deployments. The images are built on top of the official [Docker Hardened Images](https://www.docker.com/products/hardened-images/) (`dhi.io/node:22-alpine`), providing a minimal runtime with near-zero CVEs.

> [!NOTE]
> The `node` images expose port `3000` and require the `NUXT_MEILISEARCH_HOST` and `NUXT_MEILISEARCH_API_KEY` runtime variables to be set.

### Security Warning

> [!CAUTION]
> **The single-instance proxy route has no built-in authentication.** The `/api/meilisearch/*` catch-all proxy injects the admin API key server-side, but the route itself accepts any request that reaches it.
>
> **You MUST deploy this behind an authentication layer** (e.g., Traefik Basic Auth, VPN, Cloudflare Access) or restrict it to a private network. Exposing the node image directly to the internet without authentication is equivalent to giving public admin access to your Meilisearch instance.

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

### Setting Up Traefik Basic Auth

1. Generate a bcrypt password hash using a temporary Docker container:

   ```bash
   docker run --rm -it httpd:alpine htpasswd -nB adminuser
   ```

   Enter your password when prompted. The output will look like:

   ```text
   adminuser:$2y$05$abcdefghijklmnopqrstuvwxyz...
   ```

> [!IMPORTANT]
> Escape `$` characters in Docker Compose. Compose treats `$` as variable interpolation syntax, so every `$` in the bcrypt hash must become `$$` in the label.

   ```text
   adminuser:$2y$05$...  ->  adminuser:$$2y$$05$$...
   ```

2. Add the user to your compose labels.

   For a single user:

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

3. Recreate the Manager container after changing Basic Auth users.

   ```shell
   docker compose up -d --force-recreate manager
   ```

4. Deploy the stack.

   Traefik reads the inline label and enforces Basic Auth on every request. The browser will prompt for credentials on first visit and cache them for the session.

> [!NOTE]
> Password hashes are visible in Docker metadata (`docker inspect`) but remain bcrypt-hashed. Treat them as sensitive.

### Replace The Bootstrap Master Key

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

### Network-Level Security Alternatives

If Traefik Basic Auth does not fit your setup, consider these alternatives to restrict access:

- VPN or private network: deploy the Manager and Meilisearch on an internal network with no public ingress.
- Cloudflare Access: use Zero Trust authentication in front of your domain.
- Firewall IP allowlisting: restrict access to known office or home IPs.
- Authentik, Authelia, or OAuth2 Proxy: use centralized identity-aware proxy authentication.
