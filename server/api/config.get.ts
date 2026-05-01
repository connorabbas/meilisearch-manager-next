export default defineEventHandler((event) => {
    const config = useRuntimeConfig(event)

    const explicitMode = String(config.secureMode).toLowerCase()

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
        return { secureMode: true }
    }

    // Explicit false -> force multi-instance
    if (explicitMode === 'false') {
        return { secureMode: false }
    }

    // Omitted -> auto-detect
    return { secureMode: Boolean(config.meilisearchHost && config.meilisearchApiKey) }
})
