<script setup lang="ts">
import type { Task } from 'meilisearch'
import { Mode } from 'vanilla-jsoneditor'
import ThemedJsonEditor from '../ThemedJsonEditor.vue'

const props = defineProps<{
    task: Task | null,
}>()

const visible = defineModel<boolean>('visible', { default: false })

const headerTitle = computed(() => `Task ${props.task?.uid}`)
</script>

<template>
    <Drawer
        v-model:visible="visible"
        :header="headerTitle"
        class="w-full sm:w-[60rem]"
        position="right"
    >
        <div>
            <ThemedJsonEditor
                :modelValue="task"
                :mode="Mode.text"
                :main-menu-bar="false"
                :stringified="false"
                read-only
            />
        </div>
    </Drawer>
</template>
