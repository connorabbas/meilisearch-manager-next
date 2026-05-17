import { useColorMode } from '@vueuse/core'
import { AppColorModeKey } from '@/composables/useAppColorMode'

export default defineNuxtPlugin((nuxtApp) => {
    const colorMode = useColorMode({ emitAuto: true })
    nuxtApp.vueApp.provide(AppColorModeKey, colorMode)
})
