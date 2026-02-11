<script setup lang="ts">
import type { Workspace } from '@/graphql/types';

defineProps<{
  workspace: Workspace;
  shared?: boolean;
}>();

defineEmits<{
  click: [];
  togglePinned: [e: Event];
}>();

const STAR_PATH =
  'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z';
</script>

<template>
  <div
    class="card-hover text-left p-5 group relative cursor-pointer border-l-3"
    :class="shared ? 'border-primary/30' : 'border-transparent'"
    @click="$emit('click')"
  >
    <!-- Pin / Unpin button -->
    <button
      v-if="workspace.pinned"
      type="button"
      class="absolute top-3 right-3 icon-btn-ghost text-yellow-500 group/star"
      title="Открепить"
      @click="$emit('togglePinned', $event)"
    >
      <svg
        class="w-[18px] h-[18px] group-hover/star:opacity-0 absolute"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path :d="STAR_PATH" />
      </svg>
      <span class="i-lucide-star-off opacity-0 group-hover/star:opacity-100" />
    </button>
    <button
      v-else
      type="button"
      class="absolute top-3 right-3 icon-btn-ghost opacity-0 group-hover:opacity-100 transition-opacity text-muted hover:text-yellow-500"
      title="Закрепить"
      @click="$emit('togglePinned', $event)"
    >
      <svg class="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor">
        <path :d="STAR_PATH" />
      </svg>
    </button>

    <!-- Icon -->
    <div
      class="w-10 h-10 rounded-xl flex-center mb-3 text-2xl transition-colors bg-fg/5 group-hover:bg-fg/8"
    >
      <span v-if="workspace.icon">{{ workspace.icon }}</span>
      <span v-else class="i-lucide-layout-grid text-lg text-muted" />
    </div>

    <!-- Title -->
    <h3 :title="workspace.title" class="font-semibold text-fg mb-1.5 truncate text-base">
      {{ workspace.title }}
    </h3>

    <!-- Description -->
    <p v-if="workspace.description" class="text-sm text-muted line-clamp-2 mb-3">
      {{ workspace.description }}
    </p>

    <!-- Footer: owner email for shared, date for own -->
    <div v-if="shared" class="flex items-center gap-2 text-xs text-muted">
      <span class="i-lucide-user text-[10px]" />
      <span>{{ workspace.owner?.email }}</span>
    </div>
    <p v-else class="text-xs text-muted">
      {{ new Date(workspace.updatedAt).toLocaleDateString('ru-RU') }}
    </p>
  </div>
</template>
