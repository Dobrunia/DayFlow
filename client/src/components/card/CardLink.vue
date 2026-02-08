<script setup lang="ts">
import { ref, computed, defineAsyncComponent } from 'vue';
import type { LinkPayload } from 'dayflow-shared';
import { renderMarkdown } from '@/lib/utils';

// Lazy load editor modal (includes CodeMirror ~500kB)
const SummaryEditorModal = defineAsyncComponent(() => import('./SummaryEditorModal.vue'));

const props = defineProps<{
  title: string | null;
  done: boolean;
  payload: LinkPayload;
  editableSummary?: boolean;
}>();

const emit = defineEmits<{
  updateSummary: [value: string];
}>();

const showSummaryModal = ref(false);
const summaryHtml = computed(() => renderMarkdown(props.payload.summary ?? ''));
</script>

<template>
  <div class="p-3">
    <div v-if="editableSummary" class="mt-2 flex items-center gap-1">
      <div class="flex-1 min-w-0 pl-2 border-l-2 border-primary/40">
        <div
          v-if="payload.summary"
          class="text-xs text-muted/80 max-h-[200px] overflow-y-auto scrollbar-hide markdown-body"
          v-html="summaryHtml"
        />
        <p v-else class="text-xs text-muted/50 italic">
          Конспект...
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
      <div class="text-xs text-muted/80 mt-2 pl-2 border-l-2 border-primary/40 max-h-[400px] overflow-y-auto scrollbar-hide markdown-body" v-html="summaryHtml"></div>
    </template>
    <template v-else>
      <p class="text-xs text-muted/50 italic mt-2 pl-2 border-l-2 border-primary/40">Конспект...</p>
    </template>

    <SummaryEditorModal
      :open="showSummaryModal"
      :model-value="payload.summary ?? ''"
      @update:model-value="emit('updateSummary', $event)"
      @close="showSummaryModal = false"
    />
  </div>
</template>
