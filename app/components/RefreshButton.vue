<script setup lang="ts">
import { RefreshCw } from '@lucide/vue'
</script>

<template>
    <Button
        label="Refresh"
        severity="secondary"
        variant="outlined"
        v-bind="$attrs"
    >
        <template #icon>
            <RefreshCw />
        </template>
        <template #loadingicon>
            <RefreshCw class="animate-spin" />
        </template>
    </Button>
</template>
