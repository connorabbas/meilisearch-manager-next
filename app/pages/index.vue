<script setup lang="ts">
import { useMeilisearchStore } from '@/stores/meilisearch'

const meilisearchStore = useMeilisearchStore()

await navigateTo(meilisearchStore.hasConfiguredInstance ? '/dashboard' : '/new-instance', { replace: true })
</script>
