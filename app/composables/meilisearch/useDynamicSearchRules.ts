import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { useMeilisearchStore } from '@/stores/meilisearch'
import { usePagination } from '../usePagination'
import type { SearchRule, SearchRuleListPayload, ResourceResults, SearchRuleUpdatePayload } from 'meilisearch'

export function useDynamicSearchRules(initialPerPage: number = 20) {
    const toast = useToast()
    const confirm = useConfirm()
    const meilisearchStore = useMeilisearchStore()
    const {
        currentPage,
        perPage,
        firstDatasetIndex,
        offset,
        syncCurrentPageWithinTotal,
        handlePageEvent,
    } = usePagination(initialPerPage)

    const rulesResults = ref<ResourceResults<SearchRule[]> | null>(null)
    const rules = ref<SearchRule[]>([])
    const currentRule = ref<SearchRule | null>(null)
    const isFetching = ref(false)
    const isLoading = ref(false)
    const error = ref<string | null>(null)

    const rulesQuery = computed<SearchRuleListPayload>(() => {
        return {
            limit: perPage.value,
            offset: offset.value,
        }
    })

    async function fetchRules(params?: SearchRuleListPayload): Promise<ResourceResults<SearchRule[]> | undefined> {
        const client = meilisearchStore.getClient()
        if (!client) {
            error.value = 'Meilisearch client not connected'
            return
        }

        isFetching.value = true
        error.value = null

        try {
            const results = await client.getDynamicSearchRules(params)
            rulesResults.value = results
            rules.value = results.results
            return results
        } catch (err) {
            rulesResults.value = null
            rules.value = []
            error.value = (err as Error).message
        } finally {
            isFetching.value = false
        }
    }

    async function fetchRulesPaginated(resetPagination: boolean = false): Promise<ResourceResults<SearchRule[]> | undefined> {
        if (resetPagination) {
            currentPage.value = 1
        }

        const results = await fetchRules(rulesQuery.value)
        if (!results) {
            return results
        }

        if (syncCurrentPageWithinTotal(results.total)) {
            return fetchRules(rulesQuery.value)
        }

        return results
    }

    async function fetchRule(uid: string): Promise<SearchRule | undefined> {
        const client = meilisearchStore.getClient()
        if (!client) {
            error.value = 'Meilisearch client not connected'
            return
        }

        isFetching.value = true
        error.value = null

        try {
            const result = await client.getDynamicSearchRule(uid)
            currentRule.value = result
            return result
        } catch (err) {
            currentRule.value = null
            error.value = (err as Error).message
        } finally {
            isFetching.value = false
        }
    }

    async function createOrUpdate(
        uid: string,
        payload: SearchRuleUpdatePayload
    ): Promise<SearchRule | undefined> {
        const client = meilisearchStore.getClient()
        if (!client) {
            error.value = 'Meilisearch client not connected'
            return
        }

        isLoading.value = true
        error.value = null

        try {
            const result = await client.updateDynamicSearchRule(uid, payload)
            toast.add({
                severity: 'success',
                summary: 'Rule Saved',
                detail: `Search rule "${uid}" was saved successfully`,
                life: 3000,
            })
            return result
        } catch (err) {
            error.value = (err as Error).message
            throw err
        } finally {
            isLoading.value = false
        }
    }

    async function deleteRule(uid: string): Promise<void> {
        const client = meilisearchStore.getClient()
        if (!client) {
            error.value = 'Meilisearch client not connected'
            return
        }

        isLoading.value = true
        error.value = null

        try {
            await client.deleteDynamicSearchRule(uid)
        } catch (err) {
            error.value = (err as Error).message
            throw err
        } finally {
            isLoading.value = false
        }
    }

    function confirmDeleteRule(
        uid: string,
        onDeletedCallback?: () => void
    ) {
        confirm.require({
            group: 'delete',
            message: 'Are you sure you want to delete this search rule?',
            header: 'Danger Zone',
            rejectLabel: 'Cancel',
            rejectProps: {
                label: 'Cancel',
                severity: 'secondary',
            },
            acceptProps: {
                label: 'Delete',
                severity: 'danger',
            },
            accept: async () => {
                await deleteRule(uid).then(() => {
                    onDeletedCallback?.()
                })
            },
        })
    }

    watch(error, (newError) => {
        if (newError) {
            toast.add({
                severity: 'error',
                summary: 'Meilisearch Search Rules Error',
                detail: newError,
                life: 7500,
            })
        }
    })

    return {
        currentPage,
        perPage,
        firstDatasetIndex,
        offset,
        rules,
        rulesResults,
        currentRule,
        isFetching,
        isLoading,
        error,
        handlePageEvent,
        fetchRules,
        fetchRulesPaginated,
        fetchRule,
        createOrUpdate,
        deleteRule,
        confirmDeleteRule,
    }
}
