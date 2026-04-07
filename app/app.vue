<script setup lang="ts">
import { AlertCircle } from '@lucide/vue'
import { useColorMode } from '@vueuse/core'
import 'vue3-json-viewer/dist/vue3-json-viewer.css'
import 'vanilla-jsoneditor/themes/jse-theme-dark.css'

const route = useRoute()

useHead(() => ({
    title: route.meta.title as string | undefined,
    titleTemplate: (titleChunk) => titleChunk ? `${titleChunk} - Meilisearch Manager` : 'Meilisearch Manager',
}))

const colorMode = useColorMode({ emitAuto: true })
provide('colorMode', colorMode)
</script>

<template>
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
    <NuxtLoadingIndicator color="var(--p-primary-500)" />
    <NuxtLayout>
        <!-- include tailwind css classes defined in nuxt.config.ts for body tag -->
        <!-- antialiased font-sans h-full bg-surface-100 dark:bg-surface-950 -->
        <NuxtRouteAnnouncer />
        <NuxtPage />
    </NuxtLayout>
</template>
