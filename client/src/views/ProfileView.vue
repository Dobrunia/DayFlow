<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useThemeStore, THEMES, type ThemeId } from '@/stores/theme';
import { toast } from 'vue-sonner';
import { getGraphQLErrorMessage } from '@/lib/graphql-error';

const authStore = useAuthStore();
const themeStore = useThemeStore();

const lightThemes = computed(() => THEMES.filter((t) => !t.isDark));
const darkThemes = computed(() => THEMES.filter((t) => t.isDark));

const avatarUrlInput = ref('');
const saving = ref(false);
const previewError = ref(false);

const user = computed(() => authStore.user);
const previewUrl = computed(() => avatarUrlInput.value.trim() || user.value?.avatarUrl || null);

watch(avatarUrlInput, () => {
  previewError.value = false;
});
onMounted(() => {
  avatarUrlInput.value = authStore.user?.avatarUrl ?? '';
});

async function save() {
  const url = avatarUrlInput.value.trim() || null;
  try {
    saving.value = true;
    await authStore.updateProfile(url);
    toast.success('Профиль обновлён');
  } catch (e) {
    toast.error(getGraphQLErrorMessage(e));
  } finally {
    saving.value = false;
  }
}

const themeColors: Record<ThemeId, { bg: string; primary: string; accent: string }> = {
  light: { bg: '#ffffff', primary: '#3b82f6', accent: '#44cf6e' },
  dark: { bg: '#1e1e1e', primary: '#7f6df2', accent: '#48bf84' },
  oldmoney: { bg: '#f8f5ee', primary: '#2e5c48', accent: '#469a70' },
  oldmoney2: { bg: '#f7f5f3', primary: '#8b7355', accent: '#7d8471' },
  nord: { bg: '#12161c', primary: '#5e81ac', accent: '#8fbcbb' },
  'solarized-dark': { bg: '#002b36', primary: '#268bd2', accent: '#2aa198' },
  fullmoon: { bg: '#0f1a2e', primary: '#f4d03f', accent: '#22c55e' },
};

function getThemePreviewColors(id: ThemeId) {
  const c = themeColors[id];
  return {
    '--preview-bg': c.bg,
    '--preview-primary': c.primary,
    '--preview-accent': c.accent,
  };
}

function selectLightTheme(id: ThemeId) {
  themeStore.setPreferredLight(id);
  themeStore.setTheme(id);
}

function selectDarkTheme(id: ThemeId) {
  themeStore.setPreferredDark(id);
  themeStore.setTheme(id);
}
</script>

<template>
  <div class="page-container">
    <div class="flex flex-wrap items-end justify-between gap-4 mb-8">
      <div>
        <h1 class="page-title">Профиль</h1>
        <p class="page-desc">Настройки аккаунта</p>
      </div>
    </div>

    <div v-if="user" class="space-y-8">
      <!-- Avatar -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div class="flex-shrink-0 w-24 h-24 rounded-full bg-fg/5 overflow-hidden flex-center">
          <img
            v-if="previewUrl && !previewError"
            :src="previewUrl"
            alt="Аватар"
            class="w-full h-full object-cover"
            @error="previewError = true"
          >
          <span v-else class="i-lucide-user text-4xl text-muted" />
        </div>
        <div class="flex-1 min-w-0 space-y-4">
          <p class="text-sm text-muted">
            {{ user.email }}
          </p>
          <div>
            <label for="avatar-url" class="block text-sm font-medium mb-1">URL аватара</label>
            <input
              id="avatar-url"
              v-model="avatarUrlInput"
              type="url"
              placeholder="https://..."
              class="input w-full max-w-md"
              autocomplete="off"
            >
          </div>
          <button
            type="button"
            class="btn-primary"
            :disabled="saving"
            @click="save"
          >
            {{ saving ? 'Сохранение...' : 'Сохранить' }}
          </button>
        </div>
      </div>

      <!-- Theme -->
      <div>
        <h2 class="text-lg font-semibold mb-4">Тема оформления</h2>
        
        <!-- Light themes -->
        <div class="mb-4">
          <h3 class="text-sm text-muted mb-2 flex items-center gap-1.5">
            <span class="i-lucide-sun" />
            <span>Светлые</span>
          </h3>
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <button
              v-for="theme in lightThemes"
              :key="theme.id"
              type="button"
              class="p-3 rounded-[var(--r)] border text-left transition-all relative"
              :class="[
                themeStore.preferredLight === theme.id
                  ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                  : 'border-border hover:border-fg/30 bg-surface'
              ]"
              @click="selectLightTheme(theme.id as ThemeId)"
            >
              <span
                v-if="themeStore.preferredLight === theme.id"
                class="absolute top-1 right-1 i-lucide-pin text-xs text-primary"
                title="Дефолтная светлая тема"
              />
              <span class="font-medium text-sm block mb-2">{{ theme.name }}</span>
              <div
                class="h-4 rounded flex gap-0.5 overflow-hidden"
                :style="getThemePreviewColors(theme.id)"
              >
                <div class="flex-1" :style="{ background: 'var(--preview-bg)' }" />
                <div class="w-3" :style="{ background: 'var(--preview-primary)' }" />
                <div class="w-2" :style="{ background: 'var(--preview-accent)' }" />
              </div>
            </button>
          </div>
        </div>

        <!-- Dark themes -->
        <div>
          <h3 class="text-sm text-muted mb-2 flex items-center gap-1.5">
            <span class="i-lucide-moon" />
            <span>Тёмные</span>
          </h3>
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <button
              v-for="theme in darkThemes"
              :key="theme.id"
              type="button"
              class="p-3 rounded-[var(--r)] border text-left transition-all relative"
              :class="[
                themeStore.preferredDark === theme.id
                  ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                  : 'border-border hover:border-fg/30 bg-surface'
              ]"
              @click="selectDarkTheme(theme.id as ThemeId)"
            >
              <span
                v-if="themeStore.preferredDark === theme.id"
                class="absolute top-1 right-1 i-lucide-pin text-xs text-primary"
                title="Дефолтная тёмная тема"
              />
              <span class="font-medium text-sm block mb-2">{{ theme.name }}</span>
              <div
                class="h-4 rounded flex gap-0.5 overflow-hidden"
                :style="getThemePreviewColors(theme.id)"
              >
                <div class="flex-1" :style="{ background: 'var(--preview-bg)' }" />
                <div class="w-3" :style="{ background: 'var(--preview-primary)' }" />
                <div class="w-2" :style="{ background: 'var(--preview-accent)' }" />
              </div>
            </button>
          </div>
        </div>
        
        <p class="text-xs text-muted mt-3 flex items-center">
          <span class="i-lucide-info inline-block mr-1" />
          <span>Кнопка в шапке переключает между выбранными светлой и тёмной темами</span>
        </p>
      </div>
    </div>
  </div>
</template>
