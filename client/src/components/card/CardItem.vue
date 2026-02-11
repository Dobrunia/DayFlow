<script setup lang="ts">
import { ref, computed, toRef, watch } from 'vue';
import type { CardGql } from '@/graphql/types';
import { parseCard } from '@/lib/card';
import { useInlineEdit } from '@/composables/useInlineEdit';
import { useCardActions } from '@/composables/useCardActions';
import { CARD_TYPES, LEARNING_STATUS_META, CARD_TYPE_META } from '@/lib/constants';
import { toast } from 'vue-sonner';
import CardNote from './CardNote.vue';
import CardLink from './CardLink.vue';
import CardChecklist from './CardChecklist.vue';
import CreateCardDialog from '@/components/card/CreateCardDialog.vue';

const props = withDefaults(
  defineProps<{
    card: CardGql;
    columnId?: string;
    /** Беклог: карточка без колонки, только просмотр/редакт/удаление */
    isBacklog?: boolean;
    /** Отключить drag-курсор (для Tags view и т.п.) */
    static?: boolean;
  }>(),
  { isBacklog: false, static: false }
);

const emit = defineEmits<{
  (e: 'updated', card: CardGql): void;
  (e: 'deleted', cardId: string): void;
}>();

const showEditDialog = ref(false);
const titleContainerRef = ref<HTMLElement | null>(null);

// Используем composable для всех операций с карточкой
const cardActions = useCardActions(toRef(props, 'card'), {
  onUpdated: (card) => emit('updated', card),
  onDeleted: (cardId) => emit('deleted', cardId),
});

const {
  isEditing: isEditingTitle,
  editTitle,
  inputRef: titleInputRef,
  startEdit: startEditTitle,
  saveEdit: saveEditTitle,
  cancelEdit: cancelEditTitle,
} = useInlineEdit(
  titleContainerRef,
  () => props.card.title ?? '',
  async (newTitle) => {
    await cardActions.updateCard({ title: newTitle || undefined, payload: props.card.payload });
  }
);

const parsed = computed(() => {
  try {
    return parseCard(props.card);
  } catch {
    return null;
  }
});

const typeIcon = computed(() => {
  switch (props.card.type) {
    case CARD_TYPES.NOTE:
      return 'i-lucide-file-text';
    case CARD_TYPES.LINK:
      return 'i-lucide-external-link'; // тут важно имонно external!!!
    case CARD_TYPES.CHECKLIST:
      return 'i-lucide-check-square';
    default:
      return 'i-lucide-circle';
  }
});

/** URL для карточки-ссылки: бейдж «Ссылка» ведёт на него */
const linkUrl = computed(() => {
  if (parsed.value?.type !== CARD_TYPES.LINK) return null;
  return (parsed.value.payload as { url?: string }).url ?? null;
});

const learningStatusInfo = computed(() => {
  if (!props.card.learningStatus) return null;
  return LEARNING_STATUS_META[props.card.learningStatus];
});

const isCollapsed = ref(!!props.card.learningStatus || props.card.done);

watch(
  () => [props.card.learningStatus, props.card.done] as const,
  ([status, done], [oldStatus, oldDone]) => {
    if ((status && !oldStatus) || (done && !oldDone)) {
      isCollapsed.value = true;
    }
  }
);

function handleDeleteFromDialog() {
  showEditDialog.value = false;
  cardActions.deleteCard();
}

const promptCopied = ref(false);

const aiPrompt = computed(() => {
  const c = props.card;
  const typeName = CARD_TYPE_META[c.type as keyof typeof CARD_TYPE_META]?.label ?? c.type;
  const lines: string[] = [
    'Помоги мне разобраться в теме на основе моей карточки.',
    '',
    `Тип карточки: ${typeName}`,
    `Название: ${c.title || '(без названия)'}`,
  ];

  if (c.tags?.length) {
    lines.push(`Теги: ${c.tags.join(', ')}`);
  }

  const p = parsed.value;
  if (p) {
    const payload = p.payload as Record<string, unknown>;
    if (p.type === CARD_TYPES.NOTE && payload.content) {
      lines.push('', `Текст заметки:\n${payload.content}`);
    }
    if (p.type === CARD_TYPES.LINK && payload.url) {
      lines.push(`Ссылка: ${payload.url}`);
    }
    if (p.type === CARD_TYPES.CHECKLIST && Array.isArray(payload.items)) {
      const items = payload.items as { text: string; done: boolean }[];
      lines.push('', 'Чеклист:');
      items.forEach((it) => lines.push(`- [${it.done ? 'x' : ' '}] ${it.text}`));
    }
    if (payload.summary) {
      lines.push('', `Мой конспект:\n${payload.summary}`);
    }
  }

  lines.push(
    '',
    'На основе этой информации:',
    '1) Объясни ключевые концепции простым языком',
    '2) Укажи что стоит изучить глубже',
    '3) Предложи практические задачи для закрепления',
  );

  return lines.join('\n');
});

