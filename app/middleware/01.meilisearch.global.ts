import { useMeilisearchStore } from '@/stores/meilisearch'

export default defineNuxtRouteMiddleware(async (to) => {
    const meilisearchStore = useMeilisearchStore()
    const { loggedIn } = useUserSession()

    if (to.path === '/login') {
        return
    }

    // If the store hasn't finished initializing yet, we can't make routing decisions
    if (!meilisearchStore.initialized) {
        return
    }

    // In single-instance mode with auth enabled, don't try to connect until authenticated
    if (meilisearchStore.singleInstanceMode) {
        let authEnabled = false
        try {
            const config = await $fetch<{ authEnabled: boolean }>('/api/config')
            authEnabled = config.authEnabled
        } catch {
            authEnabled = false
        }

        if (authEnabled && !loggedIn.value) {
            return navigateTo('/login', { replace: true })
        }
    }

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
                status: 503,
                statusText: 'Service Unavailable',
                message: meilisearchStore.connectionError ?? 'Unable to connect to the configured Meilisearch instance. Check your environment variables.',
                fatal: true,
            })
        }

        return navigateTo('/connection-error', { replace: true })
    }
})
