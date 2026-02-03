<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useWorkspaceStore } from '@/stores/workspace';

const router = useRouter();
const authStore = useAuthStore();
const workspaceStore = useWorkspaceStore();

const isAuthenticated = computed(() => !!authStore.user);

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
  <div class="max-w-4xl mx-auto px-5 py-14">
    <!-- Hero for non-authenticated users -->
    <template v-if="!isAuthenticated">
      <div class="text-center py-24">
        <h1 class="text-4xl font-bold text-fg mb-3 tracking-tight">Организуй свои знания</h1>
        <p class="text-lg text-fg-muted mb-10 max-w-xl mx-auto leading-relaxed">
          Воркспейсы для тем и быстрый сбор идей в одном месте.
        </p>
        <RouterLink to="/auth" class="btn-primary text-base px-6 py-2.5 rounded-full">
          Начать бесплатно
        </RouterLink>
      </div>

      <!-- Features -->
      <div class="grid md:grid-cols-3 gap-6 mt-20">
        <div class="text-center p-6 rounded-2xl border border-border bg-muted/30">
          <div class="w-11 h-11 mx-auto mb-3 bg-primary/10 rounded-xl flex-center">
            <span class="i-lucide-folder text-xl text-primary" />
          </div>
          <h3 class="font-semibold text-fg mb-1.5">Воркспейсы</h3>
          <p class="text-sm text-fg-muted">Доски с видео, заметками и чеклистами для тем.</p>
        </div>
        <div class="text-center p-6 rounded-2xl border border-border bg-muted/30">
          <div class="w-11 h-11 mx-auto mb-3 bg-primary/10 rounded-xl flex-center">
            <span class="i-lucide-plus text-xl text-primary" />
          </div>
          <h3 class="font-semibold text-fg mb-1.5">Быстрое добавление</h3>
          <p class="text-sm text-fg-muted">Ссылки и идеи в один клик.</p>
        </div>
        <div class="text-center p-6 rounded-2xl border border-border bg-muted/30">
          <div class="w-11 h-11 mx-auto mb-3 bg-primary/10 rounded-xl flex-center">
            <span class="i-lucide-check-square text-xl text-primary" />
          </div>
          <h3 class="font-semibold text-fg mb-1.5">Трекинг прогресса</h3>
          <p class="text-sm text-fg-muted">Отмечайте выполненное и смотрите прогресс.</p>
        </div>
      </div>
    </template>

    <!-- Dashboard for authenticated users -->
    <template v-else>
      <div class="mb-10">
        <h1 class="page-title mb-1">Мои воркспейсы</h1>
        <p class="text-fg-muted text-sm">Доски для тем и проектов</p>
      </div>

      <!-- Loading -->
      <div v-if="workspaceStore.loading" class="text-center py-16">
        <div class="loading-spinner mx-auto" />
      </div>

      <!-- Workspaces Grid -->
      <div
        v-else-if="workspaceStore.workspaces.length > 0"
        class="grid md:grid-cols-2 lg:grid-cols-3 gap-5"
      >
        <button
          v-for="workspace in workspaceStore.workspaces"
          :key="workspace.id"
          @click="navigateToWorkspace(workspace.id)"
          class="workspace-card"
        >
          <h3 class="font-semibold text-fg mb-1.5 truncate text-base">{{ workspace.title }}</h3>
          <p v-if="workspace.description" class="text-sm text-fg-muted line-clamp-2 mb-3">
            {{ workspace.description }}
          </p>
          <p class="text-xs text-fg-muted">
            {{ new Date(workspace.updatedAt).toLocaleDateString('ru-RU') }}
          </p>
        </button>

        <!-- Create New -->
        <button @click="$router.push('/workspace/new')" class="workspace-card-new">
          <span class="i-lucide-plus text-3xl text-fg-muted" />
          <span class="text-sm font-medium text-fg-muted">Новый воркспейс</span>
        </button>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-16">
        <div class="empty-state-icon">
          <span class="i-lucide-folder text-2xl text-fg-muted" />
        </div>
        <h2 class="empty-state-title">Нет воркспейсов</h2>
        <p class="empty-state-desc">Создайте первый воркспейс для изучения новой темы</p>
        <button class="btn-primary" @click="router.push('/workspace/new')">
          <span class="i-lucide-plus mr-1.5" />
          Создать воркспейс
        </button>
      </div>
    </template>
  </div>
</template>
