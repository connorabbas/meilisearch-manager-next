import { Meilisearch } from 'meilisearch'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { useStorage } from '@vueuse/core'
import { defineStore } from 'pinia'

export interface MeilisearchInstanceConfig {
    id: string;
    name: string;
    host: string;
    apiKey: string;
}

export const useMeilisearchStore = defineStore('meilisearch', () => {
    const toast = useToast()
    const confirm = useConfirm()
    const runtimeConfig = useRuntimeConfig()

    const hostEnv = String(runtimeConfig.public.meilisearchHost ?? '')
    const apiKeyEnv = String(runtimeConfig.public.meilisearchApiKey ?? '')
    const singleInstanceMode = !!hostEnv && !!apiKeyEnv

    const instances = singleInstanceMode
        ? ref<MeilisearchInstanceConfig[]>([{
            id: 'default',
            name: 'Default',
            host: hostEnv,
            apiKey: apiKeyEnv,
        }])
        : useStorage<MeilisearchInstanceConfig[]>('meilisearch-instances', [])

    const currentInstanceId = singleInstanceMode
        ? ref<string | null>('default')
        : useStorage<string | null>('meilisearch-current-id', null)

    const currentInstance = computed(() => instances.value.find(i => i.id === currentInstanceId.value) ?? null)
    const hasConfiguredInstance = computed(() => instances.value.length > 0)

    const client = shallowRef<Meilisearch | null>(null)
    const isConnecting = ref(false)
    const connectionError = ref<string | null>(null)
    const isConnected = computed(() => client.value !== null && !connectionError.value)

    async function checkConnection(host: string, apiKey: string): Promise<void> {
        try {
            const conn = new Meilisearch({ host, apiKey })
            await conn.health()
        } catch (err) {
            throw new Error(`Connection check failed: ${(err as Error).message}`)
        }
    }

    async function connect(id?: string) {
        let targetId = id ?? currentInstanceId.value ?? instances.value[0]?.id ?? null
        if (!targetId) {
            throw new Error('No instance selected')
        }
        if (client.value && !connectionError.value && currentInstanceId.value === targetId) {
            return client.value
        }
        isConnecting.value = true
        connectionError.value = null
        try {
            let inst = instances.value.find(i => i.id === targetId)
            if (!inst) {
                inst = instances.value[0]
                targetId = inst?.id ?? null
            }
            if (!inst || !targetId) {
                throw new Error('Instance not found')
            }
            const conn = new Meilisearch({ host: inst.host, apiKey: inst.apiKey })
            await conn.health()
            client.value = conn
            currentInstanceId.value = targetId
            return conn
        } catch (err) {
            client.value = null
            connectionError.value = (err as Error).message
            toast.add({
                severity: 'error',
                summary: 'Connection Failed',
                detail: connectionError.value,
                life: 7500,
            })
            throw err
        } finally {
            isConnecting.value = false
        }
    }

    function getClient() {
        if (!currentInstanceId.value) {
            console.error('No current instance selected')
            return null
        }
        if (!client.value) {
            console.error('Meilisearch client is not initialized for the current instance')
            return null
        }
        return client.value
    }

    async function addInstance(config: Omit<MeilisearchInstanceConfig, 'id'>) {
        if (instances.value.some(i => i.host === config.host)) {
            const errorMessage = `An instance with host "${config.host}" already exists`
            toast.add({
                severity: 'error',
                summary: 'Connection Failed',
                detail: errorMessage,
                life: 7500,
            })
            throw new Error(errorMessage)
        }

        try {
            await checkConnection(config.host, config.apiKey)
            const id = crypto.randomUUID()
            const instanceName = config.name || config.host
            instances.value.push({ id, name: instanceName, host: config.host, apiKey: config.apiKey })
            if (!currentInstanceId.value) {
                currentInstanceId.value = id
            }
            setCurrent(id)
            return id
        } catch (err) {
            toast.add({
                severity: 'error',
                summary: 'Failed to Add New Instance',
                detail: (err as Error).message,
                life: 7500,
            })
            throw err
        }
    }

    function removeInstance(id: string) {
        instances.value = instances.value.filter(i => i.id !== id)
        if (currentInstanceId.value === id) {
            currentInstanceId.value = instances.value[0]?.id ?? null
            client.value = null
            connectionError.value = null
        }
    }

    function confirmRemoveInstance(
        id: string,
        onRemovedCallback?: () => void | Promise<void>
    ) {
        confirm.require({
            group: 'delete',
            message: 'Are you sure you want to remove this instance?',
            header: 'Danger Zone',
            rejectLabel: 'Cancel',
            rejectProps: {
                label: 'Cancel',
                severity: 'secondary',
                outlined: true
            },
            acceptProps: {
                label: 'Remove',
                severity: 'danger',
            },
            accept: async () => {
                removeInstance(id)
                await onRemovedCallback?.()
            },
        })
    }

    function setCurrent(id: string) {
        if (!instances.value.some(i => i.id === id)) {
            throw new Error('Invalid instance ID')
        }
        currentInstanceId.value = id
        client.value = null // Reset client when switching instances
        connectionError.value = null
    }

    return {
        client: readonly(client),
        isConnecting: readonly(isConnecting),
        isConnected,
        connectionError: readonly(connectionError),
        singleInstanceMode,
        hasConfiguredInstance,
        instances: readonly(instances),
        currentInstance: readonly(currentInstance),
        connect,
        getClient,
        addInstance,
        removeInstance,
        confirmRemoveInstance,
        setCurrent,
    }
})
