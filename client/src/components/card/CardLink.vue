<script setup lang="ts">
import type { LinkPayload } from 'dayflow-shared';

defineProps<{
  title: string | null;
  done: boolean;
  payload: LinkPayload;
}>();

function openUrl(url: string) {
  window.open(url, '_blank');
}
</script>

<template>
  <div class="p-3">
    <a
      v-if="payload.url"
      :href="payload.url"
      target="_blank"
      rel="noopener noreferrer"
      class="text-xs link-primary break-all"
      @click.prevent="openUrl(payload.url)"
    >
      {{ payload.url }}
    </a>
    <p v-if="payload.summary" class="text-xs text-fg-muted mt-1.5">
      {{ payload.summary }}
    </p>
  </div>
</template>
