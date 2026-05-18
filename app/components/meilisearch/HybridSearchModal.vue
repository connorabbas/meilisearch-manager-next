<script setup lang="ts">
import type { HybridSearch } from 'meilisearch'
import type { IndexEmbedderOption } from '@/types'

const props = defineProps<{
    embedders: IndexEmbedderOption[]
}>()
const emit = defineEmits<{
    cancel: []
}>()

const visible = defineModel<boolean>('visible', { default: false })

const hybridSearch = defineModel<HybridSearch | null>('hybridSearch', { required: true })

const hybridSearchState = reactive({
    embedder: '',
    semanticRatio: 0.5,
})

const selectedEmbedder = computed(() => {
    return props.embedders.find(embedder => embedder.name === hybridSearchState.embedder)
})
const selectedEmbedderModel = computed<string | undefined>(() => {
    const settings = selectedEmbedder.value?.settings

    if (settings && 'model' in settings) {
        return settings.model
    }

    return undefined
})
const semanticRatioLabel = computed(() => `${Math.round(hybridSearchState.semanticRatio * 100)}% semantic`)

function resetForm() {
    hybridSearchState.embedder = hybridSearch.value?.embedder ?? props.embedders[0]?.name ?? ''
    hybridSearchState.semanticRatio = hybridSearch.value?.semanticRatio ?? 0.5
}

function handleCancel() {
    visible.value = false
    emit('cancel')
}

function handleHybridSearchConfig() {
    if (!hybridSearchState.embedder) {
        return
    }

    hybridSearch.value = {
        embedder: hybridSearchState.embedder,
        semanticRatio: hybridSearchState.semanticRatio,
    }
    visible.value = false
}

watch(visible, (isVisible) => {
    if (isVisible) {
        resetForm()
    }
})

watch(() => props.embedders, () => {
    if (!visible.value) {
        return
    }

    if (!props.embedders.some(embedder => embedder.name === hybridSearchState.embedder)) {
        hybridSearchState.embedder = props.embedders[0]?.name ?? ''
    }
})
</script>

<template>
    <Dialog
        v-model:visible="visible"
        class="w-[30rem]"
        position="center"
        header="Hybrid Search"
        :draggable="false"
        dismissableMask
        modal
    >
        <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-2">
                <label
                    for="hybrid-search-embedder"
                    class="font-medium"
                >Embedder</label>
                <Select
                    id="hybrid-search-embedder"
                    v-model="hybridSearchState.embedder"
                    :options="embedders"
                    optionLabel="label"
                    optionValue="name"
                    placeholder="Select an embedder"
                    fluid
                />
                <small
                    v-if="selectedEmbedderModel"
                    class="text-muted-color"
                >Model: {{ selectedEmbedderModel }}</small>
            </div>

            <div class="flex flex-col gap-3">
                <div class="flex items-center justify-between gap-4">
                    <label
                        for="hybrid-search-semantic-ratio"
                        class="font-medium"
                    >Semantic ratio</label>
                    <span class="text-sm text-muted-color">{{ semanticRatioLabel }}</span>
                </div>
                <Slider
                    id="hybrid-search-semantic-ratio"
                    v-model="hybridSearchState.semanticRatio"
                    :min="0"
                    :max="1"
                    :step="0.05"
                />
                <div class="flex justify-between text-xs text-muted-color">
                    <span>Full-text</span>
                    <span>Semantic</span>
                </div>
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
                    label="Submit"
                    :disabled="!hybridSearchState.embedder"
                    @click="handleHybridSearchConfig"
                />
            </div>
        </template>
    </Dialog>
</template>
