/**
 * WARNING: This endpoint exposes the application's secure mode configuration.
 * It does not require authentication. When deployed in production, this route
 * (and the entire application) must be protected by external means such as
 * Traefik Basic Auth, a VPN, or network-level restrictions.
 */
export default defineEventHandler((event) => {
    const config = useRuntimeConfig(event)

    const explicitMode = String(config.secureMode).toLowerCase()

    let secureMode: boolean

    // Explicit true -> strict validation
    if (explicitMode === 'true') {
        if (!config.meilisearchHost || !config.meilisearchApiKey) {
            throw createError({
                status: 500,
                statusText: 'Missing Meilisearch Configuration',
                data: {
                    detail: 'Secure mode is enabled but NUXT_MEILISEARCH_HOST or NUXT_MEILISEARCH_API_KEY is missing',
                },
            })
        }
        secureMode = true
    } else if (explicitMode === 'false') {
        // Explicit false -> force multi-instance
        secureMode = false
    } else {
        // 'auto' (or omitted) -> auto-detect based on credentials presence
        secureMode = Boolean(config.meilisearchHost && config.meilisearchApiKey)
    }

    const authEnabled = secureMode && config.authEnabled

    return { secureMode, authEnabled }
})
