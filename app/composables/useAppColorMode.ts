import { useColorMode } from '@vueuse/core'
import { prefersDarkColorScheme } from '@/utils'

export function useAppColorMode() {
    const colorMode = useColorMode({ emitAuto: true })

    const isDark = computed(() =>
        colorMode.value === 'dark'
        || (prefersDarkColorScheme() && colorMode.value === 'auto'),
    )

    return {
        colorMode,
        isDark,
    }
}
