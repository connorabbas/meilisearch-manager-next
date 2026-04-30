import { FolderSearch, Plus, ArrowLeftRight, Trash2, ListCheck, KeyRound, DatabaseBackup, LayoutGrid, FlaskConical } from '@lucide/vue'
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
            lucideIcon: LayoutGrid,
            route: '/dashboard',
            active: isActiveRoute('dashboard'),
        },
        {
            label: 'Indexes',
            lucideIcon: FolderSearch,
            route: '/indexes',
            active: isActiveRoute('indexes') || currentPath.value.startsWith('/indexes'),
        },
        {
            label: 'Tasks',
            lucideIcon: ListCheck,
            route: '/tasks',
            active: isActiveRoute('tasks')
        },
        {
            label: 'Keys',
            lucideIcon: KeyRound,
            route: '/keys',
            active: isActiveRoute('keys'),
        },
        {
            label: 'Backups',
            lucideIcon: DatabaseBackup,
            route: '/backups',
            active: isActiveRoute('backups'),
        },
        {
            label: 'Experimental',
            lucideIcon: FlaskConical,
            route: '/experimental-features',
            active: isActiveRoute('experimental-features'),
        },
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
                        } catch (error) {
                            console.error('Failed to connect instance', error)
                        }

                        await navigateTo('/dashboard', { replace: true })
                    })
                }
            },
        },
    ])

    // Mobile menu
    const mobileMenuOpen = ref(false)
    const windowWidth = ref(0)
    const updateWidth = () => {
        if (typeof window === 'undefined') {
            return
        }

        windowWidth.value = window.innerWidth
    }
    onMounted(() => {
        updateWidth()
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
