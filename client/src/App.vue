<script setup lang="ts">
import { RouterView } from 'vue-router';
import { Toaster } from 'vue-sonner';
import AppHeader from '@/components/common/AppHeader.vue';
import CookieConsent from '@/components/common/CookieConsent.vue';
import { useAuthStore } from '@/stores/auth';
import { useThemeStore } from '@/stores/theme';
import { useCookieConsentStore } from '@/stores/cookie-consent';
import { onMounted, watch } from 'vue';

const cookieConsent = useCookieConsentStore();
const authStore = useAuthStore();
const themeStore = useThemeStore();

onMounted(() => {
  cookieConsent.init();
});

function initApp() {
  themeStore.init();
  authStore.fetchMe();
}

watch(
  () => cookieConsent.accepted,
  (accepted) => {
    if (accepted) initApp();
  },
  { immediate: true }
);
</script>

<template>
  <CookieConsent v-if="!cookieConsent.accepted" />
  <template v-else>
    <div class="min-h-screen">
      <AppHeader />
      <main :class="authStore.user ? 'pt-[126px]' : 'pt-[63px]'">
        <RouterView />
      </main>
      <Toaster position="bottom-right" />
    </div>
  </template>
</template>
