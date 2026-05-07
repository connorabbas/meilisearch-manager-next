<script setup lang="ts">
import { looksLikeAnImageUrl } from '@/utils'
import { Expand, Minimize2, Pencil, Trash2 } from '@lucide/vue'
import type { Hit } from 'meilisearch'
import ThemedJsonViewer from '../ThemedJsonViewer.vue'

const props = defineProps<{
    primaryKey?: string,
    hit: Hit,
    showRankingScore?: boolean,
}>()

defineEmits(['edit', 'delete'])

const image = computed(() => Object.values(props.hit).find(looksLikeAnImageUrl) as string | null)

const expandedJson = ref(false)
function toggleJsonExpanded() {
    expandedJson.value = !expandedJson.value
}

const rankingScore = computed(() => {
    return (props.hit as Hit & { _rankingScore?: number })._rankingScore
})

const rankingScorePercentage = computed(() => {
    if (rankingScore.value === undefined) return 0
    return Math.round(rankingScore.value * 100)
})

const rankingScoreColor = computed(() => {
    const score = rankingScore.value ?? 0
    if (score >= 0.7) return 'var(--color-green-500)'
    if (score >= 0.5) return 'var(--color-yellow-500)'
    return 'var(--color-red-500)'
})

const meterValue = computed(() => {
    if (rankingScore.value === undefined) return []
    return [{
        label: 'Ranking Score',
        value: rankingScorePercentage.value,
        color: rankingScoreColor.value,
    }]
})
</script>

<template>
    <Card
        class="h-full group hover:border-primary transition-all duration-100 ease-in-out"
        pt:body:class="p-4"
    >
        <template #content>
            <div class="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <div
                    v-if="image"
                    class="rounded-xl"
                >
                    <Image
                        v-if="looksLikeAnImageUrl(image)"
                        :src="image"
                        alt="Document Image"
                        pt:previewMask:class="rounded-xl"
                        pt:image:class="max-h-40 max-w-40 shrink object-cover object-top rounded-xl border dynamic-border"
                        preview
                    />
                </div>
                <div
                    ref="document-json-viewer"
                    class="grow rounded-border flex flex-col gap-4"
                >
                    <div
                        v-if="showRankingScore && rankingScore !== undefined"
                        class="w-full"
                    >
                        <MeterGroup
                            :value="meterValue"
                            :min="0"
                            :max="100"
                            labelPosition="start"
                        />
                    </div>
                    <ThemedJsonViewer
                        class="py-2 rounded-border"
                        :data="props.hit"
                        :expanded="expandedJson"
                    />
                </div>
                <div class="flex flex-row sm:flex-col justify-end gap-4">
                    <Button
                        v-tooltip.left="`${expandedJson ? 'Minimize' : 'Expand'} Data`"
                        severity="secondary"
                        outlined
                        @click="toggleJsonExpanded()"
                    >
                        <template #icon>
                            <Minimize2 v-if="expandedJson" />
                            <Expand v-else />
                        </template>
                    </Button>
                    <Button
                        v-tooltip.left="'Edit Document'"
                        severity="secondary"
                        outlined
                        @click="$emit('edit', props.hit)"
                    >
                        <template #icon>
                            <Pencil />
                        </template>
                    </Button>
                    <Button
                        v-if="props.primaryKey"
                        v-tooltip.left="'Delete Document'"
                        severity="danger"
                        outlined
                        @click="$emit('delete', props.hit[props.primaryKey])"
                    >
                        <template #icon>
                            <Trash2 />
                        </template>
                    </Button>
                </div>
            </div>
        </template>
    </Card>
</template>