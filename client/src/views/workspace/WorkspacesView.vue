<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useWorkspaceStore } from '@/stores/workspace';
import CreateWorkspaceDialog from '@/components/workspace/CreateWorkspaceDialog.vue';
import WorkspaceCard from '@/components/workspace/WorkspaceCard.vue';
import SearchInput from '@/components/common/SearchInput.vue';
import type { Workspace } from '@/graphql/types';

const router = useRouter();
const authStore = useAuthStore();
const workspaceStore = useWorkspaceStore();

const isAuthenticated = computed(() => !!authStore.user);

const workspaceSearch = ref('');
const showCreateDialog = ref(false);

const filteredWorkspaces = computed(() => {
  const list = workspaceStore.workspaces;
  const q = workspaceSearch.value.trim().toLowerCase();
  if (!q) return list;
  return list.filter(
    (w: Workspace) =>
      w.title?.toLowerCase().includes(q) || w.description?.toLowerCase().includes(q),
  );
});

const myWorkspaces = computed(() =>
  filteredWorkspaces.value.filter((w) => w.owner?.id === authStore.user?.id),
);
const sharedWorkspaces = computed(() =>
  filteredWorkspaces.value.filter((w) => w.owner?.id && w.owner.id !== authStore.user?.id),
);

const pinnedOwn = computed(() => myWorkspaces.value.filter((w) => w.pinned));
const unpinnedOwn = computed(() => myWorkspaces.value.filter((w) => !w.pinned));
const pinnedShared = computed(() => sharedWorkspaces.value.filter((w) => w.pinned));
const unpinnedShared = computed(() => sharedWorkspaces.value.filter((w) => !w.pinned));

// All pinned (own + shared) for the top section
const allPinned = computed(() => [...pinnedOwn.value, ...pinnedShared.value]);

const canCreateWorkspace = computed(() => myWorkspaces.value.length < 20);

watch(
  () => authStore.user,
  (u) => {
    if (u && workspaceStore.workspaces.length === 0) workspaceStore.fetchWorkspaces();
  },
  { immediate: true },
);

function navigateToWorkspace(id: string) {
  router.push(`/workspace/${id}`);
}

function handleWorkspaceCreated() {
  showCreateDialog.value = false;
}

function togglePinned(e: Event, id: string) {
  e.stopPropagation();
  workspaceStore.toggleWorkspacePinned(id);
}
</script>

