<script setup lang="ts">
import { Brain, Clock, Database, FileCheck, FileText } from '@lucide/vue'
import FieldDistributionChart from '@/components/meilisearch/FieldDistributionChart.vue'
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
            <RefreshButton
                :loading="fetching"
                @click="fetchData"
            />
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
            <div class="col-span-12 md:col-span-6 grid grid-cols-2 gap-4 content-start">
                <div
                    v-for="card in 6"
                    :key="card"
                    class="col-span-2 sm:col-span-1"
                >
                    <Card class="h-full">
                        <template #subtitle>
                            <Skeleton
                                width="7rem"
                                height="1rem"
                            />
                        </template>
                        <template #content>
                            <Skeleton
                                width="100%"
                                height="2rem"
                            />
                        </template>
                    </Card>
                </div>
            </div>
            <div class="col-span-12 md:col-span-6">
                <Card class="h-full">
                    <template #title>
                        <Skeleton
                            width="10rem"
                            height="1.5rem"
                        />
                    </template>
                    <template #content>
                        <div class="flex justify-center items-center h-64">
                            <Skeleton
                                shape="circle"
                                size="16rem"
                            />
                        </div>
                    </template>
                </Card>
            </div>
        </div>

        <div
            v-else-if="currentIndex && indexStats"
            class="grid grid-cols-12 items-stretch gap-4"
        >
            <div class="col-span-12 md:col-span-6 grid grid-cols-2 gap-4 content-start">
                <div class="col-span-2 sm:col-span-1">
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
                <div class="col-span-2 sm:col-span-1">
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
                <div class="col-span-2 sm:col-span-1">
                    <Card class="h-full">
                        <template #subtitle>
                            Total Embeddings
                        </template>
                        <template #content>
                            <div class="flex gap-3 items-center text-2xl font-semibold">
                                <Brain class="size-6!" /> {{ indexStats.numberOfEmbeddings?.toLocaleString() || 0 }}
                            </div>
                        </template>
                    </Card>
                </div>
                <div class="col-span-2 sm:col-span-1">
                    <Card class="h-full">
                        <template #subtitle>
                            Embedded Documents
                        </template>
                        <template #content>
                            <div class="flex gap-3 items-center text-2xl font-semibold">
                                <FileCheck class="size-6!" /> {{ indexStats.numberOfEmbeddedDocuments?.toLocaleString()
                                    || 0 }}
                            </div>
                        </template>
                    </Card>
                </div>
                <div
                    v-if="currentIndex.updatedAt"
                    class="col-span-2 sm:col-span-1"
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
                    class="col-span-2 sm:col-span-1"
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

            <div class="col-span-12 md:col-span-6">
                <Card class="h-full">
                    <template #title>
                        Field Distribution
                    </template>
                    <template #content>
                        <FieldDistributionChart :field-distribution="indexStats.fieldDistribution" />
                    </template>
                </Card>
            </div>
        </div>
    </div>
</template>
