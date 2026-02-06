<script setup lang="ts">
import { onMounted } from 'vue';
import { useCookieConsentStore } from '@/stores/cookie-consent';

const consent = useCookieConsentStore();

onMounted(() => {
  consent.init();
});

function accept() {
  consent.accept();
}
</script>

<template>
  <div
    class="fixed inset-0 z-[9999] flex flex-col items-center justify-center px-6 py-8"
    role="dialog"
    aria-modal="true"
    aria-labelledby="cookie-title"
  >
    <div class="mx-auto w-full max-w-md text-center">
      <h1 id="cookie-title" class="text-xl font-semibold text-fg mb-3">
        Использование файлов cookie
      </h1>
      <p class="text-muted text-sm leading-relaxed mb-6">
        Мы используем cookie для входа в аккаунт и работы сервиса. Продолжая, вы соглашаетесь
        с использованием cookie в соответствии с нашей политикой. Без согласия доступ к сайту невозможен.
      </p>
      <button type="button" class="btn-primary" @click="accept">
        Принять и продолжить
      </button>
    </div>
  </div>
</template>
