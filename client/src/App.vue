<script setup lang="ts">
import { RouterView } from 'vue-router';
import { Toaster } from 'vue-sonner';
import AppHeader from '@/components/common/AppHeader.vue';
import { useAuthStore } from '@/stores/auth';
import { onMounted } from 'vue';

const authStore = useAuthStore();

onMounted(() => {
  authStore.fetchMe();
});
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader />
    <main class="pt-16">
      <RouterView />
    </main>
    <Toaster position="bottom-right" />
  </div>
</template>
