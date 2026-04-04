<script setup lang="ts">
import { AlertCircle } from '@lucide/vue'
import { useColorMode } from '@vueuse/core'

const colorMode = useColorMode({ emitAuto: true })
provide('colorMode', colorMode)
</script>

<template>
    <div>
        <NuxtLayout>
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
    </div>
</template>
