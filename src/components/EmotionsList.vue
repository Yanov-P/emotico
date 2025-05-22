<template>
    <div class="emotions">
        <span v-for="e in emotions" :key="e.id" class="emotion-badge">
            <div class="emotion-badge__icon" :style="{
                backgroundColor: e.color
            }"></div>
            {{ e.name }}
        </span>
    </div>
</template>

<script setup lang="ts">
import type { Emotion } from '@/entites';

defineProps<{
    emotions: Emotion[]
}>();
</script>

<style>
.emotion-badge {
    padding: 0.4rem 1rem;
    border-radius: 20px;
    font-size: 0.9rem;
    margin-right: 0.5rem;
    margin-bottom: 0.5rem;
    /* background: var(--vt-c-indigo); */
    /* color: var(--vt-c-white); */
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
}

.emotion-badge__icon {
    width: 10px;
    height: 10px;
    border-radius: 50%;
}
</style>