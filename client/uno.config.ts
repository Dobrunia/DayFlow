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
      scale: 1.2,
      warn: true,
      extraProperties: { display: 'inline-block', 'vertical-align': 'middle' },
      collections: {
        lucide: () => import('@iconify-json/lucide/icons.json').then((m) => m.default),
      },
    }),
  ],
  transformers: [transformerDirectives(), transformerVariantGroup()],
  shortcuts: {
    'flex-center': 'flex items-center justify-center',
    'flex-between': 'flex items-center justify-between',
    card: 'bg-bg border border-border rounded-2xl p-4',
    'card-hover': 'card hover:bg-muted/50 transition-colors duration-200',
    'workspace-card':
      'block w-full text-left rounded-2xl p-5 border border-border bg-muted/60 hover:bg-muted hover:border-border-hover transition-all duration-200 shadow-[var(--card-shadow)] hover:shadow-[var(--card-shadow-hover)]',
    'workspace-card-new':
      'flex-shrink-0 rounded-2xl border-2 border-dashed border-border bg-muted/20 hover:border-border-hover hover:bg-muted transition-all duration-200 flex-center flex-col gap-3 min-h-[140px] text-fg-muted hover:text-fg',
    btn: 'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none disabled:opacity-50 disabled:pointer-events-none outline-none',
    'btn-primary': 'btn bg-primary text-on-primary hover:opacity-90',
    'btn-secondary': 'btn bg-muted text-fg hover:bg-muted-hover',
    'btn-danger': 'btn bg-muted text-danger hover:bg-danger hover:text-on-danger',
    'btn-ghost': 'btn hover:bg-muted',
    'btn-icon': 'btn p-2 rounded-lg',
    'btn-icon-muted-primary': 'btn-icon p-1 text-fg-muted hover:text-primary',
    'btn-icon-muted-danger': 'btn-icon p-1.5 text-fg-muted hover:text-danger',
    'btn-icon-muted-fg': 'btn-icon p-1 text-fg-muted hover:text-fg',
    'header-icon-danger': 'header-icon-hover hover:text-danger',
    'icon-muted-danger': 'text-fg-muted hover:text-danger',
    input:
      'w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg placeholder:text-fg-muted focus:border-primary transition-colors outline-none focus:outline-none focus:ring-0',
    textarea: 'input resize-none',
    checkbox: 'h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer',
    /* Универсальный чекбокс-кнопка: не сплющивается, один стиль везде */
    'checkbox-btn':
      'flex-shrink-0 min-w-5 min-h-5 w-5 h-5 rounded-full flex-center p-0 border-2 border-transparent bg-transparent transition-colors outline-none focus:outline-none focus:ring-0',
    'checkbox-btn-checked': 'bg-success text-on-primary border-success',
    'checkbox-btn-unchecked':
      'border-2 border-border bg-muted hover:border-success hover:bg-success/10 transition-colors',
    'checkbox-btn-sm': 'min-w-4 min-h-4 w-4 h-4',
    'checkbox-btn-xs': 'min-w-3.5 min-h-3.5 w-3.5 h-3.5',
    'checkbox-btn-square': 'rounded',
    /* Чекбокс как на карточке (задача / фильтр «Отключить выполненные») */
    'checkbox-btn-card': 'checkbox-btn checkbox-btn-sm checkbox-btn-square flex-shrink-0',
    /* Бейдж типа карточки (Заметка / Чеклист) — один стиль */
    'card-type-badge':
      'inline-flex items-center gap-1 text-[10px] text-primary bg-muted px-1.5 py-0.5 rounded',
    /* Ссылка «Перейти» — только текст и иконка, без обводки и фона */
    'card-type-badge-link':
      'inline-flex items-center gap-1 text-[10px] text-primary no-underline cursor-pointer hover:underline transition-colors border-0 bg-transparent outline-none',
    /* Модалки */
    'dialog-overlay': 'fixed inset-0 z-[100] bg-overlay backdrop-blur-sm',
    'dialog-content':
      'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-bg border border-border rounded-xl shadow-xl z-[101] p-6',
    'dialog-content-scroll':
      'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-bg border border-border rounded-xl shadow-xl z-[101] p-6 max-h-[90vh] overflow-y-auto',
    'dialog-header': 'flex-between mb-6',
    'dialog-title': 'text-lg font-semibold text-fg',
    'dialog-close': 'btn-icon btn-ghost p-1.5',
    /* Формы */
    'form-label': 'block text-sm font-medium text-fg-muted mb-1',
    'form-label-fg': 'block text-sm font-medium text-fg mb-1',
    'form-actions': 'flex justify-end gap-3 pt-4',
    'type-selector-btn':
      'px-3 py-1.5 text-sm rounded-lg border transition-colors inline-flex items-center gap-1.5',
    'type-selector-btn-active': 'bg-primary border-primary text-on-primary',
    'type-selector-btn-inactive': 'bg-bg border-border text-fg-muted hover:border-border-hover',
    /* Кнопка «добавить» с пунктиром (карточка, колонка) */
    'btn-add-dashed':
      'w-full p-3 border border-dashed border-border rounded-lg text-sm text-fg-muted hover:text-fg hover:border-border-hover hover:bg-bg transition-colors flex-center gap-1.5',
    'btn-add-column':
      'flex-shrink-0 w-72 h-32 border-2 border-dashed border-border rounded-xl flex-center flex-col gap-2 text-fg-muted hover:text-fg hover:border-border-hover hover:bg-muted transition-colors',
    /* Пустое состояние */
    'empty-state-icon': 'w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex-center',
    'empty-state-title': 'text-lg font-medium text-fg mb-2',
    'empty-state-desc': 'text-sm text-fg-muted mb-6',
    /* Загрузка */
    'loading-spinner': 'animate-spin i-lucide-loader-2 text-2xl text-fg-muted',
    /* Выпадающий список */
    'dropdown-panel':
      'absolute top-full left-0 right-0 mt-1 bg-bg border border-border rounded-lg shadow-lg overflow-hidden z-50',
    'dropdown-item':
      'w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left',
    'select-option':
      'relative flex cursor-pointer select-none items-center rounded-md px-3 py-2 text-sm outline-none hover:bg-muted data-[highlighted]:bg-muted',
    /* Контейнер контента страницы: одинаковые отступы везде */
    'page-container': 'max-w-4xl mx-auto px-5 py-10',
    /* Заголовок страницы: один стиль везде */
    'page-header': 'mb-8 cursor-default',
    'page-header-row': 'flex-between mb-8 cursor-default',
    'page-header-text': 'flex flex-col gap-0.5',
    'page-title': 'text-2xl font-bold text-fg tracking-tight cursor-default',
    'page-desc': 'text-sm text-fg-muted cursor-default',
    'link-primary': 'text-primary hover:opacity-90',
    'filter-pill':
      'inline-flex items-center px-3 py-1.5 text-sm rounded-md transition-colors min-w-0 shadow-[0_0_transparent]',
    'filter-pill-active': 'bg-bg text-fg shadow-sm',
    'filter-pill-inactive': 'text-fg-muted hover:text-fg',
    /* Иконки на карточке (раскрыть заметку, редактировать конспект и т.п.) — видны только при наведении на карточку */
    'card-icon-hover': 'opacity-0 group-hover:opacity-100 transition-opacity',
    /* Конспект (payload.summary) на карточке */
    'card-summary':
      'text-xs text-fg-muted min-h-[1.25rem] max-h-[200px] flex-1 min-w-0 whitespace-pre-wrap overflow-y-auto scrollbar-hide',
    'card-summary-readonly': 'text-xs text-fg-muted mt-1.5 whitespace-pre-wrap max-h-[400px] overflow-y-auto scrollbar-hide',
    'card-summary-placeholder': 'text-xs text-fg-muted min-h-[1.25rem] flex-1 min-w-0 opacity-70',
    /* Кнопка редактирования карточки — не блокирует клики по чекбоксу/заголовку, пока не hover */
    'card-edit-float':
      'absolute -top-2 right-2 z-10 w-8 h-8 rounded-full btn-icon bg-bg border border-border shadow-sm text-fg hover:border-primary hover:bg-primary/10 hover:text-fg opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all overflow-visible',
    /* Ручка перетаскивания (чеклист, сортируемые списки) */
    'grip-handle':
      'i-lucide-grip-vertical text-fg-muted cursor-grab active:cursor-grabbing touch-none',
    /* Кнопка «добавить пункт» в формах */
    'link-add': 'text-sm link-primary flex items-center gap-1',
    'header-icon-hover':
      'btn-icon p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-muted-hover text-fg-muted transition-opacity',
  },
  theme: {
    colors: {
      fg: 'var(--fg)',
      'fg-muted': 'var(--fg-muted)',
      bg: 'var(--bg)',
      muted: 'var(--muted)',
      'muted-hover': 'var(--muted-hover)',
      border: 'var(--border)',
      'border-hover': 'var(--border-hover)',
      primary: 'var(--primary)',
      'on-primary': 'var(--on-primary)',
      success: 'var(--success)',
      danger: 'var(--danger)',
      'on-danger': 'var(--on-danger)',
      overlay: 'var(--overlay)',
    },
  },
  safelist: [
    'i-lucide-video',
    'i-lucide-file-text',
    'i-lucide-check-square',
    'i-lucide-link',
    'i-lucide-github',
    'i-lucide-layers',
    'i-lucide-inbox',
    'i-lucide-plus',
    'i-lucide-search',
    'i-lucide-x',
    'i-lucide-check',
    'i-lucide-trash-2',
    'i-lucide-edit-2',
    'i-lucide-pencil',
    'i-lucide-log-out',
    'i-lucide-user',
    'i-lucide-folder',
    'i-lucide-external-link',
    'i-lucide-loader-2',
    'i-lucide-play-circle',
    'i-lucide-arrow-left',
    'i-lucide-folder-x',
    'i-lucide-grip-vertical',
    'i-lucide-sun',
    'i-lucide-moon',
    'i-lucide-maximize-2',
    'i-lucide-arrow-up-down',
  ],
});
