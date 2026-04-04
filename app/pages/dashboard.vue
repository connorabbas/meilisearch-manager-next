<script setup lang="ts">
import { formatDate, formatBytes } from '@/utils'
import { Clock, Database, FolderSearch, GitPullRequestArrow } from '@lucide/vue'
import { useStats } from '@/composables/meilisearch/useStats'
import { useMeilisearchStore } from '@/stores/meilisearch'

definePageMeta({
    layout: 'app',
    title: 'Dashboard',
    breadcrumbs: [{ label: 'Dashboard' }]
})

const { instanceStats, version, fetchStats, fetchVersion } = useStats()
const meilisearchStore = useMeilisearchStore()
const currentInstanceId = computed(() => meilisearchStore.currentInstance?.id ?? null)

async function fetchData() {
    await Promise.all([
        fetchStats(),
        fetchVersion(),
        new Promise<void>((resolve) => setTimeout(resolve, 1000)), // simulates slow API response
    ])
}

const initialInstanceId = currentInstanceId.value
if (initialInstanceId) {
    await meilisearchStore.connect(initialInstanceId)
    await fetchData()
}

watch(currentInstanceId, async (instanceId, previousInstanceId) => {
    if (!instanceId || instanceId === previousInstanceId) {
        return
    }

    await meilisearchStore.connect(instanceId)
    await fetchData()
})
</script>

<template>
    <div>
        <!-- TODO error messaging -->
        <div class="grid grid-cols-12 items-stretch gap-4">
            <div
                v-if="instanceStats"
                class="col-span-12 sm:col-span-6 lg:col-span-3"
            >
                <Card class="h-full">
                    <template #subtitle>
                        Database Size
                    </template>
                    <template #content>
                        <div class="flex gap-3 items-center text-2xl font-semibold">
                            <Database class="size-6!" /> {{ formatBytes(instanceStats.databaseSize) }}
                        </div>
                    </template>
                </Card>
            </div>
            <div
                v-if="instanceStats"
                class="col-span-12 sm:col-span-6 lg:col-span-3"
            >
                <Card class="h-full">
                    <template #subtitle>
                        Total Indexes
                    </template>
                    <template #content>
                        <div class="flex gap-3 items-center text-2xl font-semibold">
                            <FolderSearch class="size-6!" /> {{ Object.keys(instanceStats.indexes).length }}
                        </div>
                    </template>
                </Card>
            </div>
            <div
                v-if="instanceStats"
                class="col-span-12 sm:col-span-6 lg:col-span-3"
            >
                <Card class="h-full">
                    <template #subtitle>
                        Last Updated
                    </template>
                    <template #content>
                        <div class="flex gap-3 items-center text-xl font-semibold">
                            <Clock class="size-6!" /> {{ formatDate(instanceStats.lastUpdate) }}
                        </div>
                    </template>
                </Card>
            </div>
            <div
                v-if="version"
                class="col-span-12 sm:col-span-6 lg:col-span-3"
            >
                <Card class="h-full">
                    <template #subtitle>
                        Version
                    </template>
                    <template #content>
                        <div class="flex gap-3 items-center text-xl font-semibold">
                            <GitPullRequestArrow class="size-6!" /> {{ version.pkgVersion }}
                        </div>
                    </template>
                </Card>
            </div>
        </div>
    </div>
</template>
