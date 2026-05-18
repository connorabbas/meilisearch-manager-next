<script setup lang="ts">
import SearchRuleConditionModal from './SearchRuleConditionModal.vue'
import SearchRuleActionModal from './SearchRuleActionModal.vue'
import ConfirmPopup from 'primevue/confirmpopup'
import { useConfirm } from 'primevue/useconfirm'
import { Pencil, Plus, Trash2 } from '@lucide/vue'
import type {
    SearchRuleCondition,
    SearchRuleAction,
    SearchRuleQueryCondition,
    SearchRuleTimeCondition,
} from 'meilisearch'

export interface SearchRuleFormState {
    uid: string
    description: string
    priority: number | null
    active: boolean
    conditions: SearchRuleCondition[]
    actions: SearchRuleAction[]
}

const props = defineProps<{
    isEdit?: boolean,
}>()

const modelValue = defineModel<SearchRuleFormState>({ required: true })
const isLoading = defineModel<boolean>('isLoading', { default: false })

const emit = defineEmits<{
    save: []
    cancel: []
}>()

const confirm = useConfirm()

const canSave = computed(() => {
    return (
        modelValue.value.uid.trim().length > 0 &&
        modelValue.value.conditions.length > 0 &&
        modelValue.value.actions.length > 0
    )
})

// Condition dialog
const searchRuleConditionModalVisible = ref(false)
const editingCondition = ref<SearchRuleCondition>({ scope: 'query', isEmpty: true })
const editingConditionIndex = ref<number | null>(null)

function openAddCondition() {
    editingConditionIndex.value = null
    editingCondition.value = { scope: 'query', isEmpty: true }
    searchRuleConditionModalVisible.value = true
}

function openEditCondition(index: number) {
    editingConditionIndex.value = index
    editingCondition.value = structuredClone(toRaw(modelValue.value.conditions[index])) as SearchRuleCondition
    searchRuleConditionModalVisible.value = true
}

function confirmRemoveCondition(event: Event, index: number) {
    confirm.require({
        target: event.currentTarget as HTMLElement,
        message: 'Are you sure you want to delete this condition?',
        rejectProps: {
            label: 'Cancel',
            severity: 'secondary',
        },
        acceptProps: {
            label: 'Delete',
            severity: 'danger',
        },
        accept: () => {
            modelValue.value.conditions.splice(index, 1)
        },
    })
}

function onConditionSave() {
    if (editingConditionIndex.value === null) {
        modelValue.value.conditions.push(editingCondition.value)
    } else {
        modelValue.value.conditions[editingConditionIndex.value] = editingCondition.value
    }
}

function formatCondition(condition: SearchRuleCondition): string {
    if (condition.scope === 'query') {
        const c = condition as SearchRuleQueryCondition
        if (c.isEmpty) {
            return 'Query is empty'
        }
        if (c.contains) {
            return `Query contains "${c.contains}"`
        }
        return 'Query condition'
    }
    const c = condition as SearchRuleTimeCondition
    const start = c.start ? new Date(c.start).toLocaleString() : 'any time'
    const end = c.end ? new Date(c.end).toLocaleString() : 'any time'
    return `Time window: ${start} - ${end}`
}

// Action dialog
const searchRuleActionModalVisible = ref(false)
const editingAction = ref<SearchRuleAction>({
    selector: { indexUid: null, id: null },
    action: { type: 'pin', position: 0 },
})
const editingActionIndex = ref<number | null>(null)

function openAddAction() {
    editingActionIndex.value = null
    editingAction.value = {
        selector: { indexUid: null, id: null },
        action: { type: 'pin', position: 0 },
    }
    searchRuleActionModalVisible.value = true
}

function openEditAction(index: number) {
    editingActionIndex.value = index
    editingAction.value = structuredClone(toRaw(modelValue.value.actions[index])) as SearchRuleAction
    searchRuleActionModalVisible.value = true
}

function confirmRemoveAction(event: Event, index: number) {
    confirm.require({
        target: event.currentTarget as HTMLElement,
        message: 'Are you sure you want to delete this action?',
        rejectProps: {
            label: 'Cancel',
            severity: 'secondary',
        },
        acceptProps: {
            label: 'Delete',
            severity: 'danger',
        },
        accept: () => {
            modelValue.value.actions.splice(index, 1)
        },
    })
}

function onActionSave() {
    if (editingActionIndex.value === null) {
        modelValue.value.actions.push(editingAction.value)
    } else {
        modelValue.value.actions[editingActionIndex.value] = editingAction.value
    }
}
</script>

