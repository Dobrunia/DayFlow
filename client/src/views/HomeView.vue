<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useWorkspaceStore } from '@/stores/workspace';

const router = useRouter();
const authStore = useAuthStore();
const workspaceStore = useWorkspaceStore();

const isAuthenticated = computed(() => !!authStore.user);

onMounted(() => {
  if (isAuthenticated.value) {
    workspaceStore.fetchWorkspaces();
  }
});

function navigateToWorkspace(id: string) {
  router.push(`/workspace/${id}`);
}
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-12">
    <!-- Hero for non-authenticated users -->
    <template v-if="!isAuthenticated">
      <div class="text-center py-20">
        <h1 class="text-4xl font-bold text-gray-900 mb-4">Организуй свои знания</h1>
        <p class="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          DayFlow — инструмент для глубокого погружения в темы через воркспейсы и быстрого
          сохранения идей на потом.
        </p>
        <RouterLink to="/auth" class="btn-primary text-lg px-8 py-3"> Начать бесплатно </RouterLink>
      </div>

      <!-- Features -->
      <div class="grid md:grid-cols-3 gap-8 mt-16">
        <div class="text-center p-6">
          <div class="w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-xl flex-center">
            <span class="i-lucide-folder text-xl text-blue-600" />
          </div>
          <h3 class="font-semibold text-gray-900 mb-2">Воркспейсы</h3>
          <p class="text-sm text-gray-600">
            Создавайте доски для изучения тем с видео, заметками и чеклистами.
          </p>
        </div>

        <div class="text-center p-6">
          <div class="w-12 h-12 mx-auto mb-4 bg-green-100 rounded-xl flex-center">
            <span class="i-lucide-plus text-xl text-green-600" />
          </div>
          <h3 class="font-semibold text-gray-900 mb-2">Быстрое добавление</h3>
          <p class="text-sm text-gray-600">
            Сохраняйте ссылки и идеи в один клик — разберётесь потом.
          </p>
        </div>

        <div class="text-center p-6">
          <div class="w-12 h-12 mx-auto mb-4 bg-purple-100 rounded-xl flex-center">
            <span class="i-lucide-check-square text-xl text-purple-600" />
          </div>
          <h3 class="font-semibold text-gray-900 mb-2">Трекинг прогресса</h3>
          <p class="text-sm text-gray-600">
            Отмечайте просмотренное и выполненное — чувствуйте прогресс.
          </p>
        </div>
      </div>
    </template>

    <!-- Dashboard for authenticated users -->
    <template v-else>
      <div class="flex-between mb-8">
        <h1 class="text-2xl font-bold text-gray-900">Мои воркспейсы</h1>
        <RouterLink to="/library" class="btn-secondary">
          <span class="i-lucide-folder mr-1.5" />
          Библиотека
        </RouterLink>
      </div>

      <!-- Loading -->
      <div v-if="workspaceStore.loading" class="text-center py-12">
        <div class="animate-spin i-lucide-loader-2 text-2xl text-gray-400 mx-auto" />
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
          <h3 class="font-semibold text-gray-900 mb-1 truncate">{{ workspace.title }}</h3>
          <p v-if="workspace.description" class="text-sm text-gray-500 line-clamp-2">
            {{ workspace.description }}
          </p>
          <p class="text-xs text-gray-400 mt-3">
            {{ new Date(workspace.updatedAt).toLocaleDateString('ru-RU') }}
          </p>
        </button>

        <!-- Create New -->
        <button
          @click="$router.push('/workspace/new')"
          class="card border-dashed border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50/50 transition-colors flex-center flex-col gap-2 min-h-32"
        >
          <span class="i-lucide-plus text-2xl text-gray-400" />
          <span class="text-sm text-gray-500">Новый воркспейс</span>
        </button>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-16">
        <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex-center">
          <span class="i-lucide-folder text-2xl text-gray-400" />
        </div>
        <h2 class="text-lg font-medium text-gray-900 mb-2">Нет воркспейсов</h2>
        <p class="text-sm text-gray-500 mb-6">Создайте первый воркспейс для изучения новой темы</p>
        <button class="btn-primary">
          <span class="i-lucide-plus mr-1.5" />
          Создать воркспейс
        </button>
      </div>
    </template>
  </div>
</template>
