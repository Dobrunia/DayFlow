<script setup lang="ts">
import { ref, computed } from 'vue';
import { useWorkspaceStore } from '@/stores/workspace';
import type { Card, Item, ChecklistItem } from '@/graphql/types';
import AddCardDialog from './AddCardDialog.vue';
import AddItemDialog from '@/components/library/AddItemDialog.vue';
import { useLibraryStore } from '@/stores/library';
import { extractYouTubeId, getYouTubeThumbnail } from '@/lib/utils';
import { toast } from 'vue-sonner';

const props = withDefaults(
  defineProps<{
    card?: Card;
    columnId?: string;
    /** Режим беклога: элемент без колонки, тот же вид что и карточка */
    item?: Item;
  }>(),
  { columnId: '' }
);

const workspaceStore = useWorkspaceStore();
const libraryStore = useLibraryStore();
const showEditDialog = ref(false);
const showItemEditDialog = ref(false);
const expandedNote = ref(false);

const isBacklog = computed(() => !!props.item);

const itemTypeToCardType = (type: string): 'VIDEO' | 'NOTE' | 'CHECKLIST' => {
  const map: Record<string, 'VIDEO' | 'NOTE' | 'CHECKLIST'> = {
    VIDEO: 'VIDEO',
    NOTE: 'NOTE',
    LINK: 'NOTE',
    REPO: 'NOTE',
    TASK: 'CHECKLIST',
  };
  return map[type] ?? 'NOTE';
};

/** Единый объект для отображения: либо card, либо card-форма из item */
const display = computed(() => {
  if (props.card) return props.card;
  const it = props.item!;
  let checklistItems: ChecklistItem[] = [];
  if (it.type === 'TASK' && it.meta) {
    try {
      const meta = JSON.parse(it.meta) as { checklistItems?: ChecklistItem[] };
      checklistItems = meta?.checklistItems ?? [];
    } catch {
      /* noop */
    }
  }
  return {
    id: it.id,
    title: it.title,
    cardType: itemTypeToCardType(it.type),
    checked: it.done,
    videoUrl: it.type === 'VIDEO' ? it.url : null,
    noteContent: it.type === 'NOTE' ? it.content : null,
    checklistItems,
  };
});

function openEdit() {
  if (isBacklog.value) showItemEditDialog.value = true;
  else showEditDialog.value = true;
}

const youtubeId = computed(() => {
  if (display.value.cardType === 'VIDEO' && display.value.videoUrl) {
    return extractYouTubeId(display.value.videoUrl);
  }
  return null;
});

const thumbnail = computed(() => {
  if (youtubeId.value) return getYouTubeThumbnail(youtubeId.value);
  return props.card?.videoPreview ?? null;
});

const completedChecklist = computed(() => {
  const list = display.value.checklistItems;
  if (!list || !Array.isArray(list)) return { done: 0, total: 0 };
  const total = list.length;
  const done = list.filter((i) => i.checked).length;
  return { done, total };
});

const progressPercent = computed(() => {
  const { done, total } = completedChecklist.value;
  return total > 0 ? Math.round((done / total) * 100) : 0;
});

async function toggleChecked() {
  if (isBacklog.value) return;
  try {
    await workspaceStore.toggleCardChecked(props.card!.id);
  } catch {
    toast.error('Ошибка обновления');
  }
}

async function toggleChecklistItem(index: number) {
  if (isBacklog.value || !props.card?.checklistItems) return;
  const items = [...props.card.checklistItems];
  items[index] = { ...items[index], checked: !items[index].checked };
  try {
    await workspaceStore.updateCard(props.card.id, { checklistItems: items });
  } catch {
    toast.error('Ошибка обновления');
  }
}

async function deleteCard() {
  if (isBacklog.value) {
    if (!confirm('Удалить из воркспейса?')) return;
    try {
      await libraryStore.deleteItem(props.item!.id);
      if (workspaceStore.currentWorkspace) {
        await workspaceStore.fetchWorkspace(workspaceStore.currentWorkspace.id);
      }
    } catch {
      toast.error('Ошибка удаления');
    }
    return;
  }
  if (!confirm('Удалить карточку?')) return;
  try {
    await workspaceStore.deleteCard(props.card!.id);
  } catch {
    toast.error('Ошибка удаления');
  }
}

function openVideo() {
  const url =
    display.value.cardType === 'VIDEO' && display.value.videoUrl ? display.value.videoUrl : null;
  if (url) window.open(url, '_blank');
}
</script>

