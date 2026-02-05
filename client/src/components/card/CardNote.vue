<script setup lang="ts">
import { ref, nextTick, computed, watch, onMounted } from 'vue';
import type { NotePayload } from 'dayflow-shared';
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
  payload: NotePayload;
  editableSummary?: boolean;
}>();

const emit = defineEmits<{
  updateSummary: [value: string];
}>();

const summaryEdit = ref('');
const summaryInputRef = ref<HTMLTextAreaElement | null>(null);
const showContentModal = ref(false);
const showSummaryModal = ref(false);
const summaryEl = ref<HTMLParagraphElement | null>(null);
const summaryOverflow = ref(false);

const contentHtml = computed(() => linkify(props.payload.content ?? ''));
const summaryHtml = computed(() => linkify(props.payload.summary ?? ''));
const hasLongContent = computed(() => (props.payload.content?.length ?? 0) > 100);

function checkSummaryOverflow() {
  const el = summaryEl.value;
  summaryOverflow.value = !!(el && el.scrollHeight > el.clientHeight);
}
onMounted(checkSummaryOverflow);
watch([summaryEl, () => props.payload.summary], () => nextTick(checkSummaryOverflow));

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
    <div v-if="payload.content" class="mt-2">
      <div class="flex items-start gap-1">
        <div class="flex-1 min-w-0">
          <p
            class="text-xs text-muted whitespace-pre-wrap line-clamp-3"
            v-html="contentHtml"
          />
          <p
            v-if="hasLongContent"
            class="text-xs text-muted mt-0.5"
          >
            <span class="opacity-80">… </span><span class="font-medium">ещё</span>
          </p>
        </div>
        <button
          v-if="hasLongContent"
          type="button"
          @click="showContentModal = true"
          class="icon-btn-ghost shrink-0 opacity-0 group-hover:opacity-100"
          title="Открыть полностью"
        >
          <span class="i-lucide-maximize-2" />
        </button>
      </div>
    </div>
    <div v-if="editableSummary" class="mt-3 pt-2 border-t border-border/50 flex items-center gap-1">
      <div class="flex-1 min-w-0 pl-2 border-l-2 border-primary/40">
        <p
          v-if="payload.summary"
          ref="summaryEl"
          class="text-xs text-muted/90 italic leading-5 max-h-[200px] overflow-y-auto scrollbar-hide whitespace-pre-wrap"
          v-html="summaryHtml"
        />
        <p v-else class="text-xs text-muted/50 italic leading-5">
          Конспект...
        </p>
        <p v-if="payload.summary && summaryOverflow" class="text-xs text-muted mt-0.5">
          <span class="opacity-80">… </span><span class="font-medium">ещё</span>
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
      <div class="mt-3 pt-2 border-t border-border/50">
        <p class="text-xs text-muted/90 italic pl-2 border-l-2 border-primary/40 whitespace-pre-wrap max-h-[400px] overflow-y-auto scrollbar-hide" v-html="summaryHtml"></p>
      </div>
    </template>

    <DialogRoot v-model:open="showContentModal">
      <DialogPortal>
        <DialogOverlay class="dialog-overlay" @click="showContentModal = false" />
        <DialogContent
          class="dialog-content max-h-[85vh] max-w-lg overflow-y-auto"
          @escape-key-down="showContentModal = false"
        >
          <div class="dialog-header">
            <DialogTitle class="dialog-title">Текст заметки</DialogTitle>
            <DialogClose class="icon-btn-close">
              <span class="i-lucide-x" />
            </DialogClose>
          </div>
          <div
            class="text-sm text-fg whitespace-pre-wrap break-words mt-2"
            v-html="contentHtml"
          />
        </DialogContent>
      </DialogPortal>
    </DialogRoot>

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
