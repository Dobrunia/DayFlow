import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

const STORAGE_KEY = 'dayflow-theme';

export const useThemeStore = defineStore('theme', () => {
  const dark = ref(false);

  function init() {
    if (typeof document === 'undefined') return;
    const saved = localStorage.getItem(STORAGE_KEY);
    dark.value = saved === 'dark';
    apply();
  }

  function toggle() {
    dark.value = !dark.value;
    localStorage.setItem(STORAGE_KEY, dark.value ? 'dark' : 'light');
    apply();
  }

  function apply() {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (dark.value) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }

  watch(dark, () => apply(), { immediate: false });

  return { dark, init, toggle };
});
