import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { DefaultApolloClient } from '@vue/apollo-composable';
import { apolloClient, setUnauthorizedHandler } from './lib/apollo';
import App from './App.vue';
import router from './router';
import { useAuthStore } from '@/stores/auth';

import '@unocss/reset/tailwind.css';
import 'uno.css';
import './assets/main.css';

const app = createApp(App);

app.provide(DefaultApolloClient, apolloClient);
app.use(createPinia());
app.use(router);

setUnauthorizedHandler(() => {
  useAuthStore().signOut();
  router.push({ name: 'auth', query: { redirect: router.currentRoute.value.fullPath } });
});

app.mount('#app');
