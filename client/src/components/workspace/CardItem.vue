<script setup lang="ts">
import { ref, computed } from 'vue';
import { useWorkspaceStore } from '@/stores/workspace';
import type { Card } from '@/graphql/types';
import AddCardDialog from './AddCardDialog.vue';
import { extractYouTubeId, getYouTubeThumbnail } from '@/lib/utils';
import { toast } from 'vue-sonner';

const props = defineProps<{
  card: Card;
  columnId: string;
}>();

const workspaceStore = useWorkspaceStore();
const showEditDialog = ref(false);
const expandedNote = ref(false);

function openEdit() {
  showEditDialog.value = true;
}

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
  if (!props.card.checklistItems || !Array.isArray(props.card.checklistItems)) {
    return { done: 0, total: 0 };
  }
  const total = props.card.checklistItems.length;
  const done = props.card.checklistItems.filter((i) => i.checked).length;
  return { done, total };
});

const progressPercent = computed(() => {
  const { done, total } = completedChecklist.value;
  return total > 0 ? Math.round((done / total) * 100) : 0;
});

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
    class="bg-bg rounded-lg border border-border shadow-sm hover:shadow transition-shadow group cursor-grab active:cursor-grabbing"
    :class="{ 'opacity-60': card.checked }"
    :data-card-id="card.id"
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
        <button
          type="button"
          @click="toggleChecked"
          class="mt-0.5 checkbox-btn checkbox-btn-sm checkbox-btn-square"
          :class="card.checked ? 'checkbox-btn-checked' : 'checkbox-btn-unchecked'"
        >
          <span v-if="card.checked" class="i-lucide-check text-xs" />
        </button>

        <!-- Title -->
        <div class="flex-1 min-w-0">
          <p
            @dblclick="openEdit"
            class="text-sm font-medium text-fg cursor-text"
            :class="{ 'line-through': card.checked }"
          >
            {{ card.title }}
          </p>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-0.5 card-actions-hover">
          <button @click="openEdit" class="btn-icon p-1 text-fg-muted" title="Редактировать">
            <span class="i-lucide-edit-2 text-xs" />
          </button>
          <button
            @click="deleteCard"
            class="btn-icon p-1 text-fg-muted hover:text-danger"
            title="Удалить"
          >
            <span class="i-lucide-trash-2 text-xs" />
          </button>
        </div>
      </div>

      <!-- Note Content -->
      <div v-if="card.cardType === 'NOTE' && card.noteContent" class="mt-2">
        <p class="text-xs text-fg-muted" :class="expandedNote ? '' : 'line-clamp-3'">
          {{ card.noteContent }}
        </p>
        <button
          v-if="card.noteContent.length > 100"
          @click="expandedNote = !expandedNote"
          class="text-xs link-primary mt-1"
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
          <button
            type="button"
            @click="toggleChecklistItem(index)"
            class="checkbox-btn checkbox-btn-xs checkbox-btn-square"
            :class="item.checked ? 'checkbox-btn-checked' : 'checkbox-btn-unchecked'"
          >
            <span v-if="item.checked" class="i-lucide-check text-[10px]" />
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
          type="button"
          @click="expandedNote = !expandedNote"
          class="btn-add-dashed mt-2"
        >
          {{ expandedNote ? 'Свернуть' : `Ещё ${card.checklistItems.length - 3}` }}
        </button>

        <!-- Progress: скрыт при 0 пунктов (иначе 0/0 → NaN% и зелёный прямоугольник) -->
        <div v-if="completedChecklist.total > 0" class="flex items-center gap-2 mt-2">
          <div class="flex-1 h-1.5 bg-muted rounded-full overflow-hidden min-w-0">
            <div
              class="h-full bg-success transition-all rounded-full"
              :style="{ width: `${progressPercent}%` }"
            />
          </div>
          <span class="text-[10px] text-fg-muted shrink-0">
            {{ completedChecklist.done }}/{{ completedChecklist.total }}
          </span>
        </div>
      </div>

      <!-- Type Badge -->
      <div class="flex items-center gap-2 mt-2">
        <span v-if="card.cardType === 'VIDEO'" class="card-type-badge">
          <span class="i-lucide-video text-xs" />
          Видео
        </span>
        <span v-else-if="card.cardType === 'NOTE'" class="card-type-badge">
          <span class="i-lucide-file-text text-xs" />
          Заметка
        </span>
        <span v-else-if="card.cardType === 'CHECKLIST'" class="card-type-badge">
          <span class="i-lucide-check-square text-xs" />
          Чеклист
        </span>
      </div>
    </div>

    <AddCardDialog
      :open="showEditDialog"
      :column-id="columnId"
      :card="card"
      @close="showEditDialog = false"
    />
  </div>
</template>
