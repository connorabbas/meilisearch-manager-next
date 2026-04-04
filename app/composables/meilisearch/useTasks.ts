import { useStorage } from '@vueuse/core'
import { useToast } from 'primevue/usetoast'
import { useMeilisearchStore } from '@/stores/meilisearch'
import type { Task, TasksOrBatchesQuery, TasksResults } from 'meilisearch'

let tasksPollingEnabledState: ReturnType<typeof useStorage<boolean>> | null = null

function normalizeTasksQuery(params?: TasksOrBatchesQuery): TasksOrBatchesQuery {
    const normalized: TasksOrBatchesQuery = {
        ...params,
    }

    delete normalized.from

    if (normalized.statuses?.length === 0) {
        delete normalized.statuses
    }
    if (normalized.indexUids?.length === 0) {
        delete normalized.indexUids
    }
    if (normalized.types?.length === 0) {
        delete normalized.types
    }
    if (normalized.reverse == null) {
        delete normalized.reverse
    }

    return normalized
}

function getTasksQueryKey(params?: TasksOrBatchesQuery): string {
    return JSON.stringify(normalizeTasksQuery(params))
}

function appendFetchedTasks(existingTasks: Task[], incomingTasks: Task[]): Task[] {
    const incomingTasksByUid = new Map(incomingTasks.map(task => [task.uid, task]))
    const existingUids = new Set(existingTasks.map(task => task.uid))

    return [
        ...existingTasks.map(task => incomingTasksByUid.get(task.uid) ?? task),
        ...incomingTasks.filter(task => !existingUids.has(task.uid)),
    ]
}

function prependPolledTasks(existingTasks: Task[], incomingTasks: Task[]): Task[] {
    const incomingUids = new Set(incomingTasks.map(task => task.uid))

    return [
        ...incomingTasks,
        ...existingTasks.filter(task => !incomingUids.has(task.uid)),
    ]
}

