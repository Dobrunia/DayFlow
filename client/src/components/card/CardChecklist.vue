<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import type { ChecklistPayload } from 'dayflow-shared';
import { linkify } from '@/lib/utils';
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogClose,
} from 'radix-vue';

const props = defineProps<{
  title: string | null;
  done: boolean;
  payload: ChecklistPayload;
  disabled?: boolean;
  editableSummary?: boolean;
}>();

const emit = defineEmits<{
  toggleItem: [index: number];
  updateSummary: [value: string];
}>();

const summaryEdit = ref('');
const summaryInputRef = ref<HTMLTextAreaElement | null>(null);
const showSummaryModal = ref(false);

const summaryHtml = computed(() => linkify(props.payload.summary ?? ''));
const summaryLineCount = computed(() => Math.max(1, summaryEdit.value.split('\n').length));
const summaryLineNumbers = computed(() =>
  Array.from({ length: summaryLineCount.value }, (_, i) => i + 1)
);

function openSummaryEditor() {
  if (!props.editableSummary) return;
  summaryEdit.value = props.payload.summary ?? '';
  showSummaryModal.value = true;
  nextTick(() => summaryInputRef.value?.focus());
}

function saveSummary() {
  const v = summaryEdit.value;
  if (v !== (props.payload.summary ?? '')) emit('updateSummary', v.trim() || '');
  showSummaryModal.value = false;
}

function closeSummaryModal() {
  showSummaryModal.value = false;
}

const items = computed(() => props.payload.items ?? []);
const progress = computed(() => {
  const total = items.value.length;
  if (total === 0) return { done: 0, total: 0 };
  const done = items.value.filter((i) => i.done).length;
  return { done, total };
});
const progressPercent = computed(() => {
  const { done, total } = progress.value;
  return total > 0 ? Math.round((done / total) * 100) : 0;
});

const showLimit = 5;
const expanded = defineModel<boolean>('expanded', { default: false });
const visibleItems = computed(() =>
  expanded.value ? items.value : items.value.slice(0, showLimit)
);
const hasMore = computed(() => items.value.length > showLimit);
</script>

<template>
  <div class="p-3 space-y-2">
    <div
      v-for="(item, index) in visibleItems"
      :key="item.id"
      class="flex items-center gap-2"
    >
      <button
        v-if="!disabled"
        type="button"
        @click="emit('toggleItem', index)"
        class="checkbox-btn checkbox-btn-xs checkbox-btn-square flex-shrink-0"
        :class="item.done ? 'checkbox-btn-checked' : 'checkbox-btn-unchecked'"
      >
        <span v-if="item.done" class="i-lucide-check text-[10px]" />
      </button>
      <div
        v-else
        class="checkbox-btn checkbox-btn-xs checkbox-btn-square flex-shrink-0"
        :class="item.done ? 'checkbox-btn-checked' : 'checkbox-btn-unchecked'"
      >
        <span v-if="item.done" class="i-lucide-check text-[10px]" />
      </div>
      <span
        class="text-xs text-fg-muted"
        :class="{ 'line-through opacity-70': item.done }"
      >
        {{ item.text }}
      </span>
    </div>

    <button
      v-if="hasMore"
      type="button"
      @click="expanded = !expanded"
      class="btn-add-dashed mt-2"
    >
      {{ expanded ? 'Свернуть' : `Ещё ${items.length - showLimit}` }}
    </button>

    <div v-if="progress.total > 0" class="flex items-center gap-2 mt-2">
      <div class="flex-1 h-1.5 bg-muted rounded-full overflow-hidden min-w-0">
        <div
          class="h-full bg-success transition-all rounded-full"
          :style="{ width: `${progressPercent}%` }"
        />
      </div>
      <span class="text-[10px] text-fg-muted shrink-0">
        {{ progress.done }}/{{ progress.total }}
      </span>
    </div>

    <div v-if="editableSummary" class="mt-1.5 flex items-start gap-1">
      <p
        v-if="payload.summary"
        class="card-summary italic"
        v-html="summaryHtml"
      />
      <p v-else class="card-summary-placeholder italic">
        Конспект...
      </p>
      <button
        type="button"
        @click="openSummaryEditor"
        class="btn-icon-muted-primary flex-shrink-0 card-icon-hover"
        title="Редактировать конспект"
      >
        <span class="i-lucide-edit-2 text-xs" />
      </button>
    </div>
    <template v-else-if="payload.summary">
      <p class="card-summary-readonly italic" v-html="summaryHtml"></p>
    </template>

    <DialogRoot v-model:open="showSummaryModal">
      <DialogPortal>
        <DialogOverlay class="dialog-overlay" @click="closeSummaryModal" />
        <DialogContent
          class="dialog-content-scroll max-h-[85vh] max-w-lg"
          @escape-key-down="closeSummaryModal"
        >
          <div class="dialog-header">
            <DialogTitle class="dialog-title">Редактировать конспект</DialogTitle>
            <DialogClose class="dialog-close">
              <span class="i-lucide-x text-fg-muted" />
            </DialogClose>
          </div>
          <div class="summary-editor mt-4 max-h-[50vh] overflow-auto rounded-lg border border-border bg-muted/30">
            <div class="flex">
              <div
                class="summary-line-numbers flex flex-col flex-shrink-0 w-9 min-w-9 py-2.5 pr-2 text-right text-fg-muted text-sm font-mono leading-7 select-none"
              >
                <span
                  v-for="n in summaryLineNumbers"
                  :key="n"
                  class="summary-line-num block h-7 flex items-center justify-end"
                >{{ n }}</span>
              </div>
              <textarea
              ref="summaryInputRef"
              v-model="summaryEdit"
              class="flex-1 min-w-0 py-2.5 pl-2 pr-3 text-sm text-fg bg-bg border-0 resize-none font-mono leading-7 focus:outline-none focus:ring-0"
              spellcheck="false"
              :rows="summaryLineCount"
              @keydown.ctrl.enter="saveSummary"
              />
            </div>
          </div>
          <div class="form-actions mt-4">
            <button type="button" class="btn-secondary" @click="closeSummaryModal">Отмена</button>
            <button type="button" class="btn-primary" @click="saveSummary">Сохранить</button>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  </div>
</template>
