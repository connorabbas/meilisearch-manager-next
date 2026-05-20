export default defineNuxtRouteMiddleware(async (to) => {
    const meilisearchStore = useMeilisearchStore()
    const { loggedIn, fetch: refreshSession } = useUserSession()

    // If the store knows we're in multi-instance mode, skip auth entirely
    if (meilisearchStore.initialized && !meilisearchStore.singleInstanceMode) {
        return
    }

    // Fetch config to determine mode and whether auth is enabled
    let config: { secureMode: boolean; authEnabled: boolean }
    try {
        config = await $fetch<{ secureMode: boolean; authEnabled: boolean }>('/api/config')
    } catch {
        // If config fails, assume auth is off to avoid lockouts
        return
    }

    // Auth only applies in single-instance mode when enabled
    if (!config.secureMode || !config.authEnabled) {
        return
    }

    // Ensure session is loaded before checking auth state
    if (!loggedIn.value) {
        await refreshSession()
    }

    const isLoginPage = to.path === '/login'

    if (loggedIn.value && isLoginPage) {
        return navigateTo('/dashboard', { replace: true })
    }

    if (!loggedIn.value && !isLoginPage) {
        return navigateTo('/login', { replace: true })
    }
})
