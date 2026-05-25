<script setup lang="ts">
import { AlertCircle, Download, FileJson, FileSpreadsheet } from '@lucide/vue'
import { useExportDocuments } from '@/composables/meilisearch/useExportDocuments'

const props = defineProps<{
    indexUid: string,
}>()

const visible = defineModel<boolean>('visible', { default: false })

const { isExporting, error, exportDocuments } = useExportDocuments()

const exportFormat = ref<'json' | 'csv'>('json')
const customFilename = ref('')

const exportFormatOptions = [
    { label: 'JSON', value: 'json', icon: FileJson },
    { label: 'CSV', value: 'csv', icon: FileSpreadsheet },
]

async function handleExport() {
    const filename = customFilename.value.trim() || undefined
    await exportDocuments(props.indexUid, exportFormat.value, filename)
    if (!error.value) {
        visible.value = false
    }
}

function reset() {
    exportFormat.value = 'json'
    customFilename.value = ''
}

watch(visible, (isVisible) => {
    if (!isVisible) {
        reset()
    }
})
</script>

<template>
    <Dialog
        v-model:visible="visible"
        class="w-full sm:w-[30rem]"
        position="center"
        header="Export Documents"
        :draggable="false"
        dismissable-mask
        modal
    >
        <div class="flex flex-col gap-6">
            <Message
                v-if="error"
                severity="error"
                :closable="false"
            >
                <template #icon>
                    <AlertCircle />
                </template>
                <span class="font-bold">Export error:</span> {{ error }}
            </Message>

            <div class="flex flex-col gap-2">
                <label>Format</label>
                <SelectButton
                    v-model="exportFormat"
                    :options="exportFormatOptions"
                    optionLabel="label"
                    optionValue="value"
                >
                    <template #option="slotProps">
                        <div class="flex items-center gap-2">
                            <component
                                :is="slotProps.option.icon"
                                class="size-4!"
                            />
                            <span>{{ slotProps.option.label }}</span>
                        </div>
                    </template>
                </SelectButton>
            </div>

            <div class="flex flex-col gap-2">
                <label for="export-filename">Filename (optional)</label>
                <InputText
                    id="export-filename"
                    v-model="customFilename"
                    placeholder="my-export"
                    fluid
                />
                <small class="text-muted-color">
                    The file extension (<code>.json</code> or <code>.csv</code>) will be appended automatically.
                </small>
            </div>

        </div>

        <template #footer>
            <Button
                label="Export"
                :loading="isExporting"
                :disabled="isExporting"
                @click="handleExport"
            >
                <template #icon>
                    <Download />
                </template>
            </Button>
        </template>
    </Dialog>
</template>
