import type { EnqueuedTask, Task } from 'meilisearch'
import { useToast } from 'primevue/usetoast'
import { useMeilisearchStore } from '@/stores/meilisearch'
import { useTasks } from './useTasks'

export function useSnapshots() {
    const toast = useToast()
    const meilisearchStore = useMeilisearchStore()
    const { pollTaskStatus } = useTasks()

    const isSendingTask = ref(false)
    const isPollingTask = ref(false)
    const error = ref<string | null>(null)

    const isLoadingTask = computed(() => isSendingTask.value || isPollingTask.value)

    async function createSnapshot(onTaskEnqueued?: (task: EnqueuedTask) => void): Promise<Task | undefined> {
        const client = meilisearchStore.getClient()
        if (!client) {
            error.value = 'Meilisearch client not connected'
            return
        }

        isSendingTask.value = true
        error.value = null

        try {
            const enqueuedTask = await client.createSnapshot()
            isSendingTask.value = false
            onTaskEnqueued?.(enqueuedTask)

            isPollingTask.value = true
            const result = await pollTaskStatus(
                enqueuedTask.taskUid,
                `A snapshot creation task has been enqueued (taskUid: ${enqueuedTask.taskUid})`,
                'A new snapshot was successfully created. You can find it in the configured snapshot directory.',
            )

            return result
        } catch (err) {
            error.value = (err as Error).message
            throw err
        } finally {
            isSendingTask.value = false
            isPollingTask.value = false
        }
    }

    watch(error, (newError) => {
        if (newError) {
            toast.add({
                severity: 'error',
                summary: 'Meilisearch Snapshots Error',
                detail: newError,
                life: 7500,
            })
        }
    })

    return {
        isSendingTask,
        isPollingTask,
        isLoadingTask,
        error,
        createSnapshot,
    }
}
