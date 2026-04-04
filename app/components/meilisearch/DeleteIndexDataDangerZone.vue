<script setup lang="ts">
import { useDocuments } from '@/composables/meilisearch/useDocuments'
import { useIndexes } from '@/composables/meilisearch/useIndexes'

const props = defineProps<{
    indexUid: string,
}>()

const { confirmDeleteIndex } = useIndexes()
const { confirmDeleteAllDocuments } = useDocuments()

function handleDeleteIndex() {
    confirmDeleteIndex(props.indexUid, undefined, () => {
        navigateTo('/dashboard')
    })
}
function handleDeleteAllDocuments() {
    confirmDeleteAllDocuments(props.indexUid)
}
</script>

<template>
    <div>
        <Message
            severity="error"
            pt:root:class="p-2"
        >
            <div class="flex flex-col gap-4">
                <div>
                    <div class="text-lg">
                        Warning
                    </div>
                    <div>
                        Please proceed with caution, this cannot be undone.
                    </div>
                </div>
                <div class="flex gap-4">
                    <Button
                        label="Delete this index"
                        severity="danger"
                        @click="handleDeleteIndex"
                    />
                    <Button
                        label="Delete all documents"
                        severity="danger"
                        @click="handleDeleteAllDocuments"
                    />
                </div>
            </div>
        </Message>
    </div>
</template>
