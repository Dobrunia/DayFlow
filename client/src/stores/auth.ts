import { defineStore } from 'pinia';
import { ref } from 'vue';
import { apolloClient } from '@/lib/apollo';
import { getGraphQLErrorMessage } from '@/lib/graphql-error';
import { ME_QUERY } from '@/graphql/queries';
import { SIGN_IN_MUTATION, SIGN_UP_MUTATION, SIGN_OUT_MUTATION } from '@/graphql/mutations';
import type { User } from '@/graphql/types';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const initialized = ref(false);

  async function fetchMe() {
    try {
      loading.value = true;
      const { data } = await apolloClient.query({
        query: ME_QUERY,
        fetchPolicy: 'network-only',
      });
      user.value = data.me;
    } catch (e) {
      user.value = null;
    } finally {
      loading.value = false;
      initialized.value = true;
    }
  }

  async function signIn(email: string, password: string) {
    try {
      loading.value = true;
      error.value = null;

      const { data } = await apolloClient.mutate({
        mutation: SIGN_IN_MUTATION,
        variables: { email, password },
      });

      const userFromResponse = data?.signIn?.user;
      if (userFromResponse) {
        user.value = userFromResponse;
        return true;
      }
      error.value = 'Ошибка входа';
      return false;
    } catch (e: unknown) {
      error.value = getGraphQLErrorMessage(e) || 'Ошибка входа';
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function signUp(email: string, password: string) {
    try {
      loading.value = true;
      error.value = null;

      const { data } = await apolloClient.mutate({
        mutation: SIGN_UP_MUTATION,
        variables: { email, password },
      });

      const userFromResponse = data?.signUp?.user;
      if (userFromResponse) {
        user.value = userFromResponse;
        return true;
      }
      error.value = 'Ошибка регистрации';
      return false;
    } catch (e: unknown) {
      error.value = getGraphQLErrorMessage(e) || 'Ошибка регистрации';
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function signOut() {
    try {
      await apolloClient.mutate({
        mutation: SIGN_OUT_MUTATION,
      });
      user.value = null;
      // Clear Apollo cache
      await apolloClient.resetStore();
    } catch (e) {
      // Ignore errors on sign out
      user.value = null;
    }
  }

  function clearError() {
    error.value = null;
  }

  return {
    user,
    loading,
    error,
    initialized,
    fetchMe,
    signIn,
    signUp,
    signOut,
    clearError,
  };
});
