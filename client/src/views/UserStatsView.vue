<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useQuery } from '@vue/apollo-composable';
import { useAuthStore } from '@/stores/auth';
import { toast } from 'vue-sonner';
import { USER_STATS_QUERY } from '@/graphql/queries';

const route = useRoute();
const authStore = useAuthStore();
const userId = computed(() => route.params.id as string);

const isOwnStats = computed(() => !!authStore.user && authStore.user.id === userId.value);

const { result, loading, error } = useQuery(USER_STATS_QUERY, () => ({
  userId: userId.value,
}));

const stats = computed(() => result.value?.userStats ?? null);

function shareStats() {
  const url = window.location.origin + route.fullPath;
  navigator.clipboard.writeText(url).then(
    () => toast.success('Ссылка скопирована'),
    () => toast.error('Не удалось скопировать')
  );
}
</script>

<template>
  <div class="page-container">
    <div class="flex-between mb-8">
      <RouterLink to="/" class="link-inline inline-flex items-center">
        <span class="i-lucide-arrow-left mr-1" />
        На главную
      </RouterLink>
      <button
        v-if="isOwnStats && stats"
        type="button"
        class="link-inline inline-flex items-center"
        @click="shareStats"
      >
        <span class="i-lucide-share-2 mr-1" />
        Поделиться статистикой
      </button>
    </div>

    <div v-if="loading" class="flex-center py-24">
      <span class="i-lucide-loader-2 animate-spin text-2xl text-muted" />
    </div>

    <template v-else-if="error || !stats">
      <div class="text-center py-24 text-muted">
        <span class="i-lucide-user-x text-4xl block mb-3 opacity-60" />
        <p>Пользователь не найден или доступ закрыт.</p>
      </div>
    </template>

    <template v-else>
      <!-- Avatar -->
      <div class="flex flex-col items-center mb-10">
        <div class="w-24 h-24 rounded-full bg-fg/5 overflow-hidden flex-center shrink-0">
          <img
            v-if="stats.avatarUrl"
            :src="stats.avatarUrl"
            alt="Аватар"
            class="w-full h-full object-cover"
          >
          <span v-else class="i-lucide-user text-4xl text-muted" />
        </div>
      </div>

      <!-- Block 1: total completed -->
      <div class="rounded-2xl border border-border bg-fg/4 p-6 mb-8">
        <p class="text-sm text-muted mb-1">
          Выполнено карточек
        </p>
        <p class="text-4xl font-bold text-fg tabular-nums">
          {{ stats.totalCompletedCards }}
        </p>
      </div>

      <!-- Block 2: workspaces with glass progress -->
      <div class="mb-4">
        <h2 class="text-lg font-semibold text-fg mb-3">
          Воркспейсы
        </h2>
      </div>
      <div v-if="stats.workspaceStats.length === 0" class="rounded-2xl border border-border bg-fg/3 p-8 text-center text-muted">
        Нет воркспейсов
      </div>
      <div v-else class="grid gap-4 sm:grid-cols-2">
        <div
          v-for="ws in stats.workspaceStats"
          :key="ws.id"
          class="rounded-2xl border border-border bg-fg/3 p-4 flex gap-4"
        >
          <div class="flex-1 min-w-0 opacity-80">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xl shrink-0 w-8 h-8 flex-center rounded-lg bg-bg/80">
                {{ ws.icon || '📁' }}
              </span>
              <span :title="ws.title" class="font-medium text-fg truncate">{{ ws.title }}</span>
            </div>
            <p v-if="ws.description" class="text-sm text-muted line-clamp-2">
              {{ ws.description }}
            </p>
          </div>
          <div class="flex flex-col items-end shrink-0">
            <span class="text-sm font-semibold text-primary tabular-nums mb-2">
              {{ ws.totalCards ? Math.round((ws.completedCards / ws.totalCards) * 100) : 0 }}%
            </span>
            <div class="water-glass">
              <div
                class="water-glass-fill"
                :style="{ height: ws.totalCards ? `${(ws.completedCards / ws.totalCards) * 100}%` : '0%' }"
              >
                <div class="water-glass-wave" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.water-glass {
  width: 28px;
  height: 64px;
  border-radius: 6px 6px 12px 12px;
  border: 2px solid var(--border);
  background: var(--bg);
  position: relative;
  overflow: hidden;
}

.water-glass-fill {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(180deg, var(--primary) 0%, color-mix(in srgb, var(--primary) 80%, transparent) 100%);
  transition: height 0.8s ease-out;
  min-height: 0;
}

.water-glass-wave {
  position: absolute;
  top: 0;
  left: -50%;
  width: 200%;
  height: 12px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  animation: wave 2s ease-in-out infinite;
}

@keyframes wave {
  0%, 100% { transform: translateX(0) scaleY(1); }
  50% { transform: translateX(10%) scaleY(1.2); }
}
</style>
