<script setup lang="ts">
import { computed } from 'vue';
import type { ChecklistPayload } from '@/lib/card-payload';

const props = defineProps<{
  payload: ChecklistPayload;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  toggleItem: [index: number];
}>();

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
  expanded.value ? items.value : items.value.slice(0, showLimit),
);
const hasMore = computed(() => items.value.length > showLimit);
</script>

<template>
  <div class="px-3 pt-1 space-y-2">
    <div v-for="(item, index) in visibleItems" :key="item.id" class="flex items-center gap-2">
      <button
        v-if="!disabled"
        type="button"
        @click="emit('toggleItem', index)"
        class="w-3.5 h-3.5 rounded flex-center border transition-colors shrink-0"
        :class="
          item.done
            ? 'bg-success border-success text-on-primary'
            : 'border-border hover:border-success'
        "
      >
        <span v-if="item.done" class="i-lucide-check text-[10px]" />
      </button>
      <div
        v-else
        class="w-3.5 h-3.5 rounded flex-center border shrink-0"
        :class="item.done ? 'bg-success border-success text-on-primary' : 'border-border'"
      >
        <span v-if="item.done" class="i-lucide-check text-[10px]" />
      </div>
      <span
        class="text-xs text-muted cursor-pointer select-none"
        :class="{ 'line-through opacity-70': item.done }"
        @click="!disabled && emit('toggleItem', index)"
      >
        {{ item.text }}
      </span>
    </div>

    <button
      v-if="hasMore"
      type="button"
      @click="expanded = !expanded"
      class="w-full py-2 border border-dashed border-border rounded-[var(--r)] text-xs text-muted hover:text-fg hover:border-fg/30 transition-colors"
    >
      {{ expanded ? 'Свернуть' : `Ещё ${items.length - showLimit}` }}
    </button>

    <div v-if="progress.total > 0" class="flex items-center gap-2 mt-2">
      <div class="flex-1 h-1.5 bg-fg/10 rounded-full overflow-hidden min-w-0">
        <div
          class="h-full bg-success transition-all rounded-full"
          :style="{ width: `${progressPercent}%` }"
        />
      </div>
      <span class="text-[10px] text-muted shrink-0">
        {{ progress.done }}/{{ progress.total }}
      </span>
    </div>
  </div>
</template>
