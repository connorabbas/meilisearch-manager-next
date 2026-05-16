<script setup lang="ts">
import type { SearchRuleCondition, SearchRuleQueryCondition, SearchRuleTimeCondition } from 'meilisearch'

const visible = defineModel<boolean>('visible', { default: false })
const condition = defineModel<SearchRuleCondition>('condition', { required: true })

const emit = defineEmits<{
    save: []
}>()

const scopeOptions = [
    { label: 'Query', value: 'query' },
    { label: 'Time', value: 'time' },
]

const queryMatchOptions = [
    { label: 'Is Empty', value: 'isEmpty' },
    { label: 'Contains', value: 'contains' },
]

const internalScope = ref<'query' | 'time'>('query')
const queryMatchType = ref<'isEmpty' | 'contains'>('isEmpty')
const queryContainsValue = ref('')
const timeStart = ref<Date | null>(null)
const timeEnd = ref<Date | null>(null)

const isTimeEmpty = computed(() => {
    if (internalScope.value !== 'time') return false
    return !timeStart.value && !timeEnd.value
})

const isTimeRangeInverted = computed(() => {
    if (internalScope.value !== 'time') return false
    if (!timeStart.value || !timeEnd.value) return false
    return timeStart.value.getTime() > timeEnd.value.getTime()
})

const canSave = computed(() => {
    if (internalScope.value === 'query') {
        return queryMatchType.value !== 'contains' || queryContainsValue.value.trim().length > 0
    }
    return !isTimeEmpty.value && !isTimeRangeInverted.value
})

function resetForm() {
    const c = condition.value

    if (c.scope === 'query') {
        internalScope.value = 'query'
        const qc = c as SearchRuleQueryCondition
        if (qc.contains !== undefined && qc.contains !== null) {
            queryMatchType.value = 'contains'
            queryContainsValue.value = qc.contains
        } else {
            queryMatchType.value = 'isEmpty'
            queryContainsValue.value = ''
        }
        timeStart.value = null
        timeEnd.value = null
    } else {
        internalScope.value = 'time'
        const tc = c as SearchRuleTimeCondition
        timeStart.value = tc.start ? new Date(tc.start) : null
        timeEnd.value = tc.end ? new Date(tc.end) : null
        queryMatchType.value = 'isEmpty'
        queryContainsValue.value = ''
    }
}

function handleSave() {
    if (internalScope.value === 'query') {
        const base: SearchRuleQueryCondition = { scope: 'query' }
        if (queryMatchType.value === 'isEmpty') {
            base.isEmpty = true
        } else {
            base.contains = queryContainsValue.value
        }
        condition.value = base
    } else {
        const base: SearchRuleTimeCondition = { scope: 'time' }
        if (timeStart.value) {
            base.start = timeStart.value.toISOString()
        }
        if (timeEnd.value) {
            base.end = timeEnd.value.toISOString()
        }
        condition.value = base
    }

    visible.value = false
    emit('save')
}

function handleCancel() {
    visible.value = false
}

watch(visible, (isVisible) => {
    if (isVisible) {
        resetForm()
    }
})
</script>

<template>
    <Dialog
        v-model:visible="visible"
        class="w-full sm:w-[30rem]"
        position="center"
        header="Condition"
        :draggable="false"
        dismissable-mask
        modal
    >
        <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-2">
                <label for="condition-scope">Scope</label>
                <Select
                    id="condition-scope"
                    v-model="internalScope"
                    :options="scopeOptions"
                    option-label="label"
                    option-value="value"
                    placeholder="Select a scope"
                    fluid
                />
            </div>

            <template v-if="internalScope === 'query'">
                <div class="flex flex-col gap-2">
                    <label for="condition-query-match">Match Type</label>
                    <Select
                        id="condition-query-match"
                        v-model="queryMatchType"
                        :options="queryMatchOptions"
                        option-label="label"
                        option-value="value"
                        placeholder="Select match type"
                        fluid
                    />
                </div>
                <div
                    v-if="queryMatchType === 'contains'"
                    class="flex flex-col gap-2"
                >
                    <label for="condition-query-value">Query Term</label>
                    <InputText
                        id="condition-query-value"
                        v-model="queryContainsValue"
                        placeholder="e.g. invoice"
                        type="text"
                        fluid
                    />
                </div>
            </template>

            <template v-else-if="internalScope === 'time'">
                <div class="flex flex-col gap-2">
                    <label for="condition-time-start">Start Date</label>
                    <DatePicker
                        id="condition-time-start"
                        v-model="timeStart"
                        placeholder="Select start date"
                        show-time
                        hour-format="24"
                        fluid
                        :invalid="isTimeEmpty || isTimeRangeInverted"
                    />
                </div>
                <div class="flex flex-col gap-2">
                    <label for="condition-time-end">End Date</label>
                    <DatePicker
                        id="condition-time-end"
                        v-model="timeEnd"
                        placeholder="Select end date"
                        show-time
                        hour-format="24"
                        fluid
                        :invalid="isTimeEmpty || isTimeRangeInverted"
                    />
                </div>
                <Message v-if="isTimeEmpty || isTimeRangeInverted" severity="error">
                    <span v-if="isTimeEmpty">A time condition requires at least a start or end date.</span>
                    <span v-else-if="isTimeRangeInverted">Start date must be before end date.</span>
                </Message>
            </template>
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
                    :disabled="!canSave"
                    @click="handleSave"
                />
            </div>
        </template>
    </Dialog>
</template>
