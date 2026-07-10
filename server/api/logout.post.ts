import { resolveAuthConfig } from '../utils/auth'

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig(event)
    const { authEnabled } = resolveAuthConfig(config)

    if (!authEnabled) {
        throw createError({
            status: 403,
            statusMessage: 'Authentication is disabled',
        })
    }

    await clearUserSession(event)
    return { success: true }
})
