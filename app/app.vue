<script setup lang="ts">
import { AlertCircle } from '@lucide/vue'
import { useColorMode } from '@vueuse/core'

const route = useRoute()

useHead(() => ({
    title: route.meta.title as string | undefined,
    titleTemplate: (titleChunk) => titleChunk ? `${titleChunk} - Meilisearch Manager Pro` : 'Meilisearch Manager Pro',
}))

const colorMode = useColorMode({ emitAuto: true })
provide('colorMode', colorMode)
</script>

<template>
    <NuxtLayout>
        <!-- include tailwind css classes defined in nuxt.config.ts for body tag -->
        <!-- antialiased font-sans h-full bg-surface-100 dark:bg-surface-950 -->
        <NuxtRouteAnnouncer />
        <NuxtLoadingIndicator color="var(--p-primary-500)" />
        <AppToast />
        <ConfirmDialog
            group="delete"
            :draggable="false"
            blockScroll
        >
            <template #icon>
                <AlertCircle />
            </template>
        </ConfirmDialog>
        <NuxtPage />
    </NuxtLayout>
</template>
