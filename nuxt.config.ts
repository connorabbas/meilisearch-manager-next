import tailwindcss from '@tailwindcss/vite'
import themePreset from './app/theme/theme-preset'
import globalPt from './app/theme/global-pt'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    app: {
        head: {
            bodyAttrs: {
                class: 'antialiased font-sans h-full bg-surface-100 dark:bg-surface-950'
            },
            link: [
                { rel: 'icon', type: 'image/x-icon', href: '/meili-logo.svg' }
            ]
        }
    },
    compatibilityDate: '2025-07-15',
    css: ['maplibre-gl/dist/maplibre-gl.css', '~/assets/css/main.css'],
    devtools: { enabled: false },
    modules: ['@primevue/nuxt-module', '@nuxt/fonts', '@pinia/nuxt', '@nuxt/eslint', 'nuxt-maplibre', 'nuxt-auth-utils', 'nuxt-security'],
    nitro: {
        prerender: {
            crawlLinks: false,
            routes: [],
            failOnError: false,
        },
    },
    runtimeConfig: {
        meilisearchSingleInstanceProxyMode: 'auto',
        meilisearchHost: '',
        meilisearchApiKey: '',
        authEnabled: false,
        adminUsername: 'admin',
        adminPassword: '',
        public: {
            staticDeploy: false,
        },
    },
    security: {
        headers: false,
        requestSizeLimiter: false,
        rateLimiter: false,
        xssValidator: false,
        corsHandler: false,
        allowedMethodsRestricter: false,
        hidePoweredBy: false,
        csrf: false,
        nonce: false,
        removeLoggers: false,
        ssg: false,
        sri: false,
    },
    routeRules: {
        '/api/login': {
            security: {
                rateLimiter: {
                    tokensPerInterval: 5,
                    interval: 15 * 60 * 1000,
                    headers: true,
                },
            },
        },
    },
    primevue: {
        options: {
            theme: {
                preset: themePreset,
                options: {
                    darkModeSelector: '.dark',
                    cssLayer: {
                        name: 'primevue',
                        order: 'theme, base, primevue'
                    }
                }
            },
            pt: globalPt
        }
    },
    ssr: false,
    vite: {
        plugins: [
            tailwindcss()
        ]
    }
})
