<script setup lang="ts">
import { Clock, Database, FileText, RefreshCw } from '@lucide/vue'
import { useIndexes } from '@/composables/meilisearch/useIndexes'
import { useStats } from '@/composables/meilisearch/useStats'

definePageMeta({
    layout: 'app',
    title: 'Index Info',
})

const route = useRoute()
const indexUid = computed(() => String(route.params.uid ?? ''))
const { currentIndex, isFetching: fetchingIndexData, error, fetchIndex } = useIndexes()
const { indexStats, isFetching: fetchingStatsData, fetchIndexStats } = useStats()

async function fetchData() {
    await Promise.all([
        fetchIndex(indexUid.value),
        fetchIndexStats(indexUid.value),
    ])
}

watch(indexUid, () => {
    void fetchData()
}, { immediate: true })

const fetching = computed(() => fetchingIndexData.value || fetchingStatsData.value)
</script>

<template>
    <div class="flex flex-col gap-4 md:gap-8">
        <Teleport to="#index-page-actions">
            <Button
                label="Refresh"
                severity="secondary"
                :loading="fetching"
                @click="fetchData"
            >
                <template #icon>
                    <RefreshCw />
                </template>
                <template #loadingicon>
                    <RefreshCw class="animate-spin" />
                </template>
            </Button>
        </Teleport>

        <Message
            v-if="error"
            severity="error"
            :closable="false"
        >
            {{ error }}
        </Message>

        <div
            v-if="fetching"
            class="grid grid-cols-12 items-stretch gap-4"
        >
            <div
                v-for="card in 4"
                :key="card"
                class="col-span-12 sm:col-span-6 lg:col-span-3"
            >
                <Card class="h-full">
                    <template #subtitle>
                        <Skeleton width="7rem" height="1rem" />
                    </template>
                    <template #content>
                        <Skeleton width="100%" height="2rem" />
                    </template>
                </Card>
            </div>
        </div>

        <div
            v-else-if="currentIndex && indexStats"
            class="grid grid-cols-12 items-stretch gap-4"
        >
            <div class="col-span-12 sm:col-span-6 lg:col-span-3">
                <Card class="h-full">
                    <template #subtitle>
                        Total Documents
                    </template>
                    <template #content>
                        <div class="flex gap-3 items-center text-2xl font-semibold">
                            <FileText class="size-6!" /> {{ indexStats.numberOfDocuments?.toLocaleString() || 0 }}
                        </div>
                    </template>
                </Card>
            </div>
            <div class="col-span-12 sm:col-span-6 lg:col-span-3">
                <Card class="h-full">
                    <template #subtitle>
                        Index Size
                    </template>
                    <template #content>
                        <div class="flex gap-3 items-center text-2xl font-semibold">
                            <Database class="size-6!" /> {{ formatBytes(indexStats.rawDocumentDbSize || 0) }}
                        </div>
                    </template>
                </Card>
            </div>
            <div
                v-if="currentIndex.updatedAt"
                class="col-span-12 sm:col-span-6 lg:col-span-3"
            >
                <Card class="h-full">
                    <template #subtitle>
                        Last Updated
                    </template>
                    <template #content>
                        <div class="flex gap-3 items-center text-xl font-semibold">
                            <Clock class="size-6!" /> {{ formatDate(currentIndex.updatedAt) }}
                        </div>
                    </template>
                </Card>
            </div>
            <div
                v-if="currentIndex.createdAt"
                class="col-span-12 sm:col-span-6 lg:col-span-3"
            >
                <Card class="h-full">
                    <template #subtitle>
                        Created
                    </template>
                    <template #content>
                        <div class="flex gap-3 items-center text-xl font-semibold">
                            <Clock class="size-6!" /> {{ formatDate(currentIndex.createdAt) }}
                        </div>
                    </template>
                </Card>
            </div>
        </div>
    </div>
</template>
