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
    css: ['~/assets/css/main.css'],
    devtools: { enabled: false },
    modules: ['@primevue/nuxt-module', '@nuxt/fonts', '@pinia/nuxt', '@nuxt/eslint'],
    runtimeConfig: {
        public: {
            meilisearchHost: '',
            meilisearchApiKey: ''
        }
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