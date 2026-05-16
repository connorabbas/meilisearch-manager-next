<script setup lang="ts">
import { useDynamicSearchRules } from '@/composables/meilisearch/useDynamicSearchRules'
import { useExperimentalFeatures } from '@/composables/meilisearch/useExperimentalFeatures'
import { useStats } from '@/composables/meilisearch/useStats'
import SearchRuleForm from '@/components/meilisearch/SearchRuleForm.vue'
import PageTitleSection from '@/components/PageTitleSection.vue'
import { isVersionAtLeast } from '@/utils'
import { Home } from '@lucide/vue'
import type { SearchRuleUpdatePayload } from 'meilisearch'

definePageMeta({
    layout: 'app',
    title: 'Search Rules',
    breadcrumbs: [
        { route: { name: 'dashboard' }, lucideIcon: Home },
        { route: '/search-rules', label: 'Search Rules' },
        { label: 'Create' }
    ]
})

const {
    createOrUpdate,
    isLoading,
} = useDynamicSearchRules()

const {
    features,
    fetchExperimentalFeatures,
} = useExperimentalFeatures()

const {
    version,
    fetchVersion,
} = useStats()

await Promise.all([
    fetchExperimentalFeatures(),
    fetchVersion(),
])

const isSupportedVersion = computed(() => {
    return version.value ? isVersionAtLeast(version.value.pkgVersion, '1.41.0') : false
})

const isFeatureEnabled = computed(() => {
    return features.value?.dynamicSearchRules === true
})

const isFeatureAvailable = computed(() => isSupportedVersion.value && isFeatureEnabled.value)

const formState = reactive({
    uid: '',
    description: '',
    priority: null as number | null,
    active: true,
    conditions: [] as any[],
    actions: [] as any[],
})

async function handleSave() {
    const payload: SearchRuleUpdatePayload = {
        description: formState.description || null,
        priority: formState.priority,
        active: formState.active,
        conditions: formState.conditions.length > 0 ? formState.conditions : null,
        actions: formState.actions.length > 0 ? formState.actions : null,
    }

    try {
        await createOrUpdate(formState.uid, payload)
        await navigateTo('/search-rules')
    } catch {
        // error handled by composable
    }
}

function handleCancel() {
    navigateTo('/search-rules')
}
</script>

<template>
    <div class="flex flex-col gap-4 md:gap-8">
        <PageTitleSection>
            <template #title>
                Create Search Rule
            </template>
        </PageTitleSection>

        <SearchRulesFeatureUnavailableCard
            v-if="!isFeatureAvailable"
            :is-supported-version="isSupportedVersion"
            :version="version?.pkgVersion ?? null"
            :is-feature-enabled="isFeatureEnabled"
            feature-name="Dynamic Search Rules"
        />

        <SearchRuleForm
            v-else
            v-model="formState"
            v-model:is-loading="isLoading"
            is-create
            @save="handleSave"
            @cancel="handleCancel"
        />
    </div>
</template>
