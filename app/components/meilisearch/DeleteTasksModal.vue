<script setup lang="ts">
import { useIndexes } from '@/composables/meilisearch/useIndexes'
import { TASK_TYPES, TASK_STATUSES } from '@/composables/meilisearch/useTasks'
import { getStatusSeverity } from '@/utils'
import ConfirmPopup from 'primevue/confirmpopup'
import { useConfirm } from 'primevue/useconfirm'
import type { DeleteOrCancelTasksQuery } from 'meilisearch'

const visible = defineModel<boolean>('visible', { default: false })
const query = defineModel<DeleteOrCancelTasksQuery>('query', { default: () => ({}) })

const emit = defineEmits<{
    submit: []
}>()

const confirm = useConfirm()
const { indexes, isFetching: isFetchingIndexes, fetchAllIndexes } = useIndexes()

const indexUids = computed(() => indexes.value.map((index) => index.uid))

const canSubmit = computed(() => {
    return (
        (query.value.types?.length ?? 0) > 0
        || (query.value.statuses?.length ?? 0) > 0
        || (query.value.indexUids?.length ?? 0) > 0
    )
})

function reset() {
    query.value = {}
}

function confirmDelete(event: Event) {
    confirm.require({
        target: event.currentTarget as HTMLElement,
        message: 'Are you sure you want to delete these tasks?',
        rejectProps: {
            label: 'Cancel',
            severity: 'secondary',
            text: true,
        },
        acceptProps: {
            label: 'Delete',
            severity: 'danger',
        },
        accept: () => {
            visible.value = false
            emit('submit')
        },
    })
}

function handleCancel() {
    visible.value = false
}

watch(visible, (isVisible) => {
    reset()
    if (isVisible) {
        fetchAllIndexes()
    }
})
</script>

<template>
    <Dialog
        v-model:visible="visible"
        class="w-full sm:w-[30rem]"
        position="center"
        header="Delete Tasks"
        :draggable="false"
        dismissable-mask
        modal
    >
        <ConfirmPopup />
        <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-2">
                <label for="delete-tasks-types">Types</label>
                <MultiSelect
                    id="delete-tasks-types"
                    v-model="query.types"
                    pt:label:class="flex flex-wrap"
                    :options="[...TASK_TYPES]"
                    display="chip"
                    placeholder="Any"
                    :showToggleAll="false"
                    showClear
                    filter
                    fluid
                />
            </div>
            <div class="flex flex-col gap-2">
                <label for="delete-tasks-statuses">Statuses</label>
                <MultiSelect
                    id="delete-tasks-statuses"
                    v-model="query.statuses"
                    pt:label:class="flex flex-wrap"
                    :options="[...TASK_STATUSES]"
                    display="chip"
                    placeholder="Any"
                    :showToggleAll="false"
                    showClear
                    filter
                    fluid
                >
                    <template #option="{ option }">
                        <Tag
                            :value="option"
                            :severity="getStatusSeverity(option)"
                        />
                    </template>
                </MultiSelect>
            </div>
            <div class="flex flex-col gap-2">
                <label for="delete-tasks-indexes">Indexes</label>
                <MultiSelect
                    id="delete-tasks-indexes"
                    v-model="query.indexUids"
                    pt:label:class="flex flex-wrap"
                    :options="indexUids"
                    display="chip"
                    placeholder="Any"
                    :showToggleAll="false"
                    showClear
                    filter
                    fluid
                    :loading="isFetchingIndexes"
                />
            </div>
        </div>
        <template #footer>
            <div class="flex gap-4">
                <Button
                    label="Cancel"
                    severity="secondary"
                    text
                    @click="handleCancel"
                />
                <Button
                    label="Delete"
                    severity="danger"
                    :disabled="!canSubmit"
                    @click="confirmDelete($event)"
                />
            </div>
        </template>
    </Dialog>
</template>
