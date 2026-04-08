<script setup lang="ts">
import { useMeilisearchStore } from '@/stores/meilisearch'
import { CircleX, RefreshCw } from '@lucide/vue'

definePageMeta({
    layout: 'app',
    title: 'Connection Error',
})

const meilisearchStore = useMeilisearchStore()

const errorMessage = computed(() => {
    return meilisearchStore.connectionError || 'Unable to connect to the configured Meilisearch instance.'
})

async function retryConnection() {
    if (!meilisearchStore.currentInstance?.id) {
        return
    }

    try {
        await meilisearchStore.connect(meilisearchStore.currentInstance.id)
        await navigateTo('/dashboard', { replace: true })
    } catch {
        // The store already captures and reports the connection error.
    }
}
</script>

<template>
    <Card pt:body:class="p-6 sm:p-8 md:p-12">
        <template #content>
            <div class="flex min-h-[50svh] items-center justify-center">
                <section class="flex flex-col items-center gap-6 text-center md:gap-8">
                    <div class="space-y-6">
                        <h1 class="font-extrabold text-4xl sm:text-5xl">
                            Connection Error
                        </h1>
                        <p class="text-muted-color">
                            {{ meilisearchStore.currentInstance?.name || 'Current instance' }} is unavailable.
                            Choose another saved instance or retry the current connection.
                        </p>
                    </div>

                    <Message severity="error">
                        <template #icon>
                            <CircleX />
                        </template>
                        {{ errorMessage }}
                    </Message>

                    <div class="flex flex-wrap items-center justify-center gap-3">
                        <Button
                            label="Retry Connection"
                            :loading="meilisearchStore.isConnecting"
                            @click="retryConnection"
                        >
                            <template #icon>
                                <RefreshCw />
                            </template>
                            <template #loadingicon>
                                <RefreshCw class="animate-spin" />
                            </template>
                        </Button>
                    </div>
                </section>
            </div>
        </template>
    </Card>
</template>
