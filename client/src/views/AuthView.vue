<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { toast } from 'vue-sonner';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const mode = ref<'signin' | 'signup'>('signin');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');

const titleText = computed(() => (mode.value === 'signin' ? 'Вход в аккаунт' : 'Регистрация'));
const subtitleText = computed(() =>
  mode.value === 'signin' ? 'Войдите, чтобы продолжить' : 'Создайте аккаунт для начала'
);
const submitButtonText = computed(() => (mode.value === 'signin' ? 'Войти' : 'Зарегистрироваться'));
const togglePromptText = computed(() =>
  mode.value === 'signin' ? 'Нет аккаунта?' : 'Уже есть аккаунт?'
);
const toggleLinkText = computed(() => (mode.value === 'signin' ? 'Зарегистрироваться' : 'Войти'));

async function handleSubmit() {
  const trimmedEmail = email.value.trim();
  if (mode.value === 'signup') {
    if (password.value !== confirmPassword.value) {
      toast.error('Пароли не совпадают');
      return;
    }
    if (password.value.length < 6) {
      toast.error('Пароль должен быть минимум 6 символов');
      return;
    }
    const success = await authStore.signUp(trimmedEmail, password.value);
    if (success) {
      toast.success('Регистрация успешна!');
      navigateAfterAuth();
    } else {
      toast.error(authStore.error || 'Ошибка регистрации');
    }
  } else {
    const success = await authStore.signIn(trimmedEmail, password.value);
    if (success) {
      toast.success('Добро пожаловать!');
      navigateAfterAuth();
    } else {
      toast.error(authStore.error || 'Ошибка входа');
    }
  }
}

function navigateAfterAuth() {
  const redirect = route.query.redirect as string;
  router.push(redirect || '/');
}

function toggleMode() {
  mode.value = mode.value === 'signin' ? 'signup' : 'signin';
  confirmPassword.value = '';
  authStore.clearError();
}
</script>

<template>
  <div class="min-h-[calc(100vh-4rem)] flex-center px-4">
    <div class="w-full max-w-sm">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold text-fg mb-2">{{ titleText }}</h1>
        <p class="text-sm text-muted">{{ subtitleText }}</p>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label for="email" class="block text-sm font-medium mb-1">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            autocomplete="email"
            class="input"
            placeholder="email@example.com"
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium mb-1">Пароль</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            autocomplete="current-password"
            class="input"
            placeholder="••••••••"
          />
        </div>

        <div v-if="mode === 'signup'">
          <label for="confirmPassword" class="block text-sm font-medium mb-1">Подтвердите пароль</label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            required
            autocomplete="new-password"
            class="input"
            placeholder="••••••••"
          />
        </div>

        <button type="submit" class="btn-primary w-full py-2.5" :disabled="authStore.loading">
          <span v-if="authStore.loading" class="i-lucide-loader-2 animate-spin mr-2" />
          {{ submitButtonText }}
        </button>
      </form>

      <!-- Toggle Mode -->
      <p class="mt-6 text-center text-sm text-muted">
        {{ togglePromptText }}
        <button type="button" @click="toggleMode" class="link-inline font-medium ml-1">
          {{ toggleLinkText }}
        </button>
      </p>
    </div>
  </div>
</template>
