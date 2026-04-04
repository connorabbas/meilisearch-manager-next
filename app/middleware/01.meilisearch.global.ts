import { useMeilisearchStore } from '@/stores/meilisearch'

export default defineNuxtRouteMiddleware(async (to) => {
    const meilisearchStore = useMeilisearchStore()

    if (to.path === '/new-instance') {
        return
    }

    if (!meilisearchStore.hasConfiguredInstance) {
        return navigateTo('/new-instance')
    }

    try {
        await meilisearchStore.connect()
    } catch {
        return navigateTo('/new-instance')
    }
})
