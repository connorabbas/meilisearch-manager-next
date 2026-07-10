import { createError } from 'h3'

type AuthRuntimeConfig = {
    meilisearchSingleInstanceProxyMode?: unknown;
    meilisearchHost?: unknown;
    meilisearchApiKey?: unknown;
    authEnabled?: unknown;
}

export function parseAuthEnabled(value: unknown) {
    return value === true || String(value).toLowerCase() === 'true'
}

export function resolveAuthConfig(config: AuthRuntimeConfig) {
    const explicitMode = String(config.meilisearchSingleInstanceProxyMode).toLowerCase()

    let singleInstanceProxyMode: boolean

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
        singleInstanceProxyMode = false
    } else {
        singleInstanceProxyMode = Boolean(config.meilisearchHost && config.meilisearchApiKey)
    }

    return {
        singleInstanceProxyMode,
        authEnabled: singleInstanceProxyMode && parseAuthEnabled(config.authEnabled),
    }
}
