<script setup lang="ts">
import { computed, ref, inject, type Ref, type ComputedRef } from 'vue';
import { useWorkspaceStore } from '@/stores/workspace';
import { LIMITS } from 'dayflow-shared';
import WorkspaceColumn from '@/components/workspace/WorkspaceColumn.vue';
import { toast } from 'vue-sonner';
import { getGraphQLErrorMessage } from '@/lib/graphql-error';
import type { Column } from '@/graphql/types';

const workspaceStore = useWorkspaceStore();

const columnsContainer = ref<HTMLElement | null>(null);
const cardSearch = inject<Ref<string>>('cardSearch', ref(''));
const isReadOnly = inject<ComputedRef<boolean>>('isReadOnly', computed(() => false));

function handleWheel(e: WheelEvent) {
  const target = e.target as HTMLElement;
  const scrollableParent = target.closest('.overflow-y-auto, .overflow-auto');
  if (scrollableParent && scrollableParent !== columnsContainer.value) return;
  if (!columnsContainer.value || e.deltaY === 0) return;
  e.preventDefault();
  columnsContainer.value.scrollLeft += e.deltaY;
}

const workspace = computed(() => workspaceStore.currentWorkspace);
const columns = computed(() => workspace.value?.columns ?? []);
const backlogCards = computed(() => workspace.value?.backlog ?? []);

const backlogColumn = computed(
  () =>
    ({
      id: 'backlog',
      title: 'Беклог',
      order: -1,
      cards: [] as never[],
    }) as unknown as Column,
);

async function addColumn() {
  if (!workspace.value) return;
  try {
    await workspaceStore.createColumn(workspace.value.id, 'Новая колонка');
  } catch (e) {
    toast.error(getGraphQLErrorMessage(e));
  }
}
</script>

<template>
  <template v-if="workspace">
    <!-- Backlog + Columns -->
    <div
      ref="columnsContainer"
      class="flex-1 overflow-x-auto overflow-y-hidden workspace-scroll"
      @wheel="handleWheel"
    >
      <div class="h-full flex gap-4 px-6 pb-6" style="min-width: max-content">
        <WorkspaceColumn
          :column="backlogColumn"
          :workspace-id="workspace.id"
          :backlog-cards="backlogCards"
          :is-backlog-column="true"
          :search-query="cardSearch"
          :read-only="isReadOnly"
        />

        <WorkspaceColumn
          v-for="(column, idx) in columns"
          :key="column.id"
          :is-first="idx === 0"
          :is-last="idx === columns.length - 1"
          :column="column"
          :workspace-id="workspace.id"
          :search-query="cardSearch"
          :read-only="isReadOnly"
        />

        <!-- Add Column Button -->
        <button
          v-if="!isReadOnly && columns.length < LIMITS.MAX_COLUMNS_PER_WORKSPACE"
          @click="addColumn"
          class="shrink-0 w-72 h-32 border-2 border-dashed border-border rounded-[var(--r)] flex-center flex-col gap-2 text-muted hover:text-fg hover:border-fg/30 transition-colors"
        >
          <span class="i-lucide-plus text-xl" />
          <span class="text-sm">Добавить колонку</span>
        </button>
      </div>
    </div>
  </template>
</template>

<style scoped>
.workspace-scroll::-webkit-scrollbar {
  height: 10px;
}

.workspace-scroll::-webkit-scrollbar-track {
  background: rgb(var(--fg) / 0.05);
  border-radius: 5px;
  margin: 0 24px;
}

.workspace-scroll::-webkit-scrollbar-thumb {
  background: rgb(var(--fg) / 0.2);
  border-radius: 5px;
}

.workspace-scroll::-webkit-scrollbar-thumb:hover {
  background: rgb(var(--fg) / 0.3);
}

.workspace-scroll {
  scrollbar-width: auto;
  scrollbar-color: rgb(var(--fg) / 0.2) rgb(var(--fg) / 0.05);
}
</style>
