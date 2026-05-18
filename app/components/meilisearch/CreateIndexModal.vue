<script setup lang="ts">
import { useIndexes } from '@/composables/meilisearch/useIndexes'
import type { IndexOptions } from 'meilisearch'

const visible = defineModel<boolean>('visible', { default: false })

const emit = defineEmits<{
    'index-created': []
}>()

const { isSendingTask, createIndex } = useIndexes()

const uid = ref<string>('')
const primaryKey = ref<string>()

function submitNewIndex() {
    createIndex(uid.value, { primaryKey: primaryKey.value } as IndexOptions).then(() => {
        visible.value = false
        emit('index-created')
    }).catch(() => {
        //
    })
}

function reset() {
    uid.value = ''
    primaryKey.value = undefined
}

function handleCancel() {
    visible.value = false
    reset()
}

watch(visible, (isVisible) => {
    if (isVisible) {
        reset()
    }
})

watch(primaryKey, (newVal) => {
    if (newVal === '') {
        primaryKey.value = undefined
    }
})
</script>

<template>
    <Dialog
        v-model:visible="visible"
        class="w-full sm:w-[30rem]"
        position="center"
        header="New Index"
        :draggable="false"
        dismissable-mask
        modal
    >
        <form
            id="create-index-form"
            class="flex flex-col gap-6"
            @submit.prevent="submitNewIndex"
        >
            <div class="flex flex-col gap-2">
                <label for="new-index-uid">UID</label>
                <InputText
                    id="new-index-uid"
                    v-model="uid"
                    placeholder="uid of the requested index"
                    type="text"
                    autofocus
                    fluid
                />
            </div>
            <div class="flex flex-col gap-2">
                <label for="new-index-pk">Primary Key</label>
                <InputText
                    id="new-index-pk"
                    v-model="primaryKey"
                    placeholder="optional - primary key of the requested index"
                    type="text"
                    fluid
                />
            </div>
        </form>
        <template #footer>
            <div class="flex gap-4">
                <Button
                    label="Cancel"
                    severity="secondary"
                    text
                    @click="handleCancel"
                />
                <Button
                    type="submit"
                    form="create-index-form"
                    label="Submit"
                    :loading="isSendingTask"
                />
            </div>
        </template>
    </Dialog>
</template>
