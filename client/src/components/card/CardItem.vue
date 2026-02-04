<script setup lang="ts">
import { ref, computed } from 'vue';
import { useWorkspaceStore } from '@/stores/workspace';
import { useCardsStore } from '@/stores/cards';
import type { CardGql } from '@/graphql/types';
import { parseCard } from '@/lib/card';
import { useInlineEdit } from '@/composables/useInlineEdit';
import CardNote from './CardNote.vue';
import CardLink from './CardLink.vue';
import CardChecklist from './CardChecklist.vue';
import CreateCardDialog from '@/components/card/CreateCardDialog.vue';
import { toast } from 'vue-sonner';
import { getGraphQLErrorMessage } from '@/lib/graphql-error';

const props = withDefaults(
  defineProps<{
    card: CardGql;
    columnId?: string;
    /** Беклог: карточка без колонки, только просмотр/редакт/удаление */
    isBacklog?: boolean;
  }>(),
  { isBacklog: false }
);

const workspaceStore = useWorkspaceStore();
const cardsStore = useCardsStore();
const showEditDialog = ref(false);
const titleContainerRef = ref<HTMLElement | null>(null);

const { isEditing: isEditingTitle, editTitle, inputRef: titleInputRef, startEdit: startEditTitle, saveEdit: saveEditTitle, cancelEdit: cancelEditTitle } = useInlineEdit(
  titleContainerRef,
  () => props.card.title ?? '',
  async (newTitle) => {
    const payload = props.card.payload;
    if (isHubCard.value) await cardsStore.updateCard(props.card.id, { title: newTitle || undefined, payload });
    else await workspaceStore.updateCard(props.card.id, { title: newTitle || undefined, payload });
  }
);

const isHubCard = computed(() => props.isBacklog && props.card.workspaceId == null);

const parsed = computed(() => {
  try {
    return parseCard(props.card);
  } catch {
    return null;
  }
});

const typeIcon = computed(() => {
  switch (props.card.type) {
    case 'NOTE':
      return 'i-lucide-file-text';
    case 'LINK':
      return 'i-lucide-link';
    case 'CHECKLIST':
      return 'i-lucide-check-square';
    default:
      return 'i-lucide-circle';
  }
});

/** URL для карточки-ссылки: бейдж «Ссылка» ведёт на него */
const linkUrl = computed(() => {
  if (parsed.value?.type !== 'link') return null;
  return (parsed.value.payload as { url?: string }).url ?? null;
});

async function toggleDone() {
  try {
    const payload = { done: !props.card.done };
    if (isHubCard.value) await cardsStore.updateCard(props.card.id, payload);
    else await workspaceStore.updateCard(props.card.id, payload);
  } catch (e) {
    toast.error(getGraphQLErrorMessage(e));
  }
}

async function toggleChecklistItem(index: number) {
  if (props.card.type !== 'CHECKLIST') return;
  try {
    const raw = typeof props.card.payload === 'string' ? JSON.parse(props.card.payload || '{}') : props.card.payload;
    const items = Array.isArray((raw as { items?: unknown[] }).items) ? (raw as { items: { id: string; text: string; done: boolean; order: number }[] }).items : [];
    const next = items.map((it, i) => (i === index ? { ...it, done: !it.done } : it));
    const payload = { payload: JSON.stringify({ items: next }) };
    if (isHubCard.value) await cardsStore.updateCard(props.card.id, payload);
    else await workspaceStore.updateCard(props.card.id, payload);
  } catch (e) {
    toast.error(getGraphQLErrorMessage(e));
  }
}

async function doDelete() {
  try {
    if (isHubCard.value) await cardsStore.deleteCard(props.card.id);
    else await workspaceStore.deleteCard(props.card.id);
  } catch (e) {
    toast.error(getGraphQLErrorMessage(e));
  }
}

function handleDeleteFromDialog() {
  if (!confirm('Удалить карточку?')) return;
  doDelete();
  showEditDialog.value = false;
}

async function updateSummary(newSummary: string) {
  try {
    const raw = typeof props.card.payload === 'string' ? JSON.parse(props.card.payload || '{}') : props.card.payload;
    const payload = JSON.stringify({ ...raw, summary: newSummary.trim() || undefined });
    if (isHubCard.value) await cardsStore.updateCard(props.card.id, { payload });
    else await workspaceStore.updateCard(props.card.id, { payload });
  } catch (e) {
    toast.error(getGraphQLErrorMessage(e));
  }
}
</script>

<template>
  <div class="relative group" :data-card-id="card.id">
    <button
      type="button"
      class="card-edit-float"
      title="Редактировать"
      @click="showEditDialog = true"
    >
      <span class="i-lucide-pencil w-4 h-4 block shrink-0" />
    </button>

    <div
      class="bg-bg rounded-lg border border-border shadow-sm hover:shadow transition-shadow"
      :class="[
        { 'opacity-60': card.done },
        columnId || (isBacklog && card.workspaceId != null) ? 'cursor-grab active:cursor-grabbing' : 'cursor-default',
      ]"
    >
      <div class="flex items-center gap-2 p-3 pb-0">
        <button
          type="button"
          @click="toggleDone"
          class="checkbox-btn-card"
          :class="card.done ? 'checkbox-btn-checked' : 'checkbox-btn-unchecked'"
        >
          <span v-if="card.done" class="i-lucide-check text-xs" />
        </button>

        <div
          ref="titleContainerRef"
          class="flex-1 min-w-0 flex items-center cursor-text"
          @dblclick.prevent="startEditTitle()"
        >
          <template v-if="isEditingTitle">
            <input
              ref="titleInputRef"
              v-model="editTitle"
              class="input text-sm font-medium py-0.5 px-1 w-full min-w-0"
              @keyup.enter="saveEditTitle"
              @keyup.escape="cancelEditTitle()"
              @blur="saveEditTitle"
            />
          </template>
          <p
            v-else
            class="text-sm font-medium text-fg min-w-0 truncate leading-none pointer-events-none"
            :class="{ 'line-through': card.done }"
          >
            {{ card.title || '(без названия)' }}
          </p>
        </div>
      </div>

    <template v-if="parsed">
      <CardNote
        v-if="parsed.type === 'note'"
        :title="card.title"
        :done="card.done"
        :payload="parsed.payload"
        :editable-summary="true"
        @update-summary="updateSummary"
      />
      <CardLink
        v-else-if="parsed.type === 'link'"
        :title="card.title"
        :done="card.done"
        :payload="parsed.payload"
        :editable-summary="true"
        @update-summary="updateSummary"
      />
      <CardChecklist
        v-else-if="parsed.type === 'checklist'"
        :title="card.title"
        :done="card.done"
        :payload="parsed.payload"
        :editable-summary="true"
        @toggle-item="toggleChecklistItem"
        @update-summary="updateSummary"
      />
    </template>

    <div v-if="linkUrl" class="flex items-center gap-2 px-3 pb-2 pt-1">
      <a
        :href="linkUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="card-type-badge-link"
        title="Перейти по ссылке"
      >
        <span>Перейти</span>
        <span :class="typeIcon" class="text-xs shrink-0" />
      </a>
    </div>

    </div>

    <CreateCardDialog
      v-if="columnId || isBacklog"
      :open="showEditDialog"
      :card="card"
      :column-id="columnId"
      :workspace-id="card.workspaceId ?? undefined"
      :is-backlog="isBacklog"
      @close="showEditDialog = false"
      @delete="handleDeleteFromDialog"
    />
  </div>
</template>