export function useTasks() {
    const toast = useToast()
    const meilisearchStore = useMeilisearchStore()
    const tasksPollingEnabled = tasksPollingEnabledState ?? useStorage<boolean>('meilisearch-tasks-polling-enabled', false)

    tasksPollingEnabledState = tasksPollingEnabled

    const tasksResults = ref<TasksResults | null>(null)
    const tasks = ref<Task[]>([])
    const isFetching = ref(false)
    const isPollingLatest = ref(false)
    const checkingTaskStatus = ref(false)
    const error = ref<string | null>(null)
    const hasMore = ref(false)
    const currentQuery = ref<TasksOrBatchesQuery>({})
    const nextCursor = ref<TasksResults['next']>(null)
    let listRequestVersion = 0

    async function fetchTasks(params?: TasksOrBatchesQuery): Promise<TasksResults | undefined> {
        const client = meilisearchStore.getClient()
        if (!client) {
            error.value = 'Meilisearch client not connected'
            return
        }

        const query = normalizeTasksQuery(params ?? currentQuery.value)
        const queryKey = getTasksQueryKey(query)
        const requestVersion = ++listRequestVersion
        currentQuery.value = query

        isFetching.value = true
        error.value = null

        try {
            const results = await client.tasks.getTasks(query)

            if (requestVersion !== listRequestVersion || getTasksQueryKey(currentQuery.value) !== queryKey) {
                return results
            }

            tasksResults.value = results

            tasks.value = results.results
            nextCursor.value = results.next
            hasMore.value = results.next !== null
            return results
        } catch (err) {
            if (requestVersion === listRequestVersion) {
                tasksResults.value = null
                tasks.value = []
                nextCursor.value = null
                hasMore.value = false
                error.value = (err as Error).message
            }
        } finally {
            if (requestVersion === listRequestVersion) {
                isFetching.value = false
            }
        }
    }

    async function fetchAndAppendTasks(params?: TasksOrBatchesQuery): Promise<TasksResults | undefined> {
        const client = meilisearchStore.getClient()
        if (!client) {
            error.value = 'Meilisearch client not connected'
            return
        }

        if (isFetching.value || nextCursor.value === null) {
            return
        }

        const query = normalizeTasksQuery(params ?? currentQuery.value)
        const queryKey = getTasksQueryKey(query)
        const requestVersion = ++listRequestVersion
        currentQuery.value = query

        isFetching.value = true
        error.value = null

        try {
            const results = await client.tasks.getTasks({
                ...query,
                from: nextCursor.value,
            })

            if (requestVersion !== listRequestVersion || getTasksQueryKey(currentQuery.value) !== queryKey) {
                return results
            }

            tasksResults.value = results
            tasks.value = appendFetchedTasks(tasks.value, results.results)
            nextCursor.value = results.next
            hasMore.value = results.next !== null

            return results
        } catch (err) {
            if (requestVersion === listRequestVersion) {
                error.value = (err as Error).message
            }
        } finally {
            if (requestVersion === listRequestVersion) {
                isFetching.value = false
            }
        }
    }

    async function pollLatestTasks(params?: TasksOrBatchesQuery): Promise<TasksResults | undefined> {
        const client = meilisearchStore.getClient()
        if (!client) {
            return
        }

        if (isFetching.value || isPollingLatest.value) {
            return
        }

        const query = normalizeTasksQuery(params ?? currentQuery.value)
        const queryKey = getTasksQueryKey(query)
        const requestVersion = listRequestVersion

        isFetching.value = true
        isPollingLatest.value = true

        try {
            const results = await client.tasks.getTasks(query)

            if (requestVersion !== listRequestVersion || getTasksQueryKey(currentQuery.value) !== queryKey) {
                return results
            }

            tasks.value = prependPolledTasks(tasks.value, results.results)
            return results
        } catch (err) {
            console.error('Failed to poll tasks', err)
        } finally {
            isFetching.value = false
            isPollingLatest.value = false
        }
    }

    async function pollTaskStatus(
        taskUid: number,
        taskEnqueuedMessage: string,
        successMessage: string,
        maxAttempts = 30,
        delayMs = 500
    ): Promise<Task | undefined> {
        const client = meilisearchStore.getClient()
        if (!client) {
            error.value = 'Meilisearch client not connected'
            return
        }

        const taskToastOptions = {
            severity: 'secondary',
            summary: 'Task Enqueued',
            detail: taskEnqueuedMessage,
        }

        checkingTaskStatus.value = true
        let attempts = 0
        try {
            toast.add(taskToastOptions)
            // Wait just a moment to show the task enqueued toast
            await new Promise(resolve => setTimeout(resolve, 1500))
            while (attempts < maxAttempts) {
                const taskResponse = await client.tasks.getTask(taskUid)
                if (!taskResponse || typeof taskResponse.status === 'undefined') {
                    throw new Error('Invalid task response received')
                }
                if (taskResponse.status === 'succeeded') {
                    toast.add({
                        severity: 'success',
                        summary: 'Task Succeeded',
                        detail: successMessage,
                        life: 5000,
                    })
                    return taskResponse
                }
                if (taskResponse.status === 'failed') {
                    console.error('Task Failed', taskResponse.error?.message)
                    throw new Error(taskResponse.error?.message ? `Task Failed: ${taskResponse.error.message}` : 'Task failed.')
                }
                if (taskResponse.status === 'canceled') {
                    throw new Error(taskResponse.error?.message ? `Task Cancelled: ${taskResponse.error.message}` : 'Task cancelled.')
                }
                if (taskResponse.status === 'enqueued' || taskResponse.status === 'processing') {
                    attempts++
                    await new Promise(resolve => setTimeout(resolve, delayMs))
                    continue
                }
                throw new Error(`Unknown task status: ${taskResponse.status}`)
            }
            throw new Error(`Task did not complete after ${maxAttempts} attempts, please check the Tasks log`)
        } finally {
            checkingTaskStatus.value = false
            // Add slight delay as not to clash with potential error toasts
            setTimeout(() => {
                toast.remove(taskToastOptions)
            }, 100)
        }
    }

    watch(error, (newError) => {
        if (newError) {
            toast.add({
                severity: 'error',
                summary: 'Task Error',
                detail: newError,
                life: 7500,
            })
        }
    })

    return {
        error,
        tasksResults,
        tasks,
        isFetching,
        isPollingLatest,
        tasksPollingEnabled,
        hasMore,
        checkingTaskStatus,
        fetchTasks,
        fetchAndAppendTasks,
        pollLatestTasks,
        pollTaskStatus,
    }
}
