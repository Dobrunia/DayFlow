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
            class="text-xs text-fg-muted whitespace-pre-wrap line-clamp-3"
            v-html="contentHtml"
          />
          <p
            v-if="hasLongContent"
            class="text-xs text-fg-muted mt-0.5"
          >
            <span class="opacity-80">… </span><span class="font-medium">ещё</span>
          </p>
        </div>
        <button
          v-if="hasLongContent"
          type="button"
          @click="showContentModal = true"
          class="btn-icon-muted-fg flex-shrink-0 mt-0.5 card-icon-hover"
          title="Открыть полностью"
        >
          <span class="i-lucide-maximize-2 text-xs" />
        </button>
      </div>
    </div>
    <div v-if="editableSummary" class="mt-1.5 flex items-center gap-1">
      <div class="flex-1 min-w-0">
        <p
          v-if="payload.summary"
          ref="summaryEl"
          class="card-summary italic leading-5"
          v-html="summaryHtml"
        />
        <p v-else class="card-summary-placeholder italic leading-5">
          Конспект...
        </p>
        <p v-if="payload.summary && summaryOverflow" class="text-xs text-fg-muted mt-0.5">
          <span class="opacity-80">… </span><span class="font-medium">ещё</span>
        </p>
      </div>
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

    <DialogRoot v-model:open="showContentModal">
      <DialogPortal>
        <DialogOverlay class="dialog-overlay" @click="showContentModal = false" />
        <DialogContent
          class="dialog-content-scroll max-h-[85vh] max-w-lg"
          @escape-key-down="showContentModal = false"
        >
          <div class="dialog-header">
            <DialogTitle class="dialog-title">Текст заметки</DialogTitle>
            <DialogClose class="dialog-close">
              <span class="i-lucide-x text-fg-muted" />
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
            <button type="button" class="btn-primary" @click="saveSummary">Сохранить</button>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  </div>
</template>
