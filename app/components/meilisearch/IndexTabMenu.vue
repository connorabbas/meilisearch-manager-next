<script setup lang="ts">
import { FileText, Info, Pencil, Settings } from '@lucide/vue'

const props = defineProps<{
    currentPath: string,
    indexUid: string,
}>()

const items = computed(() => [
    { to: `/indexes/${props.indexUid}`, value: 'details', label: 'Info', icon: Info },
    { to: `/indexes/${props.indexUid}/documents`, value: 'documents', label: 'Documents', icon: FileText },
    { to: `/indexes/${props.indexUid}/settings`, value: 'settings', label: 'Settings', icon: Settings },
    { to: `/indexes/${props.indexUid}/edit`, value: 'edit', label: 'Edit', icon: Pencil },
])

const currentTab = computed(() => {
    if (props.currentPath.endsWith('/documents')) return 'documents'
    if (props.currentPath.endsWith('/settings')) return 'settings'
    if (props.currentPath.endsWith('/edit')) return 'edit'

    return 'details'
})
</script>

<template>
    <Tabs :value="currentTab">
        <TabList class="[background:transparent]!">
            <NuxtLink
                v-for="tab in items"
                v-slot="{ href, navigate }"
                :key="tab.value"
                :to="tab.to"
                custom
            >
                <a
                    :href="href"
                    class="text-inherit no-underline"
                    @click="navigate"
                >
                    <Tab
                        :value="tab.value"
                        class="flex items-center gap-2"
                    >
                        <component
                            :is="tab.icon"
                            v-if="tab.icon"
                        />
                        <span>{{ tab.label }}</span>
                    </Tab>
                </a>
            </NuxtLink>
        </TabList>
    </Tabs>
</template>
