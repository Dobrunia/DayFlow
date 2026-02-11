<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { ALL_TOOLS_QUERY } from '@/graphql/queries';
import type { Tool, Workspace } from '@/graphql/types';
import ToolItem from '@/components/toolbox/ToolItem.vue';
import SearchInput from '@/components/common/SearchInput.vue';

type ToolWithWorkspace = Tool & { workspace?: Pick<Workspace, 'id' | 'title' | 'icon'> | null };

const { result, loading } = useQuery(ALL_TOOLS_QUERY);

const search = ref('');

const allTools = computed(() => (result.value?.allTools ?? []) as ToolWithWorkspace[]);

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return allTools.value;
  return allTools.value.filter(
    (t) => t.title.toLowerCase().includes(q) || t.tags.some((tag) => tag.toLowerCase().includes(q))
  );
});

// Group: hub tools (no workspace) + per workspace
const hubTools = computed(() => filtered.value.filter((t) => !t.workspaceId));

interface WsGroup {
  workspace: { id: string; title: string; icon?: string | null };
  tools: ToolWithWorkspace[];
}

const workspaceTools = computed(() => {
  const map = new Map<string, WsGroup>();
  for (const t of filtered.value) {
    if (!t.workspaceId || !t.workspace) continue;
    let group = map.get(t.workspaceId);
    if (!group) {
      group = { workspace: t.workspace, tools: [] };
      map.set(t.workspaceId, group);
    }
    group.tools.push(t);
  }
  return [...map.values()];
});

const collapsed = reactive(new Set<string>());

function toggleCollapse(id: string) {
  collapsed.has(id) ? collapsed.delete(id) : collapsed.add(id);
}
</script>

<template>
  <div class="page-container max-w-5xl mx-auto py-8 px-4">
    <h1 class="text-2xl font-bold mb-6 flex items-center gap-2">
      <span class="i-lucide-box text-muted" />
      Инструменты
    </h1>

    <!-- Search -->
    <SearchInput
      v-model="search"
      placeholder="Поиск по названию или тегу…"
      class="mb-6"
    />

    <div v-if="loading && allTools.length === 0" class="flex-center py-12">
      <span class="i-lucide-loader-2 animate-spin text-2xl text-muted" />
    </div>

    <div v-else-if="filtered.length === 0" class="text-center py-12 text-muted">
      {{ search ? 'Ничего не найдено' : 'У вас пока нет инструментов' }}
    </div>

    <div v-else class="space-y-8">
      <!-- Hub -->
      <section v-if="hubTools.length > 0">
        <button
          type="button"
          class="w-full text-lg font-semibold mb-3 flex items-center gap-2 cursor-pointer select-none hover:(text-primary bg-fg/5) rounded-[var(--r)] px-2 -mx-2 py-1.5 transition-colors"
          @click="toggleCollapse('hub')"
        >
          <span
            class="i-lucide-chevron-right text-muted transition-transform duration-200"
            :class="{ 'rotate-90': !collapsed.has('hub') }"
          />
          <span class="i-lucide-inbox text-muted" />
          Хаб
          <span class="text-sm font-normal text-muted ml-1">({{ hubTools.length }})</span>
        </button>
        <div v-show="!collapsed.has('hub')" class="grid gap-2">
          <ToolItem v-for="tool in hubTools" :key="tool.id" :tool="tool" />
        </div>
      </section>

      <!-- Workspaces -->
      <section v-for="wsGroup in workspaceTools" :key="wsGroup.workspace.id">
        <button
          type="button"
          class="w-full text-lg font-semibold mb-3 flex items-center gap-2 cursor-pointer select-none hover:(text-primary bg-fg/5) rounded-[var(--r)] px-2 -mx-2 py-1.5 transition-colors"
          @click="toggleCollapse(wsGroup.workspace.id)"
        >
          <span
            class="i-lucide-chevron-right text-muted transition-transform duration-200"
            :class="{ 'rotate-90': !collapsed.has(wsGroup.workspace.id) }"
          />
          <span v-if="wsGroup.workspace.icon" class="text-xl">{{ wsGroup.workspace.icon }}</span>
          <span v-else class="i-lucide-layout-grid text-muted" />
          {{ wsGroup.workspace.title }}
          <span class="text-sm font-normal text-muted ml-1">({{ wsGroup.tools.length }})</span>
        </button>
        <div v-show="!collapsed.has(wsGroup.workspace.id)" class="grid gap-2">
          <ToolItem
            v-for="tool in wsGroup.tools"
            :key="tool.id"
            :tool="tool"
            :workspace-id="wsGroup.workspace.id"
          />
        </div>
      </section>
    </div>
  </div>
</template>
