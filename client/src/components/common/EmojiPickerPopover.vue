<script setup lang="ts">
import { WORKSPACE_EMOJIS } from '@/lib/workspace-emojis';
import { PopoverRoot, PopoverTrigger, PopoverPortal, PopoverContent } from 'radix-vue';

defineProps<{
  modelValue?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

import { ref } from 'vue';
const open = ref(false);

function select(emoji: string) {
  emit('update:modelValue', emoji);
  open.value = false;
}
</script>

<template>
  <PopoverRoot v-model:open="open">
    <PopoverTrigger as-child>
      <slot :value="modelValue">
        <button
          type="button"
          class="w-9 h-9 rounded-[var(--r)] flex-center text-lg bg-surface border border-border hover:bg-fg/5 transition-colors"
        >
          {{ modelValue || '😀' }}
        </button>
      </slot>
    </PopoverTrigger>
    <PopoverPortal>
      <PopoverContent
        class="z-50 p-2 card w-64 grid grid-cols-6 gap-1 max-h-48 overflow-y-auto scrollbar-hide shadow-lg border border-border bg-surface origin-top-left"
        :side-offset="5"
        align="start"
      >
        <button
          v-for="emoji in WORKSPACE_EMOJIS"
          :key="emoji"
          type="button"
          class="w-8 h-8 rounded flex-center text-lg hover:bg-fg/10 transition-colors"
          @click="select(emoji)"
        >
          {{ emoji }}
        </button>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
