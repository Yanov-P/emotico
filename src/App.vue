<script setup>
import { ref, onMounted } from 'vue'
import { createClient } from '@supabase/supabase-js'
import MultiSelect from 'primevue/multiselect'
import 'primevue/resources/themes/lara-light-blue/theme.css'
import 'primevue/resources/primevue.min.css'
import 'primeicons/primeicons.css'

// Инициализация Supabase
const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_KEY
)

// Состояния приложения
const entries = ref([])
const emotionGroups = ref([])
const selectedEmotions = ref([])
const comment = ref('')
const loading = ref(true)

// Загрузка данных при монтировании
onMounted(async () => {
    await loadEmotionGroups()
    await loadEntries()
})

// Загрузка групп эмоций
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

// Загрузка записей дневника
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

// Добавление новой записи
async function addEntry() {
    if (!selectedEmotions.value.length) return

    try {
        // Создаем запись
        const { data: entry, error } = await supabase
            .from('diary_entries')
            .insert([{
                comment: comment.value,
                user_id: (await supabase.auth.getUser()).data.user?.id
            }])
            .single()

        if (error) throw error

        // Связываем эмоции
        const emotionsData = selectedEmotions.value.map(e => ({
            entry_id: e.id,
            emotion_id: e.id
        }))

        await supabase.from('entry_emotions').insert(emotionsData)

        // Сброс и обновление
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

            <MultiSelect v-model="selectedEmotions" :options="emotionGroups.flatMap(g => g.emotions)" optionLabel="name"
                :pt="{
                    root: { class: 'w-full mb-4' },
                    labelContainer: { class: 'flex flex-wrap gap-2' }
                }" placeholder="Выберите эмоции...">
                <template #option="{ option }">
                    <span class="emotion-option" :style="{ backgroundColor: option.groupColor }">
                        {{ option.groupEmoji }} {{ option.name }}
                    </span>
                </template>

                <template #value="{ value }">
                    <span v-for="item in value" :key="item.id" class="emotion-tag"
                        :style="{ backgroundColor: item.groupColor }">
                        {{ item.groupEmoji }} {{ item.name }}
                    </span>
                </template>
            </MultiSelect>

            <textarea v-model="comment" placeholder="Ваш комментарий..." class="comment-input"></textarea>

            <button @click="addEntry" class="add-button">
                ➕ Добавить запись
            </button>
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

/* Заголовок формы */
.entry-form h2 {
    color: var(--color-heading);
    font-size: 1.8rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid var(--vt-c-indigo);
}

/* Форма */
.entry-form {
    background: var(--color-background-soft);
    padding: 2rem;
    border-radius: 8px;
    margin-bottom: 2rem;
    box-shadow: 0 2px 8px var(--color-border);
}

/* Поле комментария */
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

/* Карточки записей */
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

/* Время записи */
.time {
    color: var(--color-text-dark-2);
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
    display: block;
}

/* Эмоции */
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

/* Комментарий */
.entry-card .comment {
    color: var(--color-text);
    font-size: 1rem;
    line-height: 1.6;
    margin-top: 1rem;
    padding: 1rem;
    background: var(--color-background-mute);
    border-radius: 6px;
    white-space: pre-wrap;
}

/* Кнопка */
.add-button {
    background: var(--vt-c-indigo);
    color: var(--vt-c-white);
    border: none;
    padding: 0.8rem 1.5rem;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition:
        background 0.3s ease,
        transform 0.2s ease;
}

.add-button:hover {
    background: #34495e;
    transform: translateY(-1px);
}

/* Адаптация PrimeVue под тему */
:deep(.p-multiselect) {
    background: var(--color-background-mute);
    border-color: var(--color-border);
    color: var(--color-text);
}

:deep(.p-multiselect .p-multiselect-label) {
    color: var(--color-text);
}

:deep(.p-multiselect-panel) {
    background: var(--color-background-soft);
    border-color: var(--color-border);
}

:deep(.p-multiselect-item) {
    color: var(--color-text);
}

:deep(.p-multiselect-item:hover) {
    background: var(--color-background-mute);
}
</style>