<template>
    <div class="flex flex-col gap-4 md:gap-8">
        <ConfirmPopup />
        <SearchRuleConditionModal
            v-model:visible="searchRuleConditionModalVisible"
            v-model:condition="editingCondition"
            @save="onConditionSave"
        />
        <SearchRuleActionModal
            v-model:visible="searchRuleActionModalVisible"
            v-model:action="editingAction"
            @save="onActionSave"
        />

        <!-- General Card -->
        <Card>
            <template #title>
                <div class="flex items-center justify-between mb-3">
                    <span>General</span>
                    <div class="flex items-center gap-3 text-sm!">
                        <label for="rule-active">Active</label>
                        <ToggleSwitch
                            id="rule-active"
                            v-model="modelValue.active"
                        />
                    </div>
                </div>
            </template>
            <template #content>
                <div class="flex flex-col gap-6">
                    <div class="flex flex-col sm:flex-row gap-6">
                        <div class="flex flex-col gap-2 grow">
                            <label for="rule-uid">Rule UID</label>
                            <InputText
                                id="rule-uid"
                                v-model="modelValue.uid"
                                placeholder="e.g. summer-sale"
                                type="text"
                                :disabled="props.isEdit"
                                fluid
                            />
                        </div>
                        <div class="flex flex-col gap-2">
                            <label for="rule-priority">Priority</label>
                            <InputNumber
                                id="rule-priority"
                                v-model="modelValue.priority"
                                :min="0"
                                placeholder="optional priority"
                                fluid
                            />
                        </div>
                    </div>
                    <div class="flex flex-col gap-2">
                        <label for="rule-description">Description</label>
                        <InputText
                            id="rule-description"
                            v-model="modelValue.description"
                            placeholder="optional description"
                            type="text"
                            fluid
                        />
                    </div>
                </div>
            </template>
        </Card>

        <!-- Conditions Card -->
        <Card>
            <template #title>
                <div class="flex items-center justify-between mb-3">
                    <span>Conditions</span>
                    <Button
                        label="Add Condition"
                        size="small"
                        @click="openAddCondition"
                    >
                        <template #icon>
                            <Plus />
                        </template>
                    </Button>
                </div>
            </template>
            <template #content>
                <DataTable
                    :value="modelValue.conditions"
                    column-resize-mode="expand"
                    scrollable
                >
                    <template #empty>
                        <NotFoundMessage subject="Condition" />
                    </template>
                    <Column header="Scope">
                        <template #body="{ data }">
                            <Tag
                                :value="(data as SearchRuleCondition).scope"
                                severity="info"
                            />
                        </template>
                    </Column>
                    <Column header="Details">
                        <template #body="{ data }">
                            {{ formatCondition(data as SearchRuleCondition) }}
                        </template>
                    </Column>
                    <Column
                        frozen
                        align-frozen="right"
                    >
                        <template #body="{ index }">
                            <div class="flex items-center gap-2">
                                <Button
                                    v-tooltip.top="'Edit Condition'"
                                    severity="secondary"
                                    rounded
                                    text
                                    @click="openEditCondition(index)"
                                >
                                    <template #icon>
                                        <Pencil class="size-4!" />
                                    </template>
                                </Button>
                                <Button
                                    v-tooltip.top="'Delete Condition'"
                                    severity="secondary"
                                    rounded
                                    text
                                    @click="confirmRemoveCondition($event, index)"
                                >
                                    <template #icon>
                                        <Trash2 class="size-4!" />
                                    </template>
                                </Button>
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </template>
        </Card>

        <!-- Actions Card -->
        <Card>
            <template #title>
                <div class="flex items-center justify-between mb-3">
                    <span>Actions</span>
                    <Button
                        label="Add Action"
                        size="small"
                        @click="openAddAction"
                    >
                        <template #icon>
                            <Plus />
                        </template>
                    </Button>
                </div>
            </template>
            <template #content>
                <DataTable
                    :value="modelValue.actions"
                    column-resize-mode="expand"
                    scrollable
                >
                    <template #empty>
                        <NotFoundMessage subject="Action" />
                    </template>
                    <Column header="Type">
                        <template #body="{ data }">
                            <Tag
                                :value="(data as SearchRuleAction).action.type"
                                severity="info"
                            />
                        </template>
                    </Column>
                    <Column header="Index">
                        <template #body="{ data }">
                            {{ (data as SearchRuleAction).selector.indexUid }}
                        </template>
                    </Column>
                    <Column header="Document ID">
                        <template #body="{ data }">
                            {{ (data as SearchRuleAction).selector.id }}
                        </template>
                    </Column>
                    <Column header="Position">
                        <template #body="{ data }">
                            {{ (data as SearchRuleAction).action.position }}
                        </template>
                    </Column>
                    <Column
                        frozen
                        align-frozen="right"
                    >
                        <template #body="{ index }">
                            <div class="flex items-center gap-2">
                                <Button
                                    v-tooltip.top="'Edit Action'"
                                    severity="secondary"
                                    rounded
                                    text
                                    @click="openEditAction(index)"
                                >
                                    <template #icon>
                                        <Pencil class="size-4!" />
                                    </template>
                                </Button>
                                <Button
                                    v-tooltip.top="'Delete Action'"
                                    severity="secondary"
                                    rounded
                                    text
                                    @click="confirmRemoveAction($event, index)"
                                >
                                    <template #icon>
                                        <Trash2 class="size-4!" />
                                    </template>
                                </Button>
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </template>
        </Card>

        <!-- Footer Actions -->
        <div class="flex justify-end gap-4">
            <Button
                label="Cancel"
                severity="secondary"
                text
                @click="emit('cancel')"
            />
            <Button
                label="Save Rule"
                :loading="isLoading"
                :disabled="!canSave"
                @click="emit('save')"
            />
        </div>
    </div>
</template>