<template>
  <div class="page-container">
    <!-- Hero for non-authenticated users -->
    <template v-if="!isAuthenticated">
      <div class="text-center py-24">
        <h1 class="text-4xl font-bold text-fg mb-3 tracking-tight">Организуй свои знания</h1>
        <p class="text-lg text-muted mb-10 max-w-xl mx-auto leading-relaxed">
          Воркспейсы для тем и быстрый сбор идей в одном месте.
        </p>
        <RouterLink to="/auth" class="btn-primary"> Начать бесплатно </RouterLink>
      </div>

      <!-- Features -->
      <div class="grid md:grid-cols-3 gap-6 mt-20">
        <div class="text-center p-6 rounded-2xl border border-border bg-fg/3">
          <h3 class="font-semibold text-fg mb-1.5">Воркспейсы</h3>
          <p class="text-sm text-muted">Доски с видео, заметками и чеклистами для тем.</p>
        </div>
        <div class="text-center p-6 rounded-2xl border border-border bg-fg/3">
          <h3 class="font-semibold text-fg mb-1.5">Быстрое добавление</h3>
          <p class="text-sm text-muted">Ссылки и идеи в один клик.</p>
        </div>
        <div class="text-center p-6 rounded-2xl border border-border bg-fg/3">
          <h3 class="font-semibold text-fg mb-1.5">Трекинг прогресса</h3>
          <p class="text-sm text-muted">Отмечайте выполненное и смотрите прогресс.</p>
        </div>
      </div>
    </template>

    <!-- Dashboard for authenticated users -->
    <template v-else>
      <div class="flex flex-wrap items-end justify-between gap-4 mb-8 cursor-default">
        <div>
          <h1 class="page-title">Воркспейсы</h1>
          <p class="page-desc">Доски для тем и проектов</p>
        </div>
        <div v-if="workspaceStore.workspaces.length > 0" class="flex items-center gap-3">
          <SearchInput
            v-model="workspaceSearch"
            placeholder="Поиск воркспейсов..."
            class="w-full min-w-0 sm:w-64 shrink-0"
          />
          <button
            v-if="canCreateWorkspace"
            class="btn-ghost shrink-0"
            @click="showCreateDialog = true"
          >
            <span class="i-lucide-plus" />
            Новый воркспейс
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="workspaceStore.loading" class="flex-center py-16">
        <span class="i-lucide-loader-2 animate-spin text-2xl text-muted" />
      </div>

      <!-- Workspaces Grid -->
      <template v-else-if="workspaceStore.workspaces.length > 0">
        <!-- ── Pinned (own + shared) ─────────────────────────────────── -->
        <template v-if="allPinned.length > 0">
          <h2 class="text-sm font-medium text-muted mb-3 flex items-center gap-1.5">
            <svg class="w-4 h-4 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              />
            </svg>
            <span>Закреплённые</span>
          </h2>
          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            <WorkspaceCard
              v-for="ws in allPinned"
              :key="ws.id"
              :workspace="ws"
              :shared="ws.owner?.id !== authStore.user?.id"
              @click="navigateToWorkspace(ws.id)"
              @toggle-pinned="togglePinned($event, ws.id)"
            />
          </div>
          <hr class="border-border my-10" />
        </template>

        <!-- ── My workspaces: Unpinned ───────────────────────────────── -->
        <template v-if="unpinnedOwn.length > 0">
          <h2
            v-if="allPinned.length > 0 || sharedWorkspaces.length > 0"
            class="text-sm font-medium text-muted mb-3 flex items-center gap-1.5"
          >
            <span class="i-lucide-folder" />
            <span>Мои</span>
          </h2>
          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            <WorkspaceCard
              v-for="ws in unpinnedOwn"
              :key="ws.id"
              :workspace="ws"
              @click="navigateToWorkspace(ws.id)"
              @toggle-pinned="togglePinned($event, ws.id)"
            />
          </div>
        </template>

        <!-- ── Shared workspaces: Unpinned ───────────────────────────── -->
        <template v-if="unpinnedShared.length > 0">
          <hr v-if="unpinnedOwn.length > 0 || allPinned.length > 0" class="border-border my-10" />
          <h2 class="text-sm font-medium text-muted mb-3 flex items-center gap-1.5">
            <span class="i-lucide-users" />
            <span>Доступные мне</span>
          </h2>
          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            <WorkspaceCard
              v-for="ws in unpinnedShared"
              :key="ws.id"
              :workspace="ws"
              shared
              @click="navigateToWorkspace(ws.id)"
              @toggle-pinned="togglePinned($event, ws.id)"
            />
          </div>
        </template>

        <template v-if="filteredWorkspaces.length === 0 && workspaceSearch.trim()">
          <p class="text-sm text-muted py-4">По запросу ничего не найдено</p>
        </template>
      </template>

      <!-- Empty State -->
      <div v-else class="text-center py-16 flex flex-col items-center gap-4">
        <div class="w-16 h-16 rounded-full bg-fg/5 flex-center">
          <span class="i-lucide-folder text-2xl text-muted" />
        </div>
        <h2 class="text-lg font-semibold text-fg">Нет воркспейсов</h2>
        <p class="text-sm text-muted">Создайте первый воркспейс для изучения новой темы</p>
        <button class="btn-primary" @click="showCreateDialog = true">
          <span class="i-lucide-plus" />
          <span>Создать воркспейс</span>
        </button>
      </div>
    </template>

    <!-- Create Workspace Dialog -->
    <CreateWorkspaceDialog
      :open="showCreateDialog"
      @close="showCreateDialog = false"
      @created="handleWorkspaceCreated"
    />
  </div>
</template>
