<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useThemeStore } from '@/stores/theme';
import SearchBar from './SearchBar.vue';
import GlobalAddButton from './GlobalAddButton.vue';

const router = useRouter();

const navLinks = [
  { to: '/', label: 'Воркспейсы', icon: 'i-lucide-layout-grid' },
  { to: '/library', label: 'Хаб', icon: 'i-lucide-inbox' },
  { to: '/tags', label: 'Теги', icon: 'i-lucide-hash' },
  { to: '/tools', label: 'Инструменты', icon: 'i-lucide-box' },
];

const learningLinks = [
  { to: '/learning/repeat', label: 'Повторить', icon: 'i-lucide-repeat', color: 'text-ls-repeat' },
  { to: '/learning/questions', label: 'Вопросы', icon: 'i-lucide-help-circle', color: 'text-ls-questions' },
  { to: '/learning/deepen', label: 'Углубить', icon: 'i-lucide-book-open', color: 'text-ls-deepen' },
];

const authStore = useAuthStore();
const themeStore = useThemeStore();

const isAuthenticated = computed(() => !!authStore.user);
const avatarLoadFailed = ref(false);
watch(
  () => authStore.user?.avatarUrl,
  () => {
    avatarLoadFailed.value = false;
  }
);

function handleSignOut() {
  authStore.signOut();
  router.push('/');
}
</script>

<template>
  <header class="fixed top-0 left-0 right-0 z-50">
    <!-- Main header -->
    <div class="h-14" style="background: color-mix(in srgb, rgb(var(--bg)) 90%, black 10%)">
      <div class="h-full max-w-7xl mx-auto px-4 pt-[12px] flex-between">
        <!-- Logo -->
        <RouterLink to="/" class="flex items-center gap-2 text-xl font-semibold text-fg">
          <span
            class="w-8 h-8 rounded-lg flex-center bg-success text-on-primary pointer-events-none"
            aria-hidden="true"
          >
            <span class="i-lucide-square-check text-lg" />
          </span>
          <span>DayFlow</span>
        </RouterLink>

        <!-- Center: Search (only when authenticated) -->
        <div v-if="isAuthenticated" class="flex-1 max-w-md mx-8">
          <SearchBar />
        </div>

        <!-- Right: User & Theme -->
        <nav class="flex items-center gap-3">
          <template v-if="isAuthenticated">
            <!-- User Menu -->
            <div class="relative group">
              <RouterLink to="/profile" class="block rounded-full">
                <img
                  v-if="authStore.user?.avatarUrl && !avatarLoadFailed"
                  :src="authStore.user.avatarUrl"
                  alt=""
                  class="w-9 h-9 rounded-full object-cover"
                  @error="avatarLoadFailed = true"
                />
                <span
                  v-else
                  class="w-9 h-9 rounded-full bg-fg/10 flex-center text-muted i-lucide-user text-lg"
                />
              </RouterLink>

              <!-- Dropdown -->
              <div
                class="absolute right-0 mt-1 w-48 dropdown-panel opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200"
              >
                <div class="p-3 border-b border-border">
                  <p class="text-sm font-medium text-fg truncate">{{ authStore.user?.email }}</p>
                </div>
                <div class="p-1">
                  <RouterLink to="/profile" class="dropdown-menu-item">
                    <span class="i-lucide-user" />
                    <span>Профиль</span>
                  </RouterLink>
                  <RouterLink :to="`/user/${authStore.user?.id}`" class="dropdown-menu-item">
                    <span class="i-lucide-bar-chart-2" />
                    <span>Моя статистика</span>
                  </RouterLink>
                  <button @click="handleSignOut" class="dropdown-menu-item text-danger hover:bg-danger/10">
                    <span class="i-lucide-log-out" />
                    <span>Выйти</span>
                  </button>
                </div>
              </div>
            </div>
          </template>

          <template v-else>
            <RouterLink to="/auth" class="btn-primary"><span>Войти</span></RouterLink>
          </template>

          <!-- Смена темы -->
          <button
            type="button"
            class="icon-btn-ghost ui-border"
            :aria-label="themeStore.dark ? 'Светлая тема' : 'Тёмная тема'"
            @click="themeStore.toggle()"
          >
            <span v-if="themeStore.dark" class="i-lucide-sun text-lg" />
            <span v-else class="i-lucide-moon text-lg" />
          </button>
        </nav>
      </div>
    </div>

    <!-- Secondary nav (only for authenticated) -->
    <div v-if="isAuthenticated" class="h-max border-b border-border" style="background: color-mix(in srgb, rgb(var(--bg)) 90%, black 10%)">
      <nav class="h-full max-w-7xl mx-auto px-4 flex items-center py-2">
        <div class="flex items-center gap-1">
          <RouterLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="btn-ghost"
            active-class="bg-fg/10"
          >
            <span :class="link.icon" />
            <span>{{ link.label }}</span>
          </RouterLink>

          <!-- Learning routes -->
          <div class="w-px h-5 bg-border mx-1"></div>
          
          <RouterLink
            v-for="link in learningLinks"
            :key="link.to"
            :to="link.to"
            class="btn-ghost"
            active-class="bg-fg/10"
          >
            <span :class="[link.icon, link.color]" />
            <span>{{ link.label }}</span>
          </RouterLink>
        </div>
        <div class="ml-auto">
          <GlobalAddButton />
        </div>
      </nav>
    </div>
  </header>
</template>
