import { LayoutDashboard, FolderSearch, Plus, ArrowLeftRight, Trash2 } from '@lucide/vue'
import type { MenuItem } from '@/types'
import { useMeilisearchStore } from '@/stores/meilisearch'

export function useAppLayout() {
    const meilisearchStore = useMeilisearchStore()
    const route = useRoute()

    const currentRoute = computed(() => route.name)
    const currentPath = computed(() => route.path)

    const isActiveRoute = (routeName: string, path?: string) => {
        if (currentRoute.value === routeName) return true
        if (path && currentPath.value.startsWith(path)) return true

        return false
    }

    // Main menu items
    const menuItems = computed<MenuItem[]>(() => [
        {
            label: 'Dashboard',
            lucideIcon: LayoutDashboard,
            route: '/dashboard',
            active: isActiveRoute('dashboard'),
        },
        {
            label: 'Indexes',
            lucideIcon: FolderSearch,
            route: '/indexes',
            active: isActiveRoute('indexes') || currentPath.value.startsWith('/indexes'),
        },
        /* {
            label: 'Tasks',
            lucideIcon: ListCheck,
            route: { name: 'tasks' },
            active: isActiveRoute('tasks') || currentPath.value.startsWith('/tasks'),
        },
        {
            label: 'Keys',
            lucideIcon: KeyRound,
            route: { name: 'keys' },
            active: isActiveRoute('keys'),
        }, */
        /* {
            label: 'Meilisearch Docs',
            lucideIcon: BookText,
            link: 'https://www.meilisearch.com/docs/home',
        }, */
    ])

    // Meilisearch instance
    const changeInstanceModalOpen = ref(false)
    const currentMeilisearchIntanceName = computed(() => meilisearchStore?.currentInstance?.name ?? 'Default')
    const meilisearchInstanceMenuItems = computed<MenuItem[]>(() => [
        {
            label: 'New Instance',
            lucideIcon: Plus,
            route: '/new-instance',
        },
        {
            label: 'Change Instance',
            lucideIcon: ArrowLeftRight,
            command: () => changeInstanceModalOpen.value = true,
        },
        {
            label: 'Remove Instance',
            lucideIcon: Trash2,
            class: 'delete-menu-item',
            lucideIconClass: 'text-red-500 dark:text-red-400',
            command: async () => {
                if (meilisearchStore?.currentInstance?.id) {
                    meilisearchStore.confirmRemoveInstance(meilisearchStore.currentInstance.id, async () => {
                        if (!meilisearchStore.hasConfiguredInstance) {
                            await navigateTo('/new-instance', { replace: true })
                            return
                        }

                        try {
                            await meilisearchStore.connect()
                        } catch {}

                        await navigateTo('/dashboard', { replace: true })
                    })
                }
            },
        },
    ])

    // Mobile menu
    const mobileMenuOpen = ref(false)
    const windowWidth = ref(window.innerWidth)
    const updateWidth = () => {
        windowWidth.value = window.innerWidth
    }
    onMounted(() => {
        window.addEventListener('resize', updateWidth)
    })
    onUnmounted(() => {
        window.removeEventListener('resize', updateWidth)
    })
    watchEffect(() => {
        if (windowWidth.value > 1024) {
            mobileMenuOpen.value = false
        }
    })

    return {
        currentRoute,
        menuItems,
        mobileMenuOpen,
        singleInstanceMode: meilisearchStore.singleInstanceMode,
        changeInstanceModalOpen,
        meilisearchInstanceMenuItems,
        currentMeilisearchIntanceName,
    }
}
