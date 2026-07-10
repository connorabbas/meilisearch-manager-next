/**
 * WARNING: This endpoint exposes the application's single-instance proxy mode configuration.
 * It does not require authentication. When deployed in production, this route
 * (and the entire application) must be protected by external means such as
 * Traefik Basic Auth, a VPN, or network-level restrictions.
 */
export default defineEventHandler((event) => {
    const config = useRuntimeConfig(event)

    const explicitMode = String(config.meilisearchSingleInstanceProxyMode).toLowerCase()

    let singleInstanceProxyMode: boolean

    // Explicit true -> strict validation
    if (explicitMode === 'true') {
        if (!config.meilisearchHost || !config.meilisearchApiKey) {
            throw createError({
                status: 500,
                statusText: 'Missing Meilisearch Configuration',
                data: {
                    detail: 'Single-instance proxy mode is enabled but NUXT_MEILISEARCH_HOST or NUXT_MEILISEARCH_API_KEY is missing',
                },
            })
        }
        singleInstanceProxyMode = true
    } else if (explicitMode === 'false') {
        // Explicit false -> force multi-instance
        singleInstanceProxyMode = false
    } else {
        // 'auto' (or omitted) -> auto-detect based on credentials presence
        singleInstanceProxyMode = Boolean(config.meilisearchHost && config.meilisearchApiKey)
    }

    const authEnabled = singleInstanceProxyMode && config.authEnabled

    return { singleInstanceProxyMode, authEnabled }
})
