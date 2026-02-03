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
  <div class="max-w-5xl mx-auto px-4 py-12">
    <!-- Hero for non-authenticated users -->
    <template v-if="!isAuthenticated">
      <div class="text-center py-20">
        <h1 class="text-4xl font-bold text-fg mb-4">Организуй свои знания</h1>
        <p class="text-lg text-fg-muted mb-8 max-w-2xl mx-auto">
          DayFlow — инструмент для глубокого погружения в темы через воркспейсы и быстрого
          сохранения идей на потом.
        </p>
        <RouterLink to="/auth" class="btn-primary text-lg px-8 py-3"> Начать бесплатно </RouterLink>
      </div>

      <!-- Features -->
      <div class="grid md:grid-cols-3 gap-8 mt-16">
        <div class="text-center p-6">
          <div class="w-12 h-12 mx-auto mb-4 bg-muted rounded-xl flex-center">
            <span class="i-lucide-folder text-xl text-primary" />
          </div>
          <h3 class="font-semibold text-fg mb-2">Воркспейсы</h3>
          <p class="text-sm text-fg-muted">
            Создавайте доски для изучения тем с видео, заметками и чеклистами.
          </p>
        </div>

        <div class="text-center p-6">
          <div class="w-12 h-12 mx-auto mb-4 bg-muted rounded-xl flex-center">
            <span class="i-lucide-plus text-xl text-primary" />
          </div>
          <h3 class="font-semibold text-fg mb-2">Быстрое добавление</h3>
          <p class="text-sm text-fg-muted">
            Сохраняйте ссылки и идеи в один клик — разберётесь потом.
          </p>
        </div>

        <div class="text-center p-6">
          <div class="w-12 h-12 mx-auto mb-4 bg-muted rounded-xl flex-center">
            <span class="i-lucide-check-square text-xl text-primary" />
          </div>
          <h3 class="font-semibold text-fg mb-2">Трекинг прогресса</h3>
          <p class="text-sm text-fg-muted">
            Отмечайте просмотренное и выполненное — чувствуйте прогресс.
          </p>
        </div>
      </div>
    </template>

    <!-- Dashboard for authenticated users (Библиотека только в шапке) -->
    <template v-else>
      <div class="mb-8">
        <h1 class="page-title">Мои воркспейсы</h1>
      </div>

      <!-- Loading -->
      <div v-if="workspaceStore.loading" class="text-center py-12">
        <div class="loading-spinner mx-auto" />
      </div>

      <!-- Workspaces Grid -->
      <div
        v-else-if="workspaceStore.workspaces.length > 0"
        class="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <button
          v-for="workspace in workspaceStore.workspaces"
          :key="workspace.id"
          @click="navigateToWorkspace(workspace.id)"
          class="card-hover text-left"
        >
          <h3 class="font-semibold text-fg mb-1 truncate">{{ workspace.title }}</h3>
          <p v-if="workspace.description" class="text-sm text-fg-muted line-clamp-2">
            {{ workspace.description }}
          </p>
          <p class="text-xs text-fg-muted mt-3">
            {{ new Date(workspace.updatedAt).toLocaleDateString('ru-RU') }}
          </p>
        </button>

        <!-- Create New -->
        <button
          @click="$router.push('/workspace/new')"
          class="card border-dashed border-2 border-border hover:border-primary hover:bg-muted transition-colors flex-center flex-col gap-2 min-h-32"
        >
          <span class="i-lucide-plus text-2xl text-fg-muted" />
          <span class="text-sm text-fg-muted">Новый воркспейс</span>
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
