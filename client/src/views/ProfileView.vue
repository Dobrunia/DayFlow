<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { toast } from 'vue-sonner';
import { getGraphQLErrorMessage } from '@/lib/graphql-error';

const authStore = useAuthStore();

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
</script>

<template>
  <div class="page-container">
    <div class="page-header-row">
      <div class="page-header-text">
        <h1 class="page-title">
          Профиль
        </h1>
        <p class="page-desc">
          Настройки аккаунта
        </p>
      </div>
      <div class="flex items-center gap-3">
        <RouterLink to="/" class="btn-link">
          <span class="i-lucide-arrow-left mr-1" />
          На главную
        </RouterLink>
        <RouterLink v-if="user" :to="`/user/${user.id}`" class="btn-link">
          <span class="i-lucide-bar-chart-2 mr-1" />
          Моя статистика
        </RouterLink>
      </div>
    </div>

    <div v-if="user" class="space-y-6">
      <div class="flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div class="flex-shrink-0 w-24 h-24 rounded-full bg-muted overflow-hidden flex-center">
          <img
            v-if="previewUrl && !previewError"
            :src="previewUrl"
            alt="Аватар"
            class="w-full h-full object-cover"
            @error="previewError = true"
          >
          <span v-else class="i-lucide-user text-4xl text-fg-muted" />
        </div>
        <div class="flex-1 min-w-0 space-y-4">
          <p class="text-sm text-fg-muted">
            {{ user.email }}
          </p>
          <div>
            <label for="avatar-url" class="form-label">URL аватара</label>
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
    </div>
  </div>
</template>
