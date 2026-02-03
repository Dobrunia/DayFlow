import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { DefaultApolloClient } from '@vue/apollo-composable';
import { apolloClient } from './lib/apollo';
import App from './App.vue';
import router from './router';

import '@unocss/reset/tailwind.css';
import 'uno.css';
import './assets/main.css';

const app = createApp(App);

app.provide(DefaultApolloClient, apolloClient);
app.use(createPinia());
app.use(router);

app.mount('#app');
