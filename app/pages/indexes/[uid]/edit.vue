<script setup lang="ts">
import { useIndexes } from '@/composables/meilisearch/useIndexes'
import UpdateIndexPrimaryKeyForm from '@/components/meilisearch/UpdateIndexPrimaryKeyForm.vue'
import DeleteIndexDataDangerZone from '@/components/meilisearch/DeleteIndexDataDangerZone.vue'
import type { Index } from 'meilisearch'

definePageMeta({
    layout: 'app',
    title: 'Index - Edit',
})

const route = useRoute()
const indexUid = computed(() => String(route.params.uid ?? ''))
const { currentIndex, error, fetchIndex } = useIndexes()

await fetchIndex(indexUid.value)
</script>

<template>
    <div class="flex flex-col gap-4 md:gap-8 md:max-w-2xl">
        <Message
            v-if="error"
            severity="error"
            :closable="false"
        >
            {{ error }}
        </Message>

        <Card
            pt:body:class="max-w-2xl space-y-3"
            pt:caption:class="space-y-1"
        >
            <template #title>
                Primary Key
            </template>
            <template #content>
                <UpdateIndexPrimaryKeyForm
                    :indexUid="indexUid"
                    :index="(currentIndex as Index)"
                    @refetch-index="fetchIndex(indexUid)"
                />
            </template>
        </Card>

        <Card
            pt:body:class="max-w-2xl space-y-3"
            pt:caption:class="space-y-1"
        >
            <template #title>
                Delete
            </template>
            <template #content>
                <DeleteIndexDataDangerZone :indexUid="indexUid" />
            </template>
        </Card>
    </div>
</template>
