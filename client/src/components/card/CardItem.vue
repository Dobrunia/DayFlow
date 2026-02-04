<script setup lang="ts">
import { ref, computed } from 'vue';
import { useWorkspaceStore } from '@/stores/workspace';
import { useCardsStore } from '@/stores/cards';
import type { CardGql } from '@/graphql/types';
import { parseCard } from '@/lib/card';
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

const isHubCard = computed(() => props.isBacklog && props.card.workspaceId == null);

const parsed = computed(() => {
  try {
    return parseCard(props.card);
  } catch {
    return null;
  }
});

const typeLabel = computed(() => {
  switch (props.card.type) {
    case 'NOTE':
      return 'Заметка';
    case 'LINK':
      return 'Ссылка';
    case 'CHECKLIST':
      return 'Чеклист';
    default:
      return '';
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

async function toggleDone() {
  if (props.isBacklog) return;
  try {
    const payload = { done: !props.card.done };
    if (isHubCard.value) await cardsStore.updateCard(props.card.id, payload);
    else await workspaceStore.updateCard(props.card.id, payload);
  } catch (e) {
    toast.error(getGraphQLErrorMessage(e));
  }
}

async function toggleChecklistItem(index: number) {
  if (props.isBacklog || props.card.type !== 'CHECKLIST') return;
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

async function deleteCard() {
  if (!confirm('Удалить карточку?')) return;
  try {
    if (isHubCard.value) await cardsStore.deleteCard(props.card.id);
    else await workspaceStore.deleteCard(props.card.id);
  } catch (e) {
    toast.error(getGraphQLErrorMessage(e));
  }
}
</script>

<template>
  <div
    class="bg-bg rounded-lg border border-border shadow-sm hover:shadow transition-shadow group cursor-grab active:cursor-grabbing"
    :class="{ 'opacity-60': card.done }"
    :data-card-id="card.id"
  >
    <div class="flex items-start gap-2 p-3 pb-0">
      <button
        type="button"
        :disabled="isBacklog"
        @click="toggleDone"
        class="mt-0.5 checkbox-btn checkbox-btn-sm checkbox-btn-square flex-shrink-0"
        :class="card.done ? 'checkbox-btn-checked' : 'checkbox-btn-unchecked'"
      >
        <span v-if="card.done" class="i-lucide-check text-xs" />
      </button>

      <div class="flex-1 min-w-0">
        <p
          @dblclick="showEditDialog = true"
          class="text-sm font-medium text-fg cursor-text"
          :class="{ 'line-through': card.done }"
        >
          {{ card.title || '(без названия)' }}
        </p>
      </div>

      <div class="flex items-center gap-0.5 card-actions-hover flex-shrink-0">
        <button
          type="button"
          @click="showEditDialog = true"
          class="btn-icon p-1 text-fg-muted"
          title="Редактировать"
        >
          <span class="i-lucide-edit-2 text-xs" />
        </button>
        <button
          type="button"
          @click="deleteCard"
          class="btn-icon p-1 text-fg-muted hover:text-danger"
          title="Удалить"
        >
          <span class="i-lucide-trash-2 text-xs" />
        </button>
      </div>
    </div>

    <template v-if="parsed">
      <CardNote
        v-if="parsed.type === 'note'"
        :title="card.title"
        :done="card.done"
        :payload="parsed.payload"
      />
      <CardLink
        v-else-if="parsed.type === 'link'"
        :title="card.title"
        :done="card.done"
        :payload="parsed.payload"
      />
      <CardChecklist
        v-else-if="parsed.type === 'checklist'"
        :title="card.title"
        :done="card.done"
        :payload="parsed.payload"
        :disabled="isBacklog"
        @toggle-item="toggleChecklistItem"
      />
    </template>

    <div class="flex items-center gap-2 px-3 pb-2 pt-1">
      <span class="card-type-badge">
        <span :class="typeIcon" class="text-xs" />
        {{ typeLabel }}
      </span>
    </div>

    <CreateCardDialog
      v-if="columnId || isBacklog"
      :open="showEditDialog"
      :card="card"
      :column-id="columnId"
      :workspace-id="card.workspaceId ?? undefined"
      :is-backlog="isBacklog"
      @close="showEditDialog = false"
    />
  </div>
</template>
