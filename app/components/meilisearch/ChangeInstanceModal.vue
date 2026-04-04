<script setup lang="ts">
import { useMeilisearchStore } from '@/stores/meilisearch'
import { Plus } from '@lucide/vue'

const modalOpen = defineModel<boolean>({ default: false })

const meilisearchStore = useMeilisearchStore()

const currentInstanceId = ref(meilisearchStore.currentInstance?.id)

async function handleChangeInstance() {
    if (currentInstanceId.value) {
        meilisearchStore.setCurrent(currentInstanceId.value)
        modalOpen.value = false
        await navigateTo('/dashboard', { replace: true })
    }
}
</script>

<template>
    <Dialog
        v-model:visible="modalOpen"
        class="w-[30rem]"
        position="center"
        header="Change Instance"
        :draggable="false"
        dismissableMask
        modal
    >
        <div>
            <Select
                v-if="!meilisearchStore.singleInstanceMode && meilisearchStore.instances.length"
                v-model="currentInstanceId"
                :options="(meilisearchStore.instances as any[])"
                optionLabel="name"
                optionValue="id"
                fluid
            >
                <template #footer>
                    <div class="p-2">
                        <NuxtLink to="/new-instance">
                            <Button
                                label="Add new instance"
                                severity="secondary"
                                size="small"
                                text
                                fluid
                            >
                                <template #icon>
                                    <Plus />
                                </template>
                            </Button>
                        </NuxtLink>
                    </div>
                </template>
            </Select>
        </div>
        <template #footer>
            <div class="flex gap-4">
                <Button
                    label="Cancel"
                    plain
                    text
                    @click="modalOpen = false"
                />
                <Button
                    label="Submit"
                    @click="handleChangeInstance"
                />
            </div>
        </template>
    </Dialog>
</template>
