import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

const STORAGE_KEY = 'dayflow-theme';
const STORAGE_KEY_PREF_LIGHT = 'dayflow-pref-light';
const STORAGE_KEY_PREF_DARK = 'dayflow-pref-dark';

export type ThemeId = 'light' | 'dark' | 'oldmoney' | 'oldmoney2' | 'nord' | 'solarized-dark' | 'fullmoon';

export interface ThemeOption {
  id: ThemeId;
  name: string;
  isDark: boolean;
}

export const THEMES: ThemeOption[] = [
  { id: 'light', name: 'Светлая', isDark: false },
  { id: 'dark', name: 'Тёмная (Obsidian)', isDark: true },
  { id: 'oldmoney', name: 'Old Money', isDark: false },
  { id: 'oldmoney2', name: 'Old Money II', isDark: false },
  { id: 'nord', name: 'Nord', isDark: true },
  { id: 'solarized-dark', name: 'Solarized Dark', isDark: true },
  { id: 'fullmoon', name: 'Full Moon', isDark: true },
];

export const useThemeStore = defineStore('theme', () => {
  const themeId = ref<ThemeId>('light');
  
  // Предпочтительные темы для toggle
  const preferredLight = ref<ThemeId>('light');
  const preferredDark = ref<ThemeId>('dark');

  const currentTheme = computed(() => THEMES.find((t) => t.id === themeId.value) ?? THEMES[0]);
  const dark = computed(() => currentTheme.value.isDark);

  function init() {
    if (typeof document === 'undefined') return;
    
    // Загружаем текущую тему
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
    if (saved && THEMES.some((t) => t.id === saved)) {
      themeId.value = saved;
    }
    
    // Загружаем предпочтительные темы
    const savedLight = localStorage.getItem(STORAGE_KEY_PREF_LIGHT) as ThemeId | null;
    const savedDark = localStorage.getItem(STORAGE_KEY_PREF_DARK) as ThemeId | null;
    
    if (savedLight && THEMES.some((t) => t.id === savedLight && !t.isDark)) {
      preferredLight.value = savedLight;
    }
    if (savedDark && THEMES.some((t) => t.id === savedDark && t.isDark)) {
      preferredDark.value = savedDark;
    }
    
    apply();
  }

  function setTheme(id: ThemeId) {
    themeId.value = id;
    localStorage.setItem(STORAGE_KEY, id);
    apply();
  }

  function setPreferredLight(id: ThemeId) {
    const theme = THEMES.find((t) => t.id === id);
    if (!theme || theme.isDark) return;
    preferredLight.value = id;
    localStorage.setItem(STORAGE_KEY_PREF_LIGHT, id);
  }

  function setPreferredDark(id: ThemeId) {
    const theme = THEMES.find((t) => t.id === id);
    if (!theme?.isDark) return;
    preferredDark.value = id;
    localStorage.setItem(STORAGE_KEY_PREF_DARK, id);
  }

  /** Toggle переключает между предпочтительной светлой и тёмной */
  function toggle() {
    const nextThemeId = dark.value ? preferredLight.value : preferredDark.value;
    setTheme(nextThemeId);
  }

  function apply() {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    // Убираем все классы тем
    root.classList.remove('dark', 'theme-oldmoney', 'theme-oldmoney2', 'theme-nord', 'theme-solarized-dark', 'theme-fullmoon');

    // Добавляем нужные классы
    const theme = currentTheme.value;
    if (theme.isDark) {
      root.classList.add('dark');
    }
    if (theme.id !== 'light' && theme.id !== 'dark') {
      root.classList.add(`theme-${theme.id}`);
    }
  }

  return {
    themeId,
    currentTheme,
    dark,
    preferredLight,
    preferredDark,
    init,
    setTheme,
    setPreferredLight,
    setPreferredDark,
    toggle,
  };
});