<template>
  <div
    class="bg-bg rounded-lg border border-border shadow-sm hover:shadow transition-shadow group cursor-grab active:cursor-grabbing"
    :class="{ 'opacity-60': display.checked }"
    :data-card-id="isBacklog ? undefined : card?.id"
    :data-item-id="isBacklog ? item?.id : undefined"
  >
    <!-- Video Thumbnail -->
    <div
      v-if="display.cardType === 'VIDEO' && thumbnail"
      class="relative aspect-video bg-muted rounded-t-lg overflow-hidden cursor-pointer"
      @click="openVideo"
    >
      <img :src="thumbnail" :alt="display.title" class="w-full h-full object-cover" />
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
          :disabled="isBacklog"
          @click="toggleChecked"
          class="mt-0.5 checkbox-btn checkbox-btn-sm checkbox-btn-square"
          :class="display.checked ? 'checkbox-btn-checked' : 'checkbox-btn-unchecked'"
        >
          <span v-if="display.checked" class="i-lucide-check text-xs" />
        </button>

        <!-- Title -->
        <div class="flex-1 min-w-0">
          <p
            @dblclick="openEdit"
            class="text-sm font-medium text-fg cursor-text"
            :class="{ 'line-through': display.checked }"
          >
            {{ display.title }}
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
      <div v-if="display.cardType === 'NOTE' && display.noteContent" class="mt-2">
        <p class="text-xs text-fg-muted" :class="expandedNote ? '' : 'line-clamp-3'">
          {{ display.noteContent }}
        </p>
        <button
          v-if="display.noteContent.length > 100"
          @click="expandedNote = !expandedNote"
          class="text-xs link-primary mt-1"
        >
          {{ expandedNote ? 'Свернуть' : 'Развернуть' }}
        </button>
      </div>

      <!-- Checklist Items (в беклоге только отображение, без toggle) -->
      <div v-if="display.cardType === 'CHECKLIST' && display.checklistItems" class="mt-2 space-y-1">
        <div
          v-for="(sub, index) in display.checklistItems.slice(0, expandedNote ? undefined : 3)"
          :key="sub.id"
          class="flex items-center gap-2"
        >
          <button
            v-if="!isBacklog"
            type="button"
            @click="toggleChecklistItem(index)"
            class="checkbox-btn checkbox-btn-xs checkbox-btn-square"
            :class="sub.checked ? 'checkbox-btn-checked' : 'checkbox-btn-unchecked'"
          >
            <span v-if="sub.checked" class="i-lucide-check text-[10px]" />
          </button>
          <div
            v-else
            class="checkbox-btn checkbox-btn-xs checkbox-btn-square flex-shrink-0"
            :class="sub.checked ? 'checkbox-btn-checked' : 'checkbox-btn-unchecked'"
          >
            <span v-if="sub.checked" class="i-lucide-check text-[10px]" />
          </div>
          <span
            class="text-xs text-fg-muted"
            :class="{ 'line-through text-fg-muted opacity-70': sub.checked }"
          >
            {{ sub.text }}
          </span>
        </div>

        <button
          v-if="display.checklistItems.length > 3"
          type="button"
          @click="expandedNote = !expandedNote"
          class="btn-add-dashed mt-2"
        >
          {{ expandedNote ? 'Свернуть' : `Ещё ${display.checklistItems.length - 3}` }}
        </button>

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
        <span v-if="display.cardType === 'VIDEO'" class="card-type-badge">
          <span class="i-lucide-video text-xs" />
          Видео
        </span>
        <span v-else-if="display.cardType === 'NOTE'" class="card-type-badge">
          <span class="i-lucide-file-text text-xs" />
          Заметка
        </span>
        <span v-else-if="display.cardType === 'CHECKLIST'" class="card-type-badge">
          <span class="i-lucide-check-square text-xs" />
          Чеклист
        </span>
      </div>
    </div>

    <AddCardDialog
      v-if="card"
      :open="showEditDialog"
      :column-id="columnId!"
      :card="card"
      @close="showEditDialog = false"
    />
    <AddItemDialog
      v-if="item"
      :open="showItemEditDialog"
      :item="item"
      @close="
        showItemEditDialog = false;
        if (workspaceStore.currentWorkspace)
          workspaceStore.fetchWorkspace(workspaceStore.currentWorkspace.id);
      "
    />
  </div>
</template>
