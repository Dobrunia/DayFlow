import {
  defineConfig,
  presetUno,
  presetAttributify,
  presetIcons,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss';

export default defineConfig({
  darkMode: 'class',
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      scale: 1,
      warn: true,
      extraProperties: {
        display: 'block',
        width: '1.2em',
        height: '1.2em',
        'flex-shrink': '0',
      },
      collections: {
        lucide: () => import('@iconify-json/lucide/icons.json').then((m) => m.default),
      },
    }),
  ],
  transformers: [transformerDirectives(), transformerVariantGroup()],

  theme: {
    colors: {
      // ВАЖНО: Uno ожидает строки; мы даём rgb(var(--x) / <alpha-value>)
      bg: 'rgb(var(--bg) / <alpha-value>)',
      fg: 'rgb(var(--fg) / <alpha-value>)',
      surface: 'rgb(var(--surface) / <alpha-value>)',
      border: 'rgb(var(--border) / <alpha-value>)',
      muted: 'rgb(var(--muted) / <alpha-value>)',

      primary: 'rgb(var(--primary) / <alpha-value>)',
      'on-primary': 'rgb(var(--on-primary) / <alpha-value>)',

      success: 'rgb(var(--success) / <alpha-value>)',
      danger: 'rgb(var(--danger) / <alpha-value>)',

      link: 'rgb(var(--link-inline) / <alpha-value>)',
      ring: 'rgb(var(--ring) / <alpha-value>)',

      'ls-inprogress': 'rgb(var(--ls-inprogress) / <alpha-value>)',
      'ls-repeat': 'rgb(var(--ls-repeat) / <alpha-value>)',
      'ls-questions': 'rgb(var(--ls-questions) / <alpha-value>)',
      'ls-deepen': 'rgb(var(--ls-deepen) / <alpha-value>)',
    },
  },

  shortcuts: {
    /* ─────────────────────────────
       Primitives (минимум)
       ───────────────────────────── */
    'flex-center': 'flex items-center justify-center',
    'flex-between': 'flex items-center justify-between',

    // единый фокус-стиль (используй внутри компонентов)
    'ui-focus': 'focus-visible:(outline-none shadow-[0_0_0_2px_rgb(var(--ring)_/_0.45)])',

    // поверхности / границы
    'ui-surface': 'bg-surface text-fg',
    'ui-border': 'border border-border',

    /* ─────────────────────────────
       Card
       ───────────────────────────── */
    card: 'ui-surface ui-border rounded-[var(--r)] shadow-[var(--shadow)]',
    'card-pad': 'p-[calc(var(--space)*4)]', // 16px
    'card-hover': 'card hover:bg-fg/3 transition-colors duration-150',
    'card-action': 'opacity-0 group-hover:opacity-100 transition-opacity duration-150',

    /* ─────────────────────────────
       Button
       ───────────────────────────── */
    btn: [
      'inline-flex items-center justify-center gap-2',
      'h-10 px-4 rounded-[var(--r)]',
      'text-sm font-medium leading-none select-none',
      '[&>span]:-translate-y-px',
      'transition-colors duration-150',
      'disabled:(opacity-50 pointer-events-none)',
      'ui-focus',
    ].join(' '),

    'btn-primary': [
      'btn',
      'bg-primary text-on-primary border border-transparent',
      'hover:bg-primary/90 active:bg-primary/82',
    ].join(' '),

    'btn-ghost': ['btn', 'bg-transparent ui-border', 'hover:bg-fg/6 active:bg-fg/10'].join(' '),

    'btn-danger': [
      'btn',
      'bg-danger text-on-primary border border-transparent',
      'hover:bg-danger/90 active:bg-danger/82',
    ].join(' '),

    'btn-danger-ghost': [
      'btn',
      'bg-transparent text-danger border border-danger/30',
      'hover:bg-danger/10 active:bg-danger/15',
    ].join(' '),

    // если очень нужен размер — один модификатор, не 10
    'btn-sm': 'h-8 px-3 text-xs rounded-[calc(var(--r)-2px)]',

    /* ─────────────────────────────
       Icon button
       ───────────────────────────── */
    'icon-btn': [
      'inline-flex items-center justify-center',
      'w-9 h-9 rounded-[calc(var(--r)-2px)]',
      'leading-none',
      'transition-all duration-150',
      'disabled:(opacity-50 pointer-events-none)',
      'ui-focus',
    ].join(' '),

    'icon-btn-ghost': 'icon-btn text-muted hover:(text-fg bg-fg/6)',
    'icon-btn-primary': 'icon-btn text-muted hover:(text-primary bg-primary/10)',
    'icon-btn-danger': 'icon-btn text-muted hover:(text-danger bg-danger/10)',

    /* ─────────────────────────────
       Semantic (role-based aliases)
       ───────────────────────────── */
    'btn-delete': 'btn-danger-ghost',
    'icon-btn-close': 'icon-btn-ghost',
    'icon-btn-edit': 'icon-btn-primary',
    'icon-btn-delete': 'icon-btn-danger',

    /* ─────────────────────────────
       Inputs
       ───────────────────────────── */
    input: [
      'w-full h-10 px-3 rounded-[var(--r)]',
      'ui-surface ui-border',
      'text-sm placeholder:text-muted',
      'focus-visible:(border-[rgb(var(--ring))] shadow-[0_0_0_2px_rgb(var(--ring)_/_0.30)])',
      'disabled:(opacity-60 pointer-events-none)',
    ].join(' '),

    textarea: 'input h-auto py-2 resize-none',

    checkbox: [
      'h-4 w-4 rounded',
      'border border-border',
      'accent-[rgb(var(--primary))]',
      'ui-focus',
      'cursor-pointer',
    ].join(' '),

    /* ─────────────────────────────
       Dialog
       ───────────────────────────── */
    'dialog-overlay': 'fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm',
    'dialog-content':
      'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md card p-6 z-[101]',
    'dialog-header': 'flex-between mb-4',
    'dialog-title': 'text-lg font-semibold',

    /* ─────────────────────────────
       Dropdown
       ───────────────────────────── */
    'dropdown-panel': 'mt-1 card overflow-hidden z-50',
    'dropdown-item': 'w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-fg/6',
    'dropdown-menu-item': 'dropdown-item rounded-[calc(var(--r)-4px)]',

    /* ─────────────────────────────
       Page layout (минимум)
       ───────────────────────────── */
    'page-container': 'max-w-4xl mx-auto px-5 pt-6 pb-10',
    'page-title': 'text-2xl font-bold tracking-tight',
    'page-desc': 'text-sm text-muted',
    'link-inline': 'text-link hover:underline underline-offset-3',

    /* ─────────────────────────────
       Mode Tabs (segmented control)
       ───────────────────────────── */
    'mode-tabs': 'flex items-center gap-0 bg-fg/10 rounded-[calc(var(--r)-2px)] p-0.5',
    'mode-tab': [
      'flex items-center gap-1.5 px-3 py-1.5',
      'border-none bg-transparent',
      'rounded-[calc(var(--r)-4px)]',
      'text-[13px] font-medium text-muted leading-none',
      '[&>span]:-translate-y-px',
      'cursor-pointer select-none transition-all duration-150',
      'hover:(text-fg bg-fg/5)',
      '[&.active]:(bg-surface text-fg shadow-sm)',
    ].join(' '),
  },

  safelist: [
    'i-lucide-file-text',
    'i-lucide-check-square',
    'i-lucide-link',
    'i-lucide-inbox',
    'i-lucide-plus',
    'i-lucide-search',
    'i-lucide-x',
    'i-lucide-check',
    'i-lucide-trash-2',
    'i-lucide-log-out',
    'i-lucide-user',
    'i-lucide-folder',
    'i-lucide-external-link',
    'i-lucide-loader-2',
    'i-lucide-arrow-left',
    'i-lucide-folder-x',
    'i-lucide-grip-vertical',
    'i-lucide-sun',
    'i-lucide-moon',
    'i-lucide-maximize-2',
    'i-lucide-arrow-up-down',
    'i-lucide-bar-chart-2',
    'i-lucide-user-x',
    'i-lucide-share-2',
    // learning status (dynamic from constants.ts)
    'i-lucide-circle-arrow-right',
    'i-lucide-repeat',
    'i-lucide-help-circle',
    'i-lucide-book-open',
    'text-ls-inprogress',
    'text-ls-repeat',
    'text-ls-questions',
    'text-ls-deepen',
    // workspace layout & roadmap
    'i-lucide-columns-3',
    'i-lucide-map',
    'i-lucide-clipboard-paste',
    'i-lucide-sparkles',
    'i-lucide-pencil',
    'i-lucide-copy',
    'i-lucide-download',
    'i-lucide-chevron-right',
    'i-lucide-box',
    'i-lucide-layout-grid',
  ],
});
// Правило, которое остановит рост “100 видов одного”

