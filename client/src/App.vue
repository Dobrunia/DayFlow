<script setup lang="ts">
import { RouterView } from 'vue-router';
import { Toaster } from 'vue-sonner';
import AppHeader from '@/components/common/AppHeader.vue';
// import CookieConsent from '@/components/common/CookieConsent.vue';
import { useAuthStore } from '@/stores/auth';
import { useThemeStore } from '@/stores/theme';
// import { useCookieConsentStore } from '@/stores/cookie-consent';
import { onMounted } from 'vue';

const authStore = useAuthStore();
const themeStore = useThemeStore();

onMounted(() => {
  themeStore.init();
  authStore.fetchMe();
});
</script>

<template>
  <!-- CookieConsent отключён: авторизация через localStorage token -->
  <div class="min-h-screen">
    <AppHeader />
    <main :class="authStore.user ? 'pt-[126px]' : 'pt-[63px]'">
      <RouterView />
    </main>
    <Toaster position="bottom-right" />
  </div>
</template>
