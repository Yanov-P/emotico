<script setup>
import { ref, onMounted } from 'vue'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_KEY
)

const emotionGroups = ref([])
const entries = ref([])
const selectedEmotions = ref([])
const comment = ref('')
const loading = ref(true)

const emotionOptions = ref([])

// Загрузка данных
onMounted(async () => {
    await loadEmotionGroups()
    // await loadEntries()

    emotionOptions.value = emotionGroups.value.flatMap(group =>
        group.emotions.map(e => ({
            name: e.name,
            group: group.name,
            emoji: group.emoji,
            color: group.color,
            value: e.id
        }))
    )
})

async function loadEmotionGroups() {
    const { data } = await supabase
        .from('emotion_groups')
        .select(`
      id,
      name,
      color,
      emoji,
      emotions (id, name)
    `)

    emotionGroups.value = data.map(group => ({
        ...group,
        emotions: group.emotions.map(e => ({
            ...e,
            label: `${group.emoji} ${e.name}`,
            groupColor: group.color
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
      entry_emotions (emotions(id, name, emotion_groups(color, emoji)))
    `)
        .order('created_at', { ascending: false })

    entries.value = data
    loading.value = false
}

async function addEntry() {
    const user = supabase.auth.user()

    // Создание записи
    const { data: entry, error } = await supabase
        .from('diary_entries')
        .insert([{
            comment: comment.value,
            user_id: user.id
        }])
        .single()

    if (error) return console.error(error)

    // Связи с эмоциями
    const emotionsData = selectedEmotions.value.map(e => ({
        entry_id: entry.id,
        emotion_id: e.id
    }))

    await supabase.from('entry_emotions').insert(emotionsData)

    // Сброс формы
    comment.value = ''
    selectedEmotions.value = []
    await loadEntries()
}
</script>

<template>
    <main class="container">
        <!-- Форма добавления -->
        <div class="entry-form">
            <h2>Новая запись</h2>

            <MultiSelect v-model="selectedEmotions" :options="emotionOptions" optionLabel="name" :pt="{
                root: { class: 'w-full' },
                labelContainer: { class: 'flex flex-wrap gap-2' }
            }">
                <template #option="{ option }">
                    <span class="emotion-tag" :style="{ backgroundColor: option.color }">
                        {{ option.emoji }} {{ option.name }}
                    </span>
                </template>

                <template #value="{ value }">
                    <span v-for="item in value" :key="item.value" class="emotion-tag"
                        :style="{ backgroundColor: item.color }">
                        {{ item.emoji }} {{ item.name }}
                    </span>
                </template>
            </MultiSelect>

            <textarea v-model="comment" placeholder="Ваш комментарий..."></textarea>

            <button @click="addEntry">Добавить</button>
        </div>

        <!-- Список записей -->
        <div v-if="loading">Загрузка...</div>
        <div v-else class="entries">
            <div v-for="entry in entries" :key="entry.id" class="entry-card">
                <div class="entry-header">
                    <time>{{ new Date(entry.created_at).toLocaleTimeString() }}</time>
                    <div class="emotion-tags">
                        <span v-for="e in entry.entry_emotions" :key="e.emotions.id" class="tag"
                            :style="{ backgroundColor: e.emotions.emotion_groups.color }">
                            {{ e.emotions.emotion_groups.emoji }} {{ e.emotions.name }}
                        </span>
                    </div>
                </div>
                <p v-if="entry.comment" class="comment">
                    {{ entry.comment }}
                </p>
            </div>
        </div>
    </main>
</template>

<style>
@import 'primevue/resources/themes/lara-light-blue/theme.css';
@import 'primeicons/primeicons.css';

.emotion-tag {
    @apply inline-flex items-center px-3 py-1 rounded-full text-white text-sm mr-2 mb-2;
    text-shadow: 0 1px 1px rgba(0, 0, 0, 0.2);
}

.p-multiselect {
    @apply w-full mb-4;
}

.container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
}

.entry-form {
    background: #f8f9fa;
    padding: 1.5rem;
    border-radius: 12px;
    margin-bottom: 2rem;
}

.vue-select .emotion-option {
    padding: 4px 8px;
    border-radius: 20px;
    margin: 2px;
    color: white;
    text-shadow: 0 1px 1px rgba(0, 0, 0, 0.2);
}

.entry-card {
    background: white;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.emotion-tags .tag {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 20px;
    margin: 4px;
    font-size: 0.9em;
    color: white;
}
</style>