<script setup lang="ts">
import { Sun, Moon, Monitor } from '@lucide/vue'

const props = withDefaults(defineProps<{
    showLabel?: boolean,
}>(), {
    showLabel: true,
})

const { colorMode } = useAppColorMode()
const selectedColorMode = ref(colorMode.value)

const options = [
    { label: 'Light', value: 'light', icon: Sun },
    { label: 'Dark', value: 'dark', icon: Moon },
    { label: 'System', value: 'auto', icon: Monitor },
]

watchEffect(() => colorMode.value = selectedColorMode.value)
</script>

<template>
    <SelectButton
        v-model="selectedColorMode"
        :options="options"
        :allowEmpty="false"
        optionLabel="label"
        optionValue="value"
    >
        <template #option="{ option }">
            <component :is="option.icon" /> <span v-if="props.showLabel">{{ option.label }}</span>
        </template>
    </SelectButton>
</template>
