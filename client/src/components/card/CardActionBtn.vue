<script setup lang="ts">
defineProps<{
  icon: string;
  title: string;
  active?: boolean;
  activeIcon?: string;
}>();

defineEmits<{
  (e: 'click'): void;
}>();
</script>

<template>
  <button
    type="button"
    class="w-7 h-7 shrink-0 inline-flex items-center justify-center rounded-[calc(var(--r)-2px)] text-muted hover:text-fg hover:bg-fg/6 transition-colors duration-150 card-action"
    :class="active && 'text-success! opacity-100!'"
    :title="title"
    @click.stop="$emit('click')"
  >
    <span :class="active && activeIcon ? activeIcon : icon" />
  </button>
</template>
