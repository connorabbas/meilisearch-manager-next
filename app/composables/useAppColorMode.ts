import { useColorMode } from '@vueuse/core'
import { prefersDarkColorScheme } from '@/utils'

export const AppColorModeKey: InjectionKey<ReturnType<typeof useColorMode>> = Symbol('app-color-mode')

export function useAppColorMode() {
    const colorMode = inject(AppColorModeKey) ?? useColorMode({ emitAuto: true })

    const isDark = computed(() =>
        colorMode.value === 'dark'
        || (prefersDarkColorScheme() && colorMode.value === 'auto'),
    )

    return {
        colorMode,
        isDark,
    }
}
