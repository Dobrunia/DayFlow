<script setup lang="ts">
import { ref, nextTick, computed } from 'vue';
import type { LinkPayload } from 'dayflow-shared';
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
  payload: LinkPayload;
  editableSummary?: boolean;
}>();

const emit = defineEmits<{
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
</script>

<template>
  <div class="p-3">
    <div v-if="editableSummary" class="mt-2 flex items-center gap-1">
      <div class="flex-1 min-w-0 pl-2 border-l-2 border-primary/40">
        <p
          v-if="payload.summary"
          class="text-xs text-muted/90 italic max-h-[200px] overflow-y-auto scrollbar-hide whitespace-pre-wrap"
          v-html="summaryHtml"
        />
        <p v-else class="text-xs text-muted/50 italic">
          Конспект...
        </p>
      </div>
      <button
        type="button"
        @click="openSummaryEditor"
        class="icon-btn-edit shrink-0 opacity-0 group-hover:opacity-100"
        title="Редактировать конспект"
      >
        <span class="i-lucide-edit-2" />
      </button>
    </div>
    <template v-else-if="payload.summary">
      <p class="text-xs text-muted/90 italic mt-2 pl-2 border-l-2 border-primary/40 whitespace-pre-wrap max-h-[400px] overflow-y-auto scrollbar-hide" v-html="summaryHtml"></p>
    </template>
    <template v-else>
      <p class="text-xs text-muted/50 italic mt-2 pl-2 border-l-2 border-primary/40">Конспект...</p>
    </template>

    <DialogRoot v-model:open="showSummaryModal">
      <DialogPortal>
        <DialogOverlay class="dialog-overlay" @click="closeSummaryModal" />
        <DialogContent
          class="dialog-content max-h-[85vh] max-w-lg overflow-y-auto"
          @escape-key-down="closeSummaryModal"
        >
          <div class="dialog-header">
            <DialogTitle class="dialog-title">Редактировать конспект</DialogTitle>
            <DialogClose class="icon-btn-close">
              <span class="i-lucide-x" />
            </DialogClose>
          </div>
          <div class="mt-4 max-h-[50vh] overflow-auto rounded-[var(--r)] border border-border bg-fg/3">
            <div class="flex">
              <div class="flex flex-col shrink-0 w-9 py-2.5 pr-2 text-right text-muted text-sm font-mono leading-7 select-none">
                <span v-for="n in summaryLineNumbers" :key="n" class="h-7 flex items-center justify-end">{{ n }}</span>
              </div>
              <textarea
                ref="summaryInputRef"
                v-model="summaryEdit"
                class="flex-1 min-w-0 py-2.5 pl-2 pr-3 text-sm bg-transparent border-0 resize-none font-mono leading-7 focus:outline-none"
                spellcheck="false"
                :rows="summaryLineCount"
                @keydown.ctrl.enter="saveSummary"
              />
            </div>
          </div>
          <div class="flex justify-end pt-4">
            <button type="button" class="btn-primary" @click="saveSummary">Сохранить</button>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  </div>
</template>
