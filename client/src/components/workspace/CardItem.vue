<script setup lang="ts">
import { ref, computed } from 'vue';
import { useWorkspaceStore } from '@/stores/workspace';
import type { Card } from '@/graphql/types';
import { extractYouTubeId, getYouTubeThumbnail } from '@/lib/utils';
import { toast } from 'vue-sonner';

const props = defineProps<{
  card: Card;
}>();

const workspaceStore = useWorkspaceStore();

const isEditing = ref(false);
const editTitle = ref('');
const expandedNote = ref(false);

const youtubeId = computed(() => {
  if (props.card.cardType === 'VIDEO' && props.card.videoUrl) {
    return extractYouTubeId(props.card.videoUrl);
  }
  return null;
});

const thumbnail = computed(() => {
  if (youtubeId.value) {
    return getYouTubeThumbnail(youtubeId.value);
  }
  return props.card.videoPreview;
});

const completedChecklist = computed(() => {
  if (!props.card.checklistItems) return { done: 0, total: 0 };
  const total = props.card.checklistItems.length;
  const done = props.card.checklistItems.filter((i) => i.checked).length;
  return { done, total };
});

function startEdit() {
  editTitle.value = props.card.title;
  isEditing.value = true;
}

async function saveEdit() {
  if (editTitle.value.trim() === props.card.title) {
    isEditing.value = false;
    return;
  }

  try {
    await workspaceStore.updateCard(props.card.id, { title: editTitle.value.trim() });
    isEditing.value = false;
  } catch {
    toast.error('Ошибка сохранения');
  }
}

async function toggleChecked() {
  try {
    await workspaceStore.toggleCardChecked(props.card.id);
  } catch {
    toast.error('Ошибка обновления');
  }
}

async function toggleChecklistItem(index: number) {
  if (!props.card.checklistItems) return;

  const items = [...props.card.checklistItems];
  items[index] = { ...items[index], checked: !items[index].checked };

  try {
    await workspaceStore.updateCard(props.card.id, { checklistItems: items });
  } catch {
    toast.error('Ошибка обновления');
  }
}

async function deleteCard() {
  if (!confirm('Удалить карточку?')) return;

  try {
    await workspaceStore.deleteCard(props.card.id);
  } catch {
    toast.error('Ошибка удаления');
  }
}

function openVideo() {
  if (props.card.videoUrl) {
    window.open(props.card.videoUrl, '_blank');
  }
}
</script>

<template>
  <div
    class="bg-bg rounded-lg border border-border shadow-sm hover:shadow transition-shadow group"
    :class="{ 'opacity-60': card.checked }"
  >
    <!-- Video Thumbnail -->
    <div
      v-if="card.cardType === 'VIDEO' && thumbnail"
      class="relative aspect-video bg-muted rounded-t-lg overflow-hidden cursor-pointer"
      @click="openVideo"
    >
      <img :src="thumbnail" :alt="card.title" class="w-full h-full object-cover" />
      <div
        class="absolute inset-0 flex-center bg-overlay opacity-0 hover:opacity-100 transition-opacity"
      >
        <span class="i-lucide-play-circle text-4xl text-on-primary" />
      </div>
    </div>

    <div class="p-3">
      <!-- Header -->
      <div class="flex items-start gap-2">
        <!-- Checkbox -->
        <button @click="toggleChecked" class="mt-0.5 flex-shrink-0">
          <span v-if="card.checked" class="w-4 h-4 flex-center rounded bg-success text-on-primary">
            <span class="i-lucide-check text-xs" />
          </span>
          <span
            v-else
            class="w-4 h-4 rounded border border-border hover:border-success transition-colors"
          />
        </button>

        <!-- Title -->
        <div class="flex-1 min-w-0">
          <div v-if="isEditing">
            <input
              v-model="editTitle"
              @keyup.enter="saveEdit"
              @keyup.escape="isEditing = false"
              @blur="saveEdit"
              class="input text-sm py-0.5"
              autofocus
            />
          </div>
          <p
            v-else
            @dblclick="startEdit"
            class="text-sm font-medium text-fg cursor-text"
            :class="{ 'line-through': card.checked }"
          >
            {{ card.title }}
          </p>
        </div>

        <!-- Delete -->
        <button
          @click="deleteCard"
          class="btn-icon p-1 opacity-0 group-hover:opacity-100 text-fg-muted hover:text-danger"
        >
          <span class="i-lucide-trash-2 text-xs" />
        </button>
      </div>

      <!-- Note Content -->
      <div v-if="card.cardType === 'NOTE' && card.noteContent" class="mt-2">
        <p class="text-xs text-fg-muted" :class="expandedNote ? '' : 'line-clamp-3'">
          {{ card.noteContent }}
        </p>
        <button
          v-if="card.noteContent.length > 100"
          @click="expandedNote = !expandedNote"
          class="text-xs text-primary mt-1"
        >
          {{ expandedNote ? 'Свернуть' : 'Развернуть' }}
        </button>
      </div>

      <!-- Checklist Items -->
      <div v-if="card.cardType === 'CHECKLIST' && card.checklistItems" class="mt-2 space-y-1">
        <div
          v-for="(item, index) in card.checklistItems.slice(0, expandedNote ? undefined : 3)"
          :key="item.id"
          class="flex items-center gap-2"
        >
          <button @click="toggleChecklistItem(index)" class="flex-shrink-0">
            <span
              v-if="item.checked"
              class="w-3.5 h-3.5 flex-center rounded bg-success text-on-primary"
            >
              <span class="i-lucide-check text-[10px]" />
            </span>
            <span v-else class="w-3.5 h-3.5 rounded border border-border" />
          </button>
          <span
            class="text-xs text-fg-muted"
            :class="{ 'line-through text-fg-muted opacity-70': item.checked }"
          >
            {{ item.text }}
          </span>
        </div>

        <button
          v-if="card.checklistItems.length > 3"
          @click="expandedNote = !expandedNote"
          class="text-xs text-primary"
        >
          {{ expandedNote ? 'Свернуть' : `Ещё ${card.checklistItems.length - 3}` }}
        </button>

        <!-- Progress -->
        <div class="flex items-center gap-2 mt-2">
          <div class="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              class="h-full bg-success transition-all"
              :style="{ width: `${(completedChecklist.done / completedChecklist.total) * 100}%` }"
            />
          </div>
          <span class="text-[10px] text-fg-muted">
            {{ completedChecklist.done }}/{{ completedChecklist.total }}
          </span>
        </div>
      </div>

      <!-- Type Badge -->
      <div class="flex items-center gap-2 mt-2">
        <span
          v-if="card.cardType === 'VIDEO'"
          class="inline-flex items-center gap-1 text-[10px] text-primary bg-muted px-1.5 py-0.5 rounded"
        >
          <span class="i-lucide-video text-xs" />
          Видео
        </span>
        <span
          v-else-if="card.cardType === 'NOTE'"
          class="inline-flex items-center gap-1 text-[10px] text-primary bg-muted px-1.5 py-0.5 rounded"
        >
          <span class="i-lucide-file-text text-xs" />
          Заметка
        </span>
        <span
          v-else-if="card.cardType === 'CHECKLIST'"
          class="inline-flex items-center gap-1 text-[10px] text-success bg-success/10 px-1.5 py-0.5 rounded"
        >
          <span class="i-lucide-check-square text-xs" />
          Чеклист
        </span>
      </div>
    </div>
  </div>
</template>
