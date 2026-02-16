<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { apolloClient } from '@/lib/apollo';
import { ACCEPT_INVITE_MUTATION } from '@/graphql/mutations';
import { toast } from 'vue-sonner';
import { getGraphQLErrorMessage } from '@/lib/graphql-error';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const loading = ref(true);
const error = ref('');

onMounted(async () => {
  const token = route.params.token as string;
  if (!token) {
    error.value = 'Некорректная ссылка';
    loading.value = false;
    return;
  }

  // Wait for auth init
  if (!authStore.initialized) {
    await authStore.fetchMe();
  }

  if (!authStore.user) {
    // Redirect to auth with return URL
    router.replace({ name: 'auth', query: { redirect: route.fullPath } });
    return;
  }

  try {
    const { data } = await apolloClient.mutate({
      mutation: ACCEPT_INVITE_MUTATION,
      variables: { token },
    });
    const ws = data.acceptInvite;
    toast.success(`Вы присоединились к «${ws.title}»`);
    router.replace(`/workspace/${ws.id}`);
  } catch (e) {
    error.value = getGraphQLErrorMessage(e);
    loading.value = false;
  }
});
</script>

<template>
  <div class="flex-1 flex-center flex-col gap-4 pt-32">
    <template v-if="loading && !error">
      <span class="i-lucide-loader-2 animate-spin text-2xl text-muted" />
      <p class="text-muted">Присоединяемся к воркспейсу…</p>
    </template>
    <template v-else-if="error">
      <span class="i-lucide-alert-circle text-4xl text-danger" />
      <p class="text-danger">{{ error }}</p>
      <RouterLink to="/" class="btn-primary">На главную</RouterLink>
    </template>
  </div>
</template>
