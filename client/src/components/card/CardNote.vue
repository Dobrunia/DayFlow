<script setup lang="ts">
import type { NotePayload } from 'dayflow-shared';

defineProps<{
  title: string | null;
  done: boolean;
  payload: NotePayload;
}>();

const expanded = defineModel<boolean>('expanded', { default: false });
</script>

<template>
  <div class="p-3">
    <div v-if="payload.content" class="mt-2">
      <p class="text-xs text-fg-muted whitespace-pre-wrap" :class="expanded ? '' : 'line-clamp-3'">
        {{ payload.content }}
      </p>
      <button
        v-if="payload.content && payload.content.length > 100"
        type="button"
        @click="expanded = !expanded"
        class="text-xs link-primary mt-1"
      >
        {{ expanded ? 'Свернуть' : 'Развернуть' }}
      </button>
    </div>
    <p v-if="payload.summary" class="text-xs text-fg-muted mt-1.5 italic">
      {{ payload.summary }}
    </p>
  </div>
</template>
