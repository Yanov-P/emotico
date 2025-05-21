<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { createClient } from '@supabase/supabase-js'
import Dialog from '@/components/Dialog.vue'
import Button from '@/components/Button.vue'

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_KEY
)

// Состояния приложения
const entries = ref([])
const emotionGroups = ref([])
const selectedEmotions = ref([])
const selectedEmotionsTemp = ref([])
const comment = ref('')
const loading = ref(true)
const showEmotionModal = ref(false)

// Загрузка данных
onMounted(async () => {
    await loadEmotionGroups()
    await loadEntries()
})

async function loadEmotionGroups() {
    const { data } = await supabase
        .from('emotion_groups')
        .select(`
      id,
      name,
      color,
      emoji,
      emotions!inner (
        id,
        name
      )
    `)

    emotionGroups.value = data.map(group => ({
        ...group,
        emotions: group.emotions.map(e => ({
            ...e,
            groupColor: group.color,
            groupEmoji: group.emoji
        }))
    }))
}

async function loadEntries() {
    const { data } = await supabase
        .from('diary_entries')
        .select(`
      id,
      comment,
      created_at,
      entry_emotions (
        emotions (
          id,
          name,
          emotion_groups (
            color,
            emoji
          )
        )
      )
    `)
        .order('created_at', { ascending: false })

    entries.value = data || []
    loading.value = false
}

// Логика выбора эмоций
const toggleEmotion = (emotion) => {
    const index = selectedEmotionsTemp.value.findIndex(e => e.id === emotion.id)
    if (index > -1) {
        selectedEmotionsTemp.value.splice(index, 1)
    } else {
        selectedEmotionsTemp.value.push(emotion)
    }
}

const isEmotionSelected = (emotion) => {
    return selectedEmotionsTemp.value.some(e => e.id === emotion.id)
}

watch(showEmotionModal, (val) => {
    if (val) {
        selectedEmotionsTemp.value = [...selectedEmotions.value]
    }
})

const applySelection = () => {
    selectedEmotions.value = [...selectedEmotionsTemp.value]
    showEmotionModal.value = false
}

// Добавление записи
async function addEntry() {
    if (!selectedEmotions.value.length) return

    try {
        const { data: entry, error } = await supabase
            .from('diary_entries')
            .insert([{
                comment: comment.value,
                user_id: (await supabase.auth.getUser()).data.user?.id
            }])
            .single()

        if (error) throw error

        const emotionsData = selectedEmotions.value.map(e => ({
            entry_id: entry.id,
            emotion_id: e.id
        }))

        await supabase.from('entry_emotions').insert(emotionsData)

        comment.value = ''
        selectedEmotions.value = []
        await loadEntries()

    } catch (error) {
        console.error('Error adding entry:', error)
    }
}
</script>

<template>
    <div class="container">
        <!-- Форма добавления -->
        <div class="entry-form">
            <h2>📝 Новая запись</h2>

            <Button @click="showEmotionModal = true" class="select-emotions-btn">
                <span v-if="selectedEmotions.length === 0">Выбрать эмоции</span>
                <span v-else>
                    Выбрано эмоций: {{ selectedEmotions.length }}
                </span>
            </Button>

            <textarea v-model="comment" placeholder="Ваш комментарий..." class="comment-input"></textarea>

            <Button label="Добавить запись" @click="addEntry" class="add-button" />

            <!-- Модальное окно выбора эмоций -->
            <Dialog v-model:visible="showEmotionModal" modal header="Выберите эмоции">
                <div v-for="group in emotionGroups" :key="group.id" class="emotion-group">
                    <div class="group-header">
                        <span class="group-emoji" :style="{ backgroundColor: group.color }">
                            {{ group.emoji }}
                        </span>
                        <h3>{{ group.name }}</h3>
                    </div>

                    <div class="emotion-list">
                        <div v-for="emotion in group.emotions" :key="emotion.id" class="emotion-item"
                            @click="toggleEmotion(emotion)" :class="{ selected: isEmotionSelected(emotion) }">
                            <input type="checkbox" :checked="isEmotionSelected(emotion)" class="checkbox">
                            <span>{{ emotion.name }}</span>
                        </div>
                    </div>
                </div>

                <template #footer>
                    <Button label="Отмена" @click="showEmotionModal = false" class="p-button-text" />
                    <Button label="Применить" @click="applySelection" />
                </template>
            </Dialog>
        </div>

        <!-- Список записей -->
        <div v-if="loading" class="loading">Загрузка...</div>
        <div v-else class="entries">
            <div v-for="entry in entries" :key="entry.id" class="entry-card">
                <div class="entry-header">
                    <span class="time">
                        {{ new Date(entry.created_at).toLocaleTimeString() }}
                    </span>
                    <div class="emotions">
                        <span v-for="e in entry.entry_emotions" :key="e.emotions.id" class="emotion-badge" :style="{
                            backgroundColor: e.emotions.emotion_groups.color
                        }">
                            {{ e.emotions.emotion_groups.emoji }}
                            {{ e.emotions.name }}
                        </span>
                    </div>
                </div>
                <p v-if="entry.comment" class="comment">
                    {{ entry.comment }}
                </p>
            </div>
        </div>
    </div>
