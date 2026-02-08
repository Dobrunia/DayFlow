<script setup lang="ts">
import { ref, nextTick, computed, watch, onMounted, defineAsyncComponent } from 'vue';
import type { NotePayload } from 'dayflow-shared';
import { linkify, renderMarkdown } from '@/lib/utils';
import { toast } from 'vue-sonner';

// Lazy load editor modal (includes CodeMirror ~500kB)
const SummaryEditorModal = defineAsyncComponent(() => import('./SummaryEditorModal.vue'));
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogClose,
} from 'radix-vue';

const copied = ref(false);
function copyContent() {
  navigator.clipboard.writeText(props.payload.content ?? '').then(() => {
    copied.value = true;
    toast.success('Текст скопирован');
    setTimeout(() => { copied.value = false; }, 2000);
  });
}

const props = defineProps<{
  title: string | null;
  done: boolean;
  payload: NotePayload;
  editableSummary?: boolean;
}>();

const emit = defineEmits<{
  updateSummary: [value: string];
}>();

const showContentModal = ref(false);
const showSummaryModal = ref(false);
const summaryEl = ref<HTMLParagraphElement | null>(null);
const summaryOverflow = ref(false);

const contentHtml = computed(() => linkify(props.payload.content ?? ''));
const summaryHtml = computed(() => renderMarkdown(props.payload.summary ?? ''));
const hasLongContent = computed(() => (props.payload.content?.length ?? 0) > 100);

function checkSummaryOverflow() {
  const el = summaryEl.value;
  summaryOverflow.value = !!(el && el.scrollHeight > el.clientHeight);
}
onMounted(checkSummaryOverflow);
watch([summaryEl, () => props.payload.summary], () => nextTick(checkSummaryOverflow));
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
        <div
          v-if="payload.summary"
          ref="summaryEl"
          class="text-xs text-muted/80 leading-5 max-h-[200px] overflow-y-auto scrollbar-hide markdown-body"
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
        @click="showSummaryModal = true"
        class="icon-btn-edit shrink-0 opacity-0 group-hover:opacity-100"
        title="Редактировать конспект"
      >
        <span class="i-lucide-edit-2" />
      </button>
    </div>
    <template v-else-if="payload.summary">
      <div class="mt-3 pt-2 border-t border-border/50">
        <div class="text-xs text-muted/80 pl-2 border-l-2 border-primary/40 max-h-[400px] overflow-y-auto scrollbar-hide markdown-body" v-html="summaryHtml"></div>
      </div>
    </template>

    <DialogRoot v-model:open="showContentModal">
      <DialogPortal>
        <DialogOverlay class="dialog-overlay" @click="showContentModal = false" />
        <DialogContent
          :aria-describedby="undefined"
          class="dialog-content max-h-[85vh] max-w-lg overflow-y-auto"
          @escape-key-down="showContentModal = false"
        >
          <div class="dialog-header">
            <DialogTitle class="dialog-title">Текст заметки</DialogTitle>
            <div class="flex items-center gap-1">
              <button
                type="button"
                class="icon-btn-ghost transition-colors"
                :class="copied && 'text-success!'"
                title="Скопировать текст"
                @click="copyContent"
              >
                <span v-if="copied" class="i-lucide-check" />
                <span v-else class="i-lucide-copy" />
              </button>
              <DialogClose class="icon-btn-close">
                <span class="i-lucide-x" />
              </DialogClose>
            </div>
          </div>
          <div
            class="text-sm text-fg whitespace-pre-wrap break-words mt-2"
            v-html="contentHtml"
          />
        </DialogContent>
      </DialogPortal>
    </DialogRoot>

    <SummaryEditorModal
      :open="showSummaryModal"
      :model-value="payload.summary ?? ''"
      @update:model-value="emit('updateSummary', $event)"
      @close="showSummaryModal = false"
    />
  </div>
</template>
