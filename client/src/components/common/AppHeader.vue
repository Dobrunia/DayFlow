<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useThemeStore } from '@/stores/theme';
import SearchBar from './SearchBar.vue';
import GlobalAddButton from './GlobalAddButton.vue';

const router = useRouter();
const authStore = useAuthStore();
const themeStore = useThemeStore();

const isAuthenticated = computed(() => !!authStore.user);
const avatarLoadFailed = ref(false);
watch(() => authStore.user?.avatarUrl, () => {
  avatarLoadFailed.value = false;
});

function handleSignOut() {
  authStore.signOut();
  router.push('/');
}
</script>

<template>
  <header class="fixed top-0 left-0 right-0 z-50 h-16 bg-bg border-b border-border">
    <div class="h-full max-w-7xl mx-auto px-4 flex-between">
      <!-- Logo -->
      <RouterLink to="/" class="flex items-center gap-2 text-xl font-semibold text-fg">
        <span
          class="w-8 h-8 rounded-lg flex-center bg-success text-on-primary pointer-events-none"
          aria-hidden="true"
        >
          <span class="i-lucide-square-check text-lg" />
        </span>
        DayFlow
      </RouterLink>

      <!-- Center: Search (only when authenticated) -->
      <div v-if="isAuthenticated" class="flex-1 max-w-md mx-8">
        <SearchBar />
      </div>

      <!-- Right: Navigation & User -->
      <nav class="flex items-center gap-4">
        <template v-if="isAuthenticated">
          <RouterLink to="/library" class="btn-ghost text-sm text-fg-muted hover:text-fg">
            <span class="i-lucide-inbox mr-1.5" />
            Хаб
          </RouterLink>

          <GlobalAddButton />

          <!-- User Menu -->
          <div class="relative group">
            <RouterLink to="/profile" class="btn-ghost p-2 rounded-full flex items-center">
              <img
                v-if="authStore.user?.avatarUrl && !avatarLoadFailed"
                :src="authStore.user.avatarUrl"
                alt=""
                class="w-8 h-8 rounded-full object-cover"
                @error="avatarLoadFailed = true"
              />
              <span v-else class="i-lucide-user text-lg" />
            </RouterLink>

            <!-- Dropdown -->
            <div
              class="absolute right-0 mt-1 w-48 bg-bg border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50"
            >
              <div class="p-3 border-b border-border">
                <p class="text-sm font-medium text-fg truncate">
                  {{ authStore.user?.email }}
                </p>
              </div>
              <div class="p-1">
                <RouterLink
                  to="/profile"
                  class="w-full flex items-center gap-2 px-3 py-2 text-sm text-fg hover:bg-muted rounded-md"
                >
                  <span class="i-lucide-user" />
                  Профиль
                </RouterLink>
                <button
                  @click="handleSignOut"
                  class="w-full flex items-center gap-2 px-3 py-2 text-sm text-fg hover:bg-muted rounded-md"
                >
                  <span class="i-lucide-log-out" />
                  Выйти
                </button>
              </div>
            </div>
          </div>
        </template>

        <template v-else>
          <RouterLink to="/auth" class="btn-primary">Войти</RouterLink>
        </template>

        <!-- Смена темы -->
        <button
          type="button"
          class="btn-icon btn-ghost p-2"
          :aria-label="themeStore.dark ? 'Светлая тема' : 'Тёмная тема'"
          @click="themeStore.toggle()"
        >
          <span v-if="themeStore.dark" class="i-lucide-sun text-lg" />
          <span v-else class="i-lucide-moon text-lg" />
        </button>
      </nav>
    </div>
  </header>
</template>
