import { resolveAuthConfig } from '../utils/auth'

/**
 * WARNING: This endpoint exposes the application's single-instance proxy mode configuration.
 * It does not require authentication. When deployed in production, this route
 * (and the entire application) must be protected by external means such as
 * Traefik Basic Auth, a VPN, or network-level restrictions.
 */
export default defineEventHandler((event) => {
    const config = useRuntimeConfig(event)
    return resolveAuthConfig(config)
})
