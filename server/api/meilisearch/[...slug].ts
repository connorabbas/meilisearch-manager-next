import { getRequestURL, proxyRequest } from 'h3'

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
    const proxyPath = originalUrl.pathname.replace(/^\/api\/meilisearch/, '')
    const targetUrl = new URL(proxyPath, host)
    targetUrl.search = originalUrl.search

    return proxyRequest(event, targetUrl.toString(), {
        headers: {
            Authorization: `Bearer ${apiKey}`,
        },
    })
})