</template>

<style scoped>
.container {
    max-width: 800px;
    margin: 0 auto;
    padding: 1rem;
    min-height: 100vh;
}

.entry-form {
    background: var(--color-background-soft);
    padding: 2rem;
    border-radius: 8px;
    margin-bottom: 2rem;
    box-shadow: 0 2px 8px var(--color-border);
}

.entry-form h2 {
    color: var(--color-heading);
    font-size: 1.8rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid var(--vt-c-indigo);
}

.select-emotions-btn {
    width: 100%;
    margin-bottom: 1rem;
    background: var(--color-background-mute) !important;
    border: 1px solid var(--color-border) !important;
    color: var(--color-text) !important;
}

.comment-input {
    width: 100%;
    height: 100px;
    padding: 1rem;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    margin: 1rem 0;
    background: var(--color-background-mute);
    color: var(--color-text);
    font-family: inherit;
    transition: border-color 0.3s ease;
}

.comment-input:focus {
    outline: none;
    border-color: var(--vt-c-indigo);
    box-shadow: 0 0 0 2px rgba(44, 62, 80, 0.1);
}

.add-button {
    width: 100%;
    background: var(--vt-c-indigo) !important;
    border: none !important;
}

.entry-card {
    background: var(--color-background-soft);
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    border: 1px solid var(--color-border);
    transition: transform 0.2s ease;
}

.entry-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 12px var(--color-border-hover);
}

.time {
    color: var(--color-text-dark-2);
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
    display: block;
}

.emotion-badge {
    padding: 0.4rem 1rem;
    border-radius: 20px;
    font-size: 0.9rem;
    margin-right: 0.5rem;
    margin-bottom: 0.5rem;
    background: var(--vt-c-indigo);
    color: var(--vt-c-white);
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
}

.comment {
    color: var(--color-text);
    font-size: 1rem;
    line-height: 1.6;
    margin-top: 1rem;
    padding: 1rem;
    background: var(--color-background-mute);
    border-radius: 6px;
    white-space: pre-wrap;
}

.emotion-group {
    margin-bottom: 2rem;
    padding: 1rem;
    background: var(--color-background-soft);
    border-radius: 8px;
}

.group-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
}

.group-emoji {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    font-size: 1.2rem;
}

.emotion-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 0.5rem;
}

.emotion-item {
    display: flex;
    align-items: center;
    padding: 0.8rem;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.emotion-item:hover {
    background: var(--color-background-mute);
    transform: translateY(-2px);
}

.emotion-item.selected {
    border-color: var(--vt-c-indigo);
    background: rgba(44, 62, 80, 0.1);
}

.checkbox {
    margin-right: 0.8rem;
    accent-color: var(--vt-c-indigo);
}

@media (max-width: 600px) {
    .emotion-list {
        grid-template-columns: 1fr;
    }

    .emotion-item {
        padding: 0.6rem;
    }

    .entry-form {
        padding: 1rem;
    }
}

:deep(.p-dialog-header) {
    background: var(--color-background-soft) !important;
    border-bottom: 1px solid var(--color-border) !important;
}

:deep(.p-dialog-content) {
    background: var(--color-background-soft) !important;
}

:deep(.p-button) {
    transition: all 0.2s ease !important;
}
</style>