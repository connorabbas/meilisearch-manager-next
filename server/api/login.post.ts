import { z } from 'zod'

const bodySchema = z.object({
    username: z.string().min(1),
    password: z.string().min(1),
})

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig(event)

    if (!config.authEnabled) {
        throw createError({
            status: 403,
            statusMessage: 'Authentication is disabled',
        })
    }

    if (!config.adminPassword) {
        throw createError({
            status: 500,
            statusMessage: 'Admin password is not configured',
        })
    }

    const { username, password } = await readValidatedBody(event, bodySchema.parse)

    if (username === config.adminUsername && password === config.adminPassword) {
        await setUserSession(event, {
            user: {
                name: 'Admin',
            },
            loggedInAt: Date.now(),
        })
        return { success: true }
    }

    throw createError({
        status: 401,
        statusMessage: 'Invalid credentials',
    })
})
