import { getRequestURL, proxyRequest } from 'h3'
import { joinURL } from 'ufo'

/**
 * WARNING: This catch-all proxy forwards ALL requests to the Meilisearch
 * instance with the admin API key injected server-side. There is NO
 * authentication or authorization in this handler.
 *
 * This route MUST be protected by external means:
 * - Traefik Basic Auth (or similar reverse proxy auth)
 * - VPN / private network
 * - IP restrictions
 * - Zero Trust access control
 *
 * Exposing this route to the public internet without authentication
 * grants full admin access to your Meilisearch instance.
 */
export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig(event)
    const host = config.meilisearchHost
    const apiKey = config.meilisearchApiKey

    if (!host || !apiKey) {
        throw createError({
            status: 503,
            statusText: 'Proxy Not Configured',
        })
    }

    const originalUrl = getRequestURL(event)
    const proxyPath = originalUrl.pathname.replace(/^\/api\/meilisearch\/?/, '')
    if (proxyPath.startsWith('//')) {
        throw createError({ status: 400, statusMessage: 'Invalid proxy path' })
    }
    const targetUrl = new URL(joinURL(host, proxyPath))
    targetUrl.search = originalUrl.search

    return proxyRequest(event, targetUrl.toString(), {
        headers: {
            Authorization: `Bearer ${apiKey}`,
        },
    })
})
