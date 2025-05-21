<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
    visible: Boolean,
    header: String
})

const emit = defineEmits(['update:visible'])

const isOpen = ref(props.visible)

watch(() => props.visible, (val) => {
    isOpen.value = val
})

watch(isOpen, (val) => {
    emit('update:visible', val)
})

function close() {
    isOpen.value = false
}
</script>

<template>
    <div v-if="isOpen" class="dialog-overlay" @click.self="close">
        <div class="dialog">
            <div class="dialog-header">
                <h3>{{ header }}</h3>
                <button class="close-btn" @click="close">×</button>
            </div>

            <div class="dialog-content">
                <slot></slot>
            </div>

            <div class="dialog-footer">
                <slot name="footer"></slot>
            </div>
        </div>
    </div>
</template>

<style scoped>
.dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.dialog {
    background: var(--color-background-soft);
    border-radius: 8px;
    width: 90vw;
    max-width: 800px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.dialog-header {
    padding: 1.5rem;
    border-bottom: 1px solid var(--color-border);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.dialog-header h3 {
    color: var(--color-heading);
    font-size: 1.25rem;
}

.close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--color-text);
    padding: 0 0.5rem;
}

.dialog-content {
    padding: 1.5rem;
    overflow-y: auto;
    flex-grow: 1;
}

.dialog-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--color-border);
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
}
</style>