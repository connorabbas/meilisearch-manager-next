<script setup lang="ts">
import IndexTabMenu from '@/components/meilisearch/IndexTabMenu.vue'
import PageTitleSection from '@/components/PageTitleSection.vue'

const route = useRoute()
const indexUid = computed(() => String(route.params.uid ?? ''))
</script>

<template>
    <div class="flex flex-col gap-4 md:gap-8">
        <PageTitleSection>
            <template #title>
                Index: {{ indexUid }}
            </template>
            <template #end>
                <div
                    id="index-page-actions"
                    class="empty:hidden flex gap-4"
                >
                    <!-- Child views will teleport action buttons here -->
                </div>
            </template>
        </PageTitleSection>

        <IndexTabMenu
            :index-uid="indexUid"
            :current-path="route.path"
        />

        <NuxtPage />
    </div>
</template>