// Разрешено в shortcuts только:

// базовые примитивы

// компоненты (btn/input/card/dialog/dropdown)

// Запрещено в shortcuts:

// “классы под конкретную страницу/кейс” (workspace-card-new, page-header-row, card-summary-readonly…)
// Правильная иерархия (сверху вниз)
// tokens (CSS variables)
//   ↓
// primitives (btn, icon-btn)
//   ↓
// semantic variants (btn-danger, icon-btn-danger)
//   ↓
// ROLE-BASED shortcut  ← ВОТ ТУТ
// (РЕКОМЕНДУЮ): Semantic / role-based shortcut

// Если кнопка удаления одинаковая по смыслу и виду везде,
// ей нужен отдельный semantic-класс, но на базе существующих примитивов.

// Пример
// shortcuts: {
//   /* уже есть */
//   'btn-danger': 'btn bg-danger text-on-primary hover:bg-danger/90',

//   /* роль */
//   'btn-delete': 'btn-danger',
// }

// Использование:

// <button class="btn-delete">Удалить</button>

// Почему это правильно

// 🔹 одна точка изменения

// 🔹 семантика читается сразу

// 🔹 завтра дизайнер скажет
// “удаление должно быть ghost + red text”
// → ты меняешь один shortcut

// 'btn-delete': 'btn-ghost text-danger hover:bg-danger/10',

