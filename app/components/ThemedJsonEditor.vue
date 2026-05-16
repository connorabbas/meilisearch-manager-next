<script setup lang="ts">
import JsonEditorVue from 'json-editor-vue'

const { isDark } = useAppColorMode()
const jsonEditorDarkModeClass = computed(() => isDark.value ? 'jse-theme-dark' : '')
</script>

<template>
    <JsonEditorVue :class="jsonEditorDarkModeClass" />
</template>