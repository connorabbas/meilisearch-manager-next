import type { RecordAny, ResourceResults } from 'meilisearch'
import Papa from 'papaparse'
import { useToast } from 'primevue/usetoast'
import { useMeilisearchStore } from '@/stores/meilisearch'
import { downloadFile } from '@/utils'

const BATCH_SIZE = 1000

export function useExportDocuments() {
    const toast = useToast()
    const meilisearchStore = useMeilisearchStore()

    const isExporting = ref(false)
    const error = ref<string | null>(null)

    async function fetchAllDocuments(indexUid: string): Promise<RecordAny[]> {
        const client = meilisearchStore.getClient()
        if (!client) {
            throw new Error('Meilisearch client not connected')
        }

        const allDocuments: RecordAny[] = []
        let offset = 0
        let total: number | undefined

        while (true) {
            const response: ResourceResults<RecordAny[]> = await client
                .index(indexUid)
                .getDocuments({ limit: BATCH_SIZE, offset })

            total = response.total
            allDocuments.push(...response.results)

            if (response.results.length < BATCH_SIZE || allDocuments.length >= total) {
                break
            }
            offset += BATCH_SIZE
        }

        return allDocuments
    }

    async function exportDocuments(
        indexUid: string,
        format: 'json' | 'csv',
        filename?: string
    ) {
        const client = meilisearchStore.getClient()
        if (!client) {
            error.value = 'Meilisearch client not connected'
            return
        }

        isExporting.value = true
        error.value = null

        try {
            const documents = await fetchAllDocuments(indexUid)

            const safeFilename = filename || `${indexUid}-documents`

            if (format === 'json') {
                let jsonString = JSON.stringify(documents, null, 2)
                // Escape literal line/paragraph separators so editors don't flag "unusual line terminators"
                jsonString = jsonString.replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')
                const blob = new Blob([jsonString], { type: 'application/json' })
                downloadFile(blob, `${safeFilename}.json`)
            } else {
                const csvString = Papa.unparse(documents)
                // Strip literal line/paragraph separators so editors don't flag "unusual line terminators"
                const sanitizedCsv = csvString.replace(/\u2028/g, '').replace(/\u2029/g, '')
                const blob = new Blob([sanitizedCsv], { type: 'text/csv;charset=utf-8;' })
                downloadFile(blob, `${safeFilename}.csv`)
            }

            toast.add({
                severity: 'success',
                summary: 'Export Complete',
                detail: `${documents.length} document${documents.length === 1 ? '' : 's'} exported as ${format.toUpperCase()}`,
                life: 5000,
            })
        } catch (err) {
            error.value = (err as Error).message
            toast.add({
                severity: 'error',
                summary: 'Export Failed',
                detail: error.value,
                life: 7500,
            })
        } finally {
            isExporting.value = false
        }
    }

    return {
        isExporting,
        error,
        exportDocuments,
    }
}
