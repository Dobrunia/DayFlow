<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useWorkspaceStore } from '@/stores/workspace';
import CreateWorkspaceDialog from '@/components/workspace/CreateWorkspaceDialog.vue';
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
    (w: Workspace) => w.title?.toLowerCase().includes(q) || w.description?.toLowerCase().includes(q)
  );
});

const pinnedWorkspaces = computed(() => filteredWorkspaces.value.filter((w) => w.pinned));
const unpinnedWorkspaces = computed(() => filteredWorkspaces.value.filter((w) => !w.pinned));

const canCreateWorkspace = computed(() => workspaceStore.workspaces.length < 20);

watch(
  () => authStore.user,
  (u) => {
    if (u && workspaceStore.workspaces.length === 0) workspaceStore.fetchWorkspaces();
  },
  { immediate: true }
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
          <h1 class="page-title">Мои воркспейсы</h1>
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
        <!-- Pinned -->
        <template v-if="pinnedWorkspaces.length > 0">
          <h2 class="text-sm font-medium text-muted mb-3 flex items-center gap-1.5">
            <svg class="w-4 h-4 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              />
            </svg>
            <span>Закреплённые</span>
          </h2>
          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div
              v-for="workspace in pinnedWorkspaces"
              :key="workspace.id"
              @click="navigateToWorkspace(workspace.id)"
              class="card-hover text-left p-5 group relative cursor-pointer"
            >
              <button
                type="button"
                class="absolute top-3 right-3 icon-btn-ghost text-yellow-500 group/star"
                title="Открепить"
                @click="togglePinned($event, workspace.id)"
              >
                <svg
                  class="w-[18px] h-[18px] group-hover/star:opacity-0 absolute"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                  />
                </svg>
                <span class="i-lucide-star-off opacity-0 group-hover/star:opacity-100" />
              </button>
              <div
                class="w-10 h-10 rounded-xl flex-center mb-3 text-2xl transition-colors bg-fg/5 group-hover:bg-fg/8"
              >
                <span v-if="workspace.icon">{{ workspace.icon }}</span>
                <span v-else class="i-lucide-layout-grid text-lg text-muted" />
              </div>
              <h3 :title="workspace.title" class="font-semibold text-fg mb-1.5 truncate text-base">
                {{ workspace.title }}
              </h3>
              <p v-if="workspace.description" class="text-sm text-muted line-clamp-2 mb-3">
                {{ workspace.description }}
              </p>
              <p class="text-xs text-muted">
                {{ new Date(workspace.updatedAt).toLocaleDateString('ru-RU') }}
              </p>
            </div>
          </div>
          <hr class="border-border my-10" />
        </template>

        <!-- Unpinned -->
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div
            v-for="workspace in unpinnedWorkspaces"
            :key="workspace.id"
            @click="navigateToWorkspace(workspace.id)"
            class="card-hover text-left p-5 group relative cursor-pointer"
          >
            <button
              type="button"
              class="absolute top-3 right-3 icon-btn-ghost opacity-0 group-hover:opacity-100 transition-opacity text-muted hover:text-yellow-500"
              title="Закрепить"
              @click="togglePinned($event, workspace.id)"
            >
              <svg class="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                />
              </svg>
            </button>
            <div
              class="w-10 h-10 rounded-xl flex-center mb-3 text-2xl transition-colors bg-fg/5 group-hover:bg-fg/8"
            >
              <span v-if="workspace.icon">{{ workspace.icon }}</span>
              <span v-else class="i-lucide-layout-grid text-lg text-muted" />
            </div>
            <h3 :title="workspace.title" class="font-semibold text-fg mb-1.5 truncate text-base">
              {{ workspace.title }}
            </h3>
            <p v-if="workspace.description" class="text-sm text-muted line-clamp-2 mb-3">
              {{ workspace.description }}
            </p>
            <p class="text-xs text-muted">
              {{ new Date(workspace.updatedAt).toLocaleDateString('ru-RU') }}
            </p>
          </div>

          <template v-if="filteredWorkspaces.length === 0 && workspaceSearch.trim()">
            <p class="col-span-full text-sm text-muted py-4">По запросу ничего не найдено</p>
          </template>
        </div>
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