function copyAiPrompt() {
  navigator.clipboard.writeText(aiPrompt.value).then(
    () => {
      promptCopied.value = true;
      toast.success('Промпт скопирован');
      setTimeout(() => (promptCopied.value = false), 2000);
    },
    () => toast.error('Не удалось скопировать'),
  );
}
</script>

<template>
  <div class="card-item relative group" :data-card-id="card.id">
    <button
      type="button"
      class="absolute -top-2 right-3 z-10 icon-btn-edit rounded-full bg-surface border border-border shadow-sm card-action pointer-events-none group-hover:pointer-events-auto"
      title="Редактировать"
      @click="showEditDialog = true"
    >
      <span class="i-lucide-pencil" />
    </button>

    <div
      class="card"
      :class="[
        { 'opacity-60': card.done },
        !static && (columnId || (isBacklog && card.workspaceId != null))
          ? 'cursor-grab active:cursor-grabbing'
          : 'cursor-default',
        isCollapsed && 'pb-2',
      ]"
    >
      <div class="flex items-center gap-2 p-3 pb-0">
        <button
          type="button"
          @click="cardActions.toggleDone()"
          class="w-4 h-4 rounded flex-center border transition-colors shrink-0"
          :class="
            card.done
              ? 'bg-success border-success text-on-primary'
              : 'border-border hover:border-success'
          "
        >
          <span v-if="card.done" class="i-lucide-check text-xs" />
        </button>

        <div
          v-if="learningStatusInfo"
          class="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-surface border border-border"
          :title="learningStatusInfo.label"
        >
          <span :class="[learningStatusInfo.icon, learningStatusInfo.color]" class="text-xs" />
        </div>

        <div
          ref="titleContainerRef"
          class="flex-1 min-w-0 flex items-center cursor-text overflow-hidden"
          :title="card.title || '(без названия)'"
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
            class="text-sm font-medium text-fg min-w-0 break-words line-clamp-2 leading-snug pointer-events-none"
            :class="{ 'line-through': card.done }"
          >
            {{ card.title || '(без названия)' }}
          </p>
        </div>
      </div>

      <template v-if="parsed && !isCollapsed">
        <CardNote
          v-if="parsed.type === CARD_TYPES.NOTE"
          :title="card.title ?? null"
          :done="card.done"
          :payload="parsed.payload"
          :editable-summary="true"
          @update-summary="cardActions.updateSummary"
        />
        <CardLink
          v-else-if="parsed.type === CARD_TYPES.LINK"
          :title="card.title ?? null"
          :done="card.done"
          :payload="parsed.payload"
          :editable-summary="true"
          @update-summary="cardActions.updateSummary"
        />
        <CardChecklist
          v-else-if="parsed.type === CARD_TYPES.CHECKLIST"
          :title="card.title ?? null"
          :done="card.done"
          :payload="parsed.payload"
          :editable-summary="true"
          @toggle-item="cardActions.toggleChecklistItem"
          @update-summary="cardActions.updateSummary"
        />
      </template>

      <!-- Card footer: link + AI prompt -->
      <div v-if="!isCollapsed" class="flex items-center gap-2 px-3 pb-2 pt-1">
        <a
          v-if="linkUrl"
          :href="linkUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="text-xs text-primary hover:underline flex items-center gap-1"
          title="Перейти по ссылке"
        >
          <span>Перейти</span>
          <span :class="typeIcon" class="shrink-0" />
        </a>
        <span class="flex-1" />
        <button
          type="button"
          class="text-xs flex items-center gap-1 card-action"
          :class="promptCopied ? 'text-success opacity-100!' : 'text-muted hover:text-fg'"
          title="Промпт для ИИ: разобраться в теме"
          @click.stop="copyAiPrompt"
        >
          <span :class="promptCopied ? 'i-lucide-check' : 'i-lucide-sparkles'" class="text-sm" />
        </button>
      </div>

      <div v-if="isCollapsed" class="px-3 pt-0 text-center">
        <button
          type="button"
          @click="isCollapsed = false"
          class="text-xs text-muted hover:text-fg transition-colors w-full py-1 border-t border-border mt-2"
        >
          Развернуть
        </button>
      </div>
    </div>

    <CreateCardDialog
      :open="showEditDialog"
      :card="card"
      :column-id="columnId"
      :workspace-id="card.workspaceId ?? undefined"
      :is-backlog="isBacklog"
      @close="showEditDialog = false"
      @delete="handleDeleteFromDialog"
      @updated="(c) => emit('updated', c)"
    />
  </div>
</template>
