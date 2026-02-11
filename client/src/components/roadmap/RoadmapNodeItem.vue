<script setup lang="ts">
import { ref, computed } from 'vue';
import type { RoadmapNode } from '@/graphql/types';

const props = defineProps<{
  node: RoadmapNode;
  depth?: number;
  readOnly?: boolean;
}>();

const emit = defineEmits<{
  (e: 'toggle-done', node: RoadmapNode): void;
  (e: 'edit-node', node: RoadmapNode): void;
  (e: 'add-child', parentId: string): void;
  (e: 'delete-node', id: string): void;
  (e: 'copy-ai-prompt', node: RoadmapNode): void;
}>();

const collapsed = ref(false);
const depth = props.depth ?? 0;

const sortedChildren = computed(() =>
  [...(props.node.children ?? [])].sort((a, b) => a.order - b.order),
);

const hasChildren = computed(() => sortedChildren.value.length > 0);
</script>

<template>
  <div>
    <!-- Node row -->
    <div
      class="group flex items-center gap-2 py-1.5 px-2 rounded-[var(--r)] hover:bg-fg/5 transition-colors cursor-pointer"
      :style="{ paddingLeft: `${depth * 24}px` }"
      @click="hasChildren && (collapsed = !collapsed)"
    >
      <!-- Collapse indicator -->
      <span
        v-if="hasChildren"
        class="shrink-0 w-5 h-5 flex-center text-muted"
      >
        <span
          class="i-lucide-chevron-right transition-transform duration-200 text-xs"
          :class="{ 'rotate-90': !collapsed }"
        />
      </span>
      <span v-else class="w-5" />

      <!-- Checkbox -->
      <input
        type="checkbox"
        :checked="node.done"
        class="checkbox shrink-0"
        :disabled="readOnly"
        @click.stop
        @change="emit('toggle-done', node)"
      />

      <!-- Title -->
      <span
        class="flex-1 text-sm select-none"
        :class="node.done ? 'line-through text-muted' : 'text-fg'"
        @dblclick="!readOnly && emit('edit-node', node)"
      >
        {{ node.title }}
      </span>

      <!-- Actions (hover) -->
      <div v-if="!readOnly" class="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" @click.stop>
        <button class="icon-btn-ghost !p-1" title="Промпт для AI" @click="emit('copy-ai-prompt', node)">
          <span class="i-lucide-sparkles text-xs" />
        </button>
        <button class="icon-btn-ghost !p-1" title="Редактировать" @click="emit('edit-node', node)">
          <span class="i-lucide-pencil text-xs" />
        </button>
        <button
          class="icon-btn-ghost !p-1"
          title="Добавить подузел"
          @click="emit('add-child', node.id)"
        >
          <span class="i-lucide-plus text-xs" />
        </button>
        <button class="icon-btn-danger !p-1" title="Удалить" @click="emit('delete-node', node.id)">
          <span class="i-lucide-trash-2 text-xs" />
        </button>
      </div>
    </div>

    <!-- Children (recursive) -->
    <template v-if="hasChildren && !collapsed">
      <RoadmapNodeItem
        v-for="child in sortedChildren"
        :key="child.id"
        :node="child"
        :depth="depth + 1"
        :read-only="readOnly"
        @toggle-done="emit('toggle-done', $event)"
        @edit-node="emit('edit-node', $event)"
        @add-child="emit('add-child', $event)"
        @delete-node="emit('delete-node', $event)"
        @copy-ai-prompt="emit('copy-ai-prompt', $event)"
      />
    </template>
  </div>
</template>
