<script setup>
defineProps({
    label: String
})

defineEmits(['click'])
</script>

<template>
    <button class="custom-button" @click="$emit('click')">
        <slot>{{ label }}</slot>
    </button>
</template>

<style scoped>
.custom-button {
    padding: 0.8rem 1.5rem;
    border-radius: 6px;
    border: 1px solid var(--color-border);
    background: var(--vt-c-indigo);
    color: var(--vt-c-white);
    font-weight: 500;
    cursor: pointer;
    transition:
        background 0.2s ease,
        transform 0.1s ease;
}

.custom-button:hover {
    background: #34495e;
    transform: translateY(-1px);
}

.custom-button.p-button-text {
    background: transparent;
    border-color: transparent;
    color: var(--color-text);
}

.custom-button.p-button-text:hover {
    background: var(--color-background-mute);
}
</style>