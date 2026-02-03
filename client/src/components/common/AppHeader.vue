<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import SearchBar from './SearchBar.vue';
import GlobalAddButton from './GlobalAddButton.vue';

const router = useRouter();
const authStore = useAuthStore();

const isAuthenticated = computed(() => !!authStore.user);

function handleSignOut() {
  authStore.signOut();
  router.push('/');
}
</script>

<template>
  <header class="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-gray-200">
    <div class="h-full max-w-7xl mx-auto px-4 flex-between">
      <!-- Logo -->
      <RouterLink to="/" class="flex items-center gap-2 text-xl font-semibold text-gray-900">
        <div class="w-8 h-8 bg-blue-600 rounded-lg flex-center text-white text-sm font-bold">D</div>
        DayFlow
      </RouterLink>

      <!-- Center: Search (only when authenticated) -->
      <div v-if="isAuthenticated" class="flex-1 max-w-md mx-8">
        <SearchBar />
      </div>

      <!-- Right: Navigation & User -->
      <nav class="flex items-center gap-4">
        <template v-if="isAuthenticated">
          <RouterLink to="/library" class="btn-ghost text-sm text-gray-600 hover:text-gray-900">
            <span class="i-lucide-folder mr-1.5" />
            Библиотека
          </RouterLink>

          <GlobalAddButton />

          <!-- User Menu -->
          <div class="relative group">
            <button class="btn-ghost p-2 rounded-full">
              <span class="i-lucide-user text-lg" />
            </button>

            <!-- Dropdown -->
            <div
              class="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200"
            >
              <div class="p-3 border-b border-gray-100">
                <p class="text-sm font-medium text-gray-900 truncate">
                  {{ authStore.user?.email }}
                </p>
              </div>
              <div class="p-1">
                <button
                  @click="handleSignOut"
                  class="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  <span class="i-lucide-log-out" />
                  Выйти
                </button>
              </div>
            </div>
          </div>
        </template>

        <template v-else>
          <RouterLink to="/auth" class="btn-primary"> Войти </RouterLink>
        </template>
      </nav>
    </div>
  </header>
</template>
