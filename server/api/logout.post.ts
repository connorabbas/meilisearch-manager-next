export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig(event)

    if (!config.authEnabled) {
        throw createError({
            status: 403,
            statusMessage: 'Authentication is disabled',
        })
    }

    await clearUserSession(event)
    return { success: true }
})