// и всё приложение обновилось.

// Вариант №2: Icon-only удаление (очень частый кейс)
// shortcuts: {
//   'icon-btn-danger': 'icon-btn text-muted hover:(text-danger bg-danger/10)',

//   'icon-btn-delete': 'icon-btn-danger',
// }

// <button class="icon-btn-delete">
//   <span class="i-lucide-trash-2" />
// </button>

// ❌ Как НЕ надо (важно)
// 1. Не хардкодить в шаблонах
// <button class="btn bg-danger text-white hover:bg-danger/90">

// ❌ через месяц таких будет 12 разных

// 2. Не пихать “удаление” в базовый btn
// btn: '... hover:bg-danger'

// ❌ разрушает систему

// 3. Не делать page-specific shortcut
// 'delete-task-btn': '...'

// ❌ завтра появится delete-note, delete-workspace…

// Как понять: нужен ли отдельный shortcut?

// Задай себе 2 вопроса:

// 1️⃣ Это одинаково везде?

// → да → semantic shortcut

// 2️⃣ Это роль, а не компонент?

// → да → btn-delete, btn-save, btn-confirm

// Минимальный рекомендуемый набор “роль-классов”

// Не больше 5–7 на всё приложение:

// /* buttons */
// btn-primary
// btn-danger
// btn-delete
// btn-confirm
// btn-cancel

// /* icons */
// icon-btn-delete
// icon-btn-edit
// icon-btn-close

// Если их становится 15+ — значит роли размылись.

// Если хочешь жёсткую дисциплину (pro-уровень)

// Можно договориться о правиле:

// Любая кнопка с действием → только через semantic shortcut

// <!-- ❌ -->
// <button class="btn-danger">Удалить</button>

// <!-- ✅ -->
// <button class="btn-delete">Удалить</button>

// Это очень хорошо держит дизайн в узде.
