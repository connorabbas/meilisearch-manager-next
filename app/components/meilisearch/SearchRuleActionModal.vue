<script setup lang="ts">
import { useMeilisearchStore } from '@/stores/meilisearch'
import { useIndexes } from '@/composables/meilisearch/useIndexes'
import { useDebounceFn } from '@vueuse/core'
import type { SearchRuleAction, SearchRuleSelector, SearchRulePinAction, RecordAny } from 'meilisearch'

const visible = defineModel<boolean>('visible', { default: false })
const action = defineModel<SearchRuleAction>('action', { required: true })

const emit = defineEmits<{
    save: []
}>()

const meilisearchStore = useMeilisearchStore()
const { indexes, fetchAllIndexes } = useIndexes()

const actionTypeOptions = [
    { label: 'Pin', value: 'pin' },
]

const internalActionType = ref<'pin'>('pin')
const selectedIndexUid = ref<string>('')
const documentQuery = ref('')
const selectedDocumentId = ref<string | null>(null)
const position = ref<number>(0)
const searchSuggestions = ref<RecordAny[]>([])
const isSearching = ref(false)

const selectedIndex = computed(() => indexes.value.find(i => i.uid === selectedIndexUid.value))
const primaryKey = computed(() => selectedIndex.value?.primaryKey ?? 'id')

function resetForm() {
    const a = action.value

    if (a.selector?.indexUid) {
        selectedIndexUid.value = a.selector.indexUid
    } else {
        selectedIndexUid.value = ''
    }

    if (a.selector?.id) {
        selectedDocumentId.value = a.selector.id
        documentQuery.value = String(a.selector.id)
    } else {
        selectedDocumentId.value = null
        documentQuery.value = ''
    }

    position.value = (a.action as SearchRulePinAction)?.position ?? 0
    internalActionType.value = 'pin'
    searchSuggestions.value = []
}

async function searchDocuments(query: string) {
    if (!selectedIndexUid.value || !query.trim()) {
        searchSuggestions.value = []
        return
    }

    const client = meilisearchStore.getClient()
    if (!client) return

    isSearching.value = true
    try {
        const results = await client.index(selectedIndexUid.value).search(query, { limit: 20 })
        searchSuggestions.value = results.hits
    } catch {
        searchSuggestions.value = []
    } finally {
        isSearching.value = false
    }
}

const debouncedSearch = useDebounceFn(searchDocuments, 300)

function onDocumentQueryChange(event: { query: string }) {
    documentQuery.value = event.query
    selectedDocumentId.value = null
    debouncedSearch(event.query)
}

function onDocumentSelect(event: { value: RecordAny | string }) {
    const value = event.value
    if (typeof value === 'string') {
        selectedDocumentId.value = value
        documentQuery.value = value
    } else if (value && typeof value === 'object') {
        const rawId = value[primaryKey.value]
        const id = rawId !== undefined && rawId !== null ? String(rawId) : ''
        selectedDocumentId.value = id
        documentQuery.value = id
    }
}

function onDocumentBlur() {
    const query = documentQuery.value
    if (typeof query !== 'string') {
        return
    }
    const trimmed = query.trim()
    if (trimmed) {
        selectedDocumentId.value = trimmed
    }
}

function handleSave() {
    if (!selectedIndexUid.value || !selectedDocumentId.value) {
        return
    }

    const selector: SearchRuleSelector = {
        indexUid: selectedIndexUid.value,
        id: selectedDocumentId.value,
    }

    const pinAction: SearchRulePinAction = {
        type: 'pin',
        position: position.value,
    }

    action.value = {
        selector,
        action: pinAction,
    }

    visible.value = false
    emit('save')
}

function handleCancel() {
    visible.value = false
}

watch(visible, (isVisible) => {
    if (isVisible) {
        fetchAllIndexes()
        resetForm()
    }
})
</script>

<template>
    <Dialog
        v-model:visible="visible"
        class="w-full sm:w-[30rem]"
        position="center"
        header="Action"
        :draggable="false"
        dismissable-mask
        modal
    >
        <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-2">
                <label for="action-type">Action Type</label>
                <Select
                    id="action-type"
                    v-model="internalActionType"
                    :options="actionTypeOptions"
                    option-label="label"
                    option-value="value"
                    placeholder="Select action type"
                    fluid
                />
            </div>

            <div class="flex flex-col gap-2">
                <label for="action-index">Index</label>
                <Select
                    id="action-index"
                    v-model="selectedIndexUid"
                    :options="indexes.map(i => i.uid)"
                    placeholder="Select an index"
                    fluid
                />
            </div>

            <div
                v-if="selectedIndexUid"
                class="flex flex-col gap-2"
            >
                <label for="action-document">Document</label>
                <AutoComplete
                    id="action-document"
                    v-model="documentQuery"
                    :suggestions="searchSuggestions"
                    :option-label="(option: any) => String(option[primaryKey] ?? '')"
                    placeholder="Search for a document..."
                    :loading="isSearching"
                    fluid
                    forceSelection
                    @complete="onDocumentQueryChange"
                    @item-select="onDocumentSelect"
                    @blur="onDocumentBlur"
                >
                    <template #option="{ option }">
                        <div class="flex flex-col gap-2">
                            <span class="font-medium">{{ option[primaryKey] ?? 'Unknown' }}</span>
                            <span class="text-xs text-muted-color truncate">{{ JSON.stringify(option).slice(0, 80) }}...</span>
                        </div>
                    </template>
                </AutoComplete>
            </div>

            <div class="flex flex-col gap-2">
                <label for="action-position">Position</label>
                <InputNumber
                    id="action-position"
                    v-model="position"
                    :min="0"
                    placeholder="Pin position"
                    fluid
                />
            </div>
        </div>

        <template #footer>
            <div class="flex gap-4">
                <Button
                    label="Cancel"
                    plain
                    text
                    @click="handleCancel"
                />
                <Button
                    label="Save"
                    :disabled="!selectedIndexUid || !selectedDocumentId"
                    @click="handleSave"
                />
            </div>
        </template>
    </Dialog>
</template>
