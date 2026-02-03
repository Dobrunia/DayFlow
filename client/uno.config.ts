import {
  defineConfig,
  presetUno,
  presetAttributify,
  presetIcons,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss';

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
      warn: true,
    }),
  ],
  transformers: [transformerDirectives(), transformerVariantGroup()],
  shortcuts: {
    // Layout
    'flex-center': 'flex items-center justify-center',
    'flex-between': 'flex items-center justify-between',

    // Cards
    card: 'bg-white border border-gray-200 rounded-xl p-4 shadow-sm',
    'card-hover': 'card hover:shadow-md hover:border-gray-300 transition-all duration-200',

    // Buttons
    btn: 'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
    'btn-primary': 'btn bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    'btn-secondary': 'btn bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500',
    'btn-ghost': 'btn hover:bg-gray-100 focus:ring-gray-500',
    'btn-icon': 'btn p-2 rounded-lg',

    // Form elements
    input:
      'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors',
    textarea: 'input resize-none',

    // Typography
    'text-title': 'text-xl font-semibold text-gray-900',
    'text-subtitle': 'text-lg font-medium text-gray-800',
    'text-body': 'text-sm text-gray-600',
    'text-muted': 'text-xs text-gray-400',

    // Checkbox
    checkbox: 'h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer',
  },
  theme: {
    colors: {
      // Minimal palette
      primary: {
        50: '#eff6ff',
        100: '#dbeafe',
        200: '#bfdbfe',
        300: '#93c5fd',
        400: '#60a5fa',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
        800: '#1e40af',
        900: '#1e3a8a',
      },
    },
  },
  safelist: [
    'i-lucide-video',
    'i-lucide-file-text',
    'i-lucide-check-square',
    'i-lucide-link',
    'i-lucide-github',
    'i-lucide-list-todo',
    'i-lucide-plus',
    'i-lucide-search',
    'i-lucide-x',
    'i-lucide-check',
    'i-lucide-trash-2',
    'i-lucide-edit-2',
    'i-lucide-more-horizontal',
    'i-lucide-chevron-down',
    'i-lucide-log-out',
    'i-lucide-user',
    'i-lucide-settings',
    'i-lucide-folder',
    'i-lucide-archive',
    'i-lucide-external-link',
  ],
});
