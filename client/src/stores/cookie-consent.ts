import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

const STORAGE_KEY = 'dayflow-cookie-consent';

function readStored(): string | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
  } catch {
    return null;
  }
}

export const useCookieConsentStore = defineStore('cookieConsent', () => {
  const raw = ref<string | null>(readStored());

  function init() {
    raw.value = readStored();
  }

  const accepted = computed(() => raw.value === '1');

  function accept() {
    raw.value = '1';
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // ignore
    }
  }

  return { accepted, init, accept };
});
