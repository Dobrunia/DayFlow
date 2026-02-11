<script setup lang="ts">
import { ref, computed } from 'vue';
import type { NotePayload } from '@/lib/card-payload';
import { linkify } from '@/lib/utils';
import { toast } from 'vue-sonner';
import CardActionBtn from './CardActionBtn.vue';
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogClose,
} from 'radix-vue';

const props = defineProps<{
  payload: NotePayload;
}>();

const showContentModal = ref(false);
const copied = ref(false);

const contentHtml = computed(() => linkify(props.payload.content ?? ''));
const hasLongContent = computed(() => (props.payload.content?.length ?? 0) > 100);

function copyContent() {
  navigator.clipboard.writeText(props.payload.content ?? '').then(() => {
    copied.value = true;
    toast.success('Текст скопирован');
    setTimeout(() => (copied.value = false), 2000);
  });
}
</script>

<template>
  <div v-if="payload.content" class="px-3 mt-2">
    <div class="flex items-start gap-1">
      <div class="flex-1 min-w-0">
        <p class="text-xs text-muted whitespace-pre-wrap line-clamp-3" v-html="contentHtml" />
        <p v-if="hasLongContent" class="text-xs text-muted mt-0.5">
          <span class="opacity-80">…</span>
        </p>
      </div>
      <CardActionBtn
        v-if="hasLongContent"
        icon="i-lucide-maximize-2"
        title="Открыть полностью"
        @click="showContentModal = true"
      />
    </div>

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
          <div class="text-sm text-fg whitespace-pre-wrap break-words mt-2" v-html="contentHtml" />
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  </div>
</template>
