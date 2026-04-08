import { useMeilisearchStore } from '@/stores/meilisearch'

export default defineNuxtRouteMiddleware(async (to) => {
    const meilisearchStore = useMeilisearchStore()

    if (to.path === '/new-instance') {
        if (meilisearchStore.singleInstanceMode) {
            return navigateTo('/dashboard', { replace: true })
        }

        return
    }

    if (to.path === '/connection-error') {
        if (meilisearchStore.singleInstanceMode) {
            return navigateTo('/dashboard', { replace: true })
        }

        if (!meilisearchStore.hasConfiguredInstance) {
            return navigateTo('/new-instance', { replace: true })
        }

        return
    }

    if (!meilisearchStore.hasConfiguredInstance) {
        return navigateTo('/new-instance', { replace: true })
    }

    try {
        await meilisearchStore.connect()
    } catch {
        if (meilisearchStore.singleInstanceMode) {
            throw createError({
                statusCode: 503,
                statusMessage: 'Unable to connect to the configured Meilisearch instance',
                data: {
                    message: meilisearchStore.connectionError ?? 'Check your Meilisearch host and API key environment variables.',
                },
            })
        }

        return navigateTo('/connection-error', { replace: true })
    }
})
