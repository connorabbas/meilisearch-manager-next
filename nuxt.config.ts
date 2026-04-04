import tailwindcss from "@tailwindcss/vite"
import themePreset from './app/theme/theme-preset'
import globalPt from './app/theme/global-pt'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    css: ['~/assets/css/main.css'],
    devtools: { enabled: true },
    modules: ['@primevue/nuxt-module', '@nuxt/fonts'],
    primevue: {
        options: {
            theme: {
                preset: themePreset,
                options: {
                    darkModeSelector: '.dark',
                    cssLayer: {
                        name: 'primevue',
                        order: 'theme, base, primevue',
                    },
                },
            },
            pt: globalPt,
        }
    },
    vite: {
        plugins: [
            tailwindcss(),
        ],
    },
})