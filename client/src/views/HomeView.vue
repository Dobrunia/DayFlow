<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useWorkspaceStore } from '@/stores/workspace';
import type { Workspace } from '@/graphql/types';

const router = useRouter();
const authStore = useAuthStore();
const workspaceStore = useWorkspaceStore();

const isAuthenticated = computed(() => !!authStore.user);

const workspaceSearch = ref('');

const filteredWorkspaces = computed(() => {
  const list = workspaceStore.workspaces;
  const q = workspaceSearch.value.trim().toLowerCase();
  if (!q) return list;
  return list.filter(
    (w: Workspace) => w.title?.toLowerCase().includes(q) || w.description?.toLowerCase().includes(q)
  );
});

watch(
  () => authStore.user,
  (u) => {
    if (u) workspaceStore.fetchWorkspaces();
  },
  { immediate: true }
);

function navigateToWorkspace(id: string) {
  router.push(`/workspace/${id}`);
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
        <div
          v-if="workspaceStore.workspaces.length > 0"
          class="relative w-full min-w-0 sm:w-64 shrink-0"
        >
          <span
            class="absolute left-3 top-1/2 -translate-y-1/2 i-lucide-search text-muted pointer-events-none"
          />
          <input
            v-model="workspaceSearch"
            type="search"
            class="input w-full py-2 pl-9"
            placeholder="Поиск воркспейсов..."
          />
        </div>
      </div>

      <!-- Loading -->
      <div v-if="workspaceStore.loading" class="flex-center py-16">
        <span class="i-lucide-loader-2 animate-spin text-2xl text-muted" />
      </div>

      <!-- Workspaces Grid -->
      <div
        v-else-if="workspaceStore.workspaces.length > 0"
        class="grid md:grid-cols-2 lg:grid-cols-3 gap-5"
      >
        <button
          v-for="workspace in filteredWorkspaces"
          :key="workspace.id"
          @click="navigateToWorkspace(workspace.id)"
          class="card-hover text-left p-5 group"
        >
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
        </button>

        <template v-if="filteredWorkspaces.length === 0 && workspaceSearch.trim()">
          <p class="col-span-full text-sm text-muted py-4">По запросу ничего не найдено</p>
        </template>

        <!-- Create New -->
        <button
          @click="$router.push('/workspace/new')"
          class="p-5 border-2 border-dashed border-border rounded-[var(--r)] flex flex-col items-center justify-center text-muted hover:text-fg hover:border-fg/30 transition-colors"
        >
          <span class="w-10 h-10 rounded-xl bg-fg/5 flex-center mb-1">
            <span class="i-lucide-plus text-xl" />
          </span>
          <span class="text-sm font-medium">Новый воркспейс</span>
        </button>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-16 flex flex-col items-center gap-4">
        <div class="w-16 h-16 rounded-full bg-fg/5 flex-center">
          <span class="i-lucide-folder text-2xl text-muted" />
        </div>
        <h2 class="text-lg font-semibold text-fg">Нет воркспейсов</h2>
        <p class="text-sm text-muted">Создайте первый воркспейс для изучения новой темы</p>
        <button class="btn-primary" @click="router.push('/workspace/new')">
          <span class="i-lucide-plus" />
          <span>Создать воркспейс</span>
        </button>
      </div>
    </template>
  </div>
</template>
