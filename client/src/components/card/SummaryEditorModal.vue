<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue';
import { useCodemirror } from '@/composables/useCodemirror';
import { useThemeStore } from '@/stores/theme';
import { renderMarkdown } from '@/lib/utils';
import { toast } from 'vue-sonner';
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogClose,
  VisuallyHidden,
} from 'radix-vue';

const props = withDefaults(
  defineProps<{
    open: boolean;
    modelValue: string;
    title?: string;
  }>(),
  { title: 'Конспект' }
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
  close: [];
}>();

const themeStore = useThemeStore();

const openProxy = computed({
  get: () => props.open,
  set: (v: boolean) => {
    if (!v) emit('close');
  },
});

const editorContainer = ref<HTMLElement | null>(null);
const previewContainerRef = ref<HTMLElement | null>(null);
const isReadOnly = ref(false);
const previewContent = ref('');
const collapsedSections = ref(new Set<number>());
const showHotkeys = ref(false);

const renderedHtml = computed(() => {
  const src = previewContent.value;
  if (!src) return '<p style="color:rgb(var(--muted));font-style:italic">Пустой конспект</p>';
  return renderMarkdown(src);
});

const { view, create, getDoc, setDoc, setReadOnly, setDark, destroy, focus } = useCodemirror({
  // Ctrl+Enter → save without closing
  onSave: (doc) => {
    emit('update:modelValue', doc.trim());
    toast.success('Сохранено');
  },
});

// Mount/unmount editor when dialog opens/closes
watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      isReadOnly.value = false;
      previewContent.value = props.modelValue;
      collapsedSections.value.clear();
      await nextTick();
      if (editorContainer.value) {
        destroy();
        create(editorContainer.value);
        setDoc(props.modelValue);
        setDark(themeStore.dark);
        await nextTick();
        focus();
      }
    } else {
      destroy();
    }
  }
);

// Sync theme changes while open
watch(
  () => themeStore.dark,
  (isDark) => {
    if (props.open) setDark(isDark);
  }
);

function setMode(ro: boolean) {
  if (isReadOnly.value === ro) return;
  if (ro) {
    previewContent.value = getDoc();
    collapsedSections.value.clear();
  }
  isReadOnly.value = ro;
  setReadOnly(ro);
  if (!ro) {
    nextTick(() => {
      view.value?.requestMeasure();
      focus();
    });
  } else {
    nextTick(() => {
      setupInteractivePreview();
    });
  }
}

function setupInteractivePreview() {
  const container = previewContainerRef.value;
  if (!container) return;

  // Replace checkboxes with non-interactive divs
  const checkboxes = container.querySelectorAll<HTMLInputElement>('.markdown-body input[type="checkbox"]');
  checkboxes.forEach((cb) => {
    const isChecked = cb.checked;
    const replacement = document.createElement('div');
    replacement.className = 'fake-checkbox';
    if (isChecked) replacement.classList.add('checked');
    cb.parentNode?.replaceChild(replacement, cb);
  });

  // Add collapse/expand to headings (h2+ only, not h1)
  const headings = container.querySelectorAll<HTMLElement>('.markdown-body h2, .markdown-body h3, .markdown-body h4, .markdown-body h5, .markdown-body h6');
  headings.forEach((heading, index) => {
    // Remove old icon if exists
    const oldIcon = heading.querySelector('.heading-collapse-icon');
    if (oldIcon) oldIcon.remove();

    const level = Number.parseInt(heading.tagName.substring(1));
    heading.dataset.headingIndex = String(index);
    heading.dataset.level = String(level);
    
    // Add collapse icon
    const icon = document.createElement('span');
    icon.className = 'heading-collapse-icon';
    icon.textContent = collapsedSections.value.has(index) ? '▶' : '▼';
    icon.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleSection(index);
    });
    heading.insertBefore(icon, heading.firstChild);

    // Apply collapsed state
    if (collapsedSections.value.has(index)) {
      applySectionCollapse(heading, level, true);
    }
  });
}

function toggleSection(headingIndex: number) {
  if (collapsedSections.value.has(headingIndex)) {
    collapsedSections.value.delete(headingIndex);
  } else {
    collapsedSections.value.add(headingIndex);
  }

  const container = previewContainerRef.value;
  if (!container) return;

  const heading = container.querySelector<HTMLElement>(`[data-heading-index="${headingIndex}"]`);
  if (!heading) return;

  const level = Number.parseInt(heading.dataset.level ?? '1');
  const isCollapsed = collapsedSections.value.has(headingIndex);
  
  // Update icon
  const icon = heading.querySelector('.heading-collapse-icon');
  if (icon) icon.textContent = isCollapsed ? '▶' : '▼';

  applySectionCollapse(heading, level, isCollapsed);
}

function applySectionCollapse(heading: HTMLElement, level: number, collapse: boolean) {
  let sibling = heading.nextElementSibling as HTMLElement | null;
  while (sibling) {
    // Stop if we hit another heading of same or higher level (lower number)
    const tagName = sibling.tagName;
    if (tagName && /^H[2-6]$/.test(tagName)) {
      const siblingLevel = Number.parseInt(tagName.substring(1));
      if (siblingLevel <= level) break;
    }
    
    sibling.style.display = collapse ? 'none' : '';
    sibling = sibling.nextElementSibling as HTMLElement | null;
  }
}

function saveAndClose() {
  const doc = getDoc();
  emit('update:modelValue', doc.trim());
  emit('close');
}

// Prevent Ctrl+Z in preview mode
function handleKeyDown(e: KeyboardEvent) {
  if (isReadOnly.value && e.ctrlKey && e.key === 'z') {
    e.preventDefault();
    e.stopPropagation();
  }
}

// Re-setup interactive elements when preview content changes
watch(
  () => [isReadOnly.value, renderedHtml.value],
  () => {
    if (isReadOnly.value) {
      nextTick(() => setupInteractivePreview());
    }
  }
);
</script>

<template>
  <DialogRoot v-model:open="openProxy">
    <DialogPortal>
      <DialogOverlay class="dialog-overlay" @click="emit('close')" />
      <DialogContent
        :aria-describedby="undefined"
        class="dialog-content max-h-[85vh] max-w-2xl overflow-hidden flex flex-col"
        @escape-key-down="emit('close')"
        @keydown="handleKeyDown"
      >
        <!-- Header -->
        <div class="dialog-header">
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <VisuallyHidden>
              <DialogTitle>{{ title }}</DialogTitle>
            </VisuallyHidden>

            <!-- Mode tabs (GitHub-style) -->
            <div class="mode-tabs">
              <button
                type="button"
                class="mode-tab"
                :class="!isReadOnly && 'active'"
                @click="setMode(false)"
              >
                <span class="i-lucide-pencil" />
                <span>Редактирование</span>
              </button>
              <button
                type="button"
                class="mode-tab"
                :class="isReadOnly && 'active'"
                @click="setMode(true)"
              >
                <span class="i-lucide-eye" />
                <span>Просмотр</span>
              </button>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              class="icon-btn-ghost"
              title="Горячие клавиши"
              @click="showHotkeys = !showHotkeys"
            >
              <span class="i-lucide-keyboard" />
            </button>

            <DialogClose class="icon-btn-close">
              <span class="i-lucide-x" />
            </DialogClose>
          </div>
        </div>

        <!-- Hotkeys panel -->
        <div v-if="showHotkeys" class="hotkeys-panel">
          <div class="hotkeys-section">
            <h4>Редактирование</h4>
            <div class="hotkey-item">
              <span class="hotkey-key">Ctrl+Enter</span>
              <span class="hotkey-desc">Сохранить</span>
            </div>
            <div class="hotkey-item">
              <span class="hotkey-key">Ctrl+Z</span>
              <span class="hotkey-desc">Отменить (undo)</span>
            </div>
            <div class="hotkey-item">
              <span class="hotkey-key">Ctrl+Y</span>
              <span class="hotkey-desc">Повторить (redo)</span>
            </div>
            <div class="hotkey-item">
              <span class="hotkey-key">Ctrl+H</span>
              <span class="hotkey-desc">Найти/заменить</span>
            </div>
            <div class="hotkey-item">
              <span class="hotkey-key">Ctrl+D</span>
              <span class="hotkey-desc">Выделить следующее совпадение</span>
            </div>
            <div class="hotkey-item">
              <span class="hotkey-key">Alt+Click</span>
              <span class="hotkey-desc">Множественные курсоры</span>
            </div>
            <div class="hotkey-item">
              <span class="hotkey-key">Ctrl+[</span>
              <span class="hotkey-desc">Убрать отступ</span>
            </div>
            <div class="hotkey-item">
              <span class="hotkey-key">Ctrl+]</span>
              <span class="hotkey-desc">Добавить отступ</span>
            </div>
          </div>
          <div class="hotkeys-section">
            <h4>Markdown</h4>
            <div class="hotkey-item">
              <span class="hotkey-code">## Заголовок</span>
              <span class="hotkey-desc">Заголовки (# - #####)</span>
            </div>
            <div class="hotkey-item">
              <span class="hotkey-code">**жирный**</span>
              <span class="hotkey-desc">Жирный текст</span>
            </div>
            <div class="hotkey-item">
              <span class="hotkey-code">*курсив*</span>
              <span class="hotkey-desc">Курсив</span>
            </div>
            <div class="hotkey-item">
              <span class="hotkey-code">- [ ] задача</span>
              <span class="hotkey-desc">Чекбокс</span>
            </div>
            <div class="hotkey-item">
              <span class="hotkey-code">```код```</span>
              <span class="hotkey-desc">Блок кода</span>
            </div>
            <div class="hotkey-item">
              <span class="hotkey-code">[текст](url)</span>
              <span class="hotkey-desc">Ссылка</span>
            </div>
          </div>
          <div class="hotkeys-section">
            <h4>Просмотр</h4>
            <div class="hotkey-item">
              <span class="hotkey-desc">Кликайте на ▼/▶ возле заголовков для сворачивания секций</span>
            </div>
          </div>
        </div>

        <!-- Markdown preview (read mode) -->
        <div
          v-show="isReadOnly"
          ref="previewContainerRef"
          class="summary-pane preview-container flex-1 min-h-0 mt-3 overflow-auto rounded-[var(--r)] border border-border bg-fg/3 p-4 markdown-body markdown-interactive"
          v-html="renderedHtml"
        />

        <!-- CM editor (edit mode) -->
        <div
          v-show="!isReadOnly"
          ref="editorContainer"
          class="summary-pane flex-1 min-h-0 mt-3 overflow-auto rounded-[var(--r)] border border-border bg-fg/3 summary-cm"
        />

        <!-- Footer -->
        <div class="flex items-center justify-between pt-3 mt-3 border-t border-border">
          <span class="text-xs text-muted">Ctrl+Enter — сохранить</span>
          <button type="button" class="btn-primary" @click="saveAndClose">Сохранить и закрыть</button>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style scoped>
.summary-pane {
  max-height: 55vh;
  min-height: 200px;
}

.summary-cm :deep(.cm-editor) {
  height: 100%;
  min-height: 200px;
}

.summary-cm :deep(.cm-scroller) {
  min-height: 200px;
}

/* Interactive preview */
.markdown-interactive :deep(input[type="checkbox"]) {
  cursor: default;
  opacity: 0.7;
  pointer-events: none;
}

/* Fake checkbox replacement */
.markdown-interactive :deep(.fake-checkbox) {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgb(var(--border));
  border-radius: 3px;
  vertical-align: middle;
  margin-right: 0.4em;
  background: rgb(var(--bg));
  flex-shrink: 0;
}

.markdown-interactive :deep(.fake-checkbox.checked) {
  background: rgb(var(--primary));
  border-color: rgb(var(--primary));
  position: relative;
}

.markdown-interactive :deep(.fake-checkbox.checked::after) {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: rgb(var(--on-primary));
  font-size: 12px;
  font-weight: bold;
  line-height: 1;
}

.markdown-interactive :deep(h2),
.markdown-interactive :deep(h3),
.markdown-interactive :deep(h4),
.markdown-interactive :deep(h5),
.markdown-interactive :deep(h6) {
  position: relative;
  display: flex;
  align-items: baseline;
}

.markdown-interactive :deep(.heading-collapse-icon) {
  display: inline-block;
  width: 1em;
  margin-right: 0.5em;
  font-size: 0.75em;
  color: rgb(var(--muted));
  user-select: none;
  cursor: pointer;
  transition: color 0.15s ease;
  flex-shrink: 0;
}

.markdown-interactive :deep(.heading-collapse-icon:hover) {
  color: rgb(var(--fg));
}

/* Mode tabs (GitHub-style) - moved to uno.config.ts */

/* Hotkeys panel */
.hotkeys-panel {
  display: flex;
  gap: 2rem;
  padding: 1rem;
  background: rgb(var(--fg) / 0.03);
  border-radius: var(--r);
  margin-top: 1rem;
  border: 1px solid rgb(var(--border));
  font-size: 13px;
}

.hotkeys-section {
  flex: 1;
  min-width: 0;
}

.hotkeys-section h4 {
  font-size: 13px;
  font-weight: 600;
  margin: 0 0 0.75rem;
  color: rgb(var(--fg));
}

.hotkey-item {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
  line-height: 1.5;
}

.hotkey-key {
  display: inline-block;
  padding: 0.15em 0.5em;
  background: rgb(var(--fg) / 0.08);
  border: 1px solid rgb(var(--border));
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  font-family: ui-monospace, monospace;
  color: rgb(var(--fg));
  white-space: nowrap;
  flex-shrink: 0;
  min-width: 70px;
  text-align: center;
}

.hotkey-code {
  display: inline-block;
  padding: 0.15em 0.5em;
  background: rgb(var(--fg) / 0.08);
  border: 1px solid rgb(var(--border));
  border-radius: 4px;
  font-size: 11px;
  font-family: ui-monospace, monospace;
  color: rgb(var(--primary));
  white-space: nowrap;
  flex-shrink: 0;
}

.hotkey-desc {
  color: rgb(var(--muted));
  font-size: 12px;
}

/* Markdown syntax highlighting in preview */
.preview-container :deep(.markdown-body) {
  line-height: 1.65;
}

/* Headings */
.preview-container :deep(h1) {
  color: rgb(var(--fg));
  font-weight: 700;
  font-size: 2em;
  margin: 1.5rem 0 1rem;
  border-bottom: 2px solid rgb(var(--border));
  padding-bottom: 0.5rem;
}

.preview-container :deep(h2) {
  color: rgb(var(--fg));
  font-weight: 600;
  font-size: 1.5em;
  margin: 1.25rem 0 0.75rem;
  border-bottom: 1px solid rgb(var(--border) / 0.5);
  padding-bottom: 0.35rem;
}

.preview-container :deep(h3) {
  color: rgb(var(--fg));
  font-weight: 600;
  font-size: 1.25em;
  margin: 1rem 0 0.5rem;
}

.preview-container :deep(h4),
.preview-container :deep(h5),
.preview-container :deep(h6) {
  color: rgb(var(--fg));
  font-weight: 600;
  margin: 0.75rem 0 0.5rem;
}

/* Code blocks */
.preview-container :deep(pre) {
  background: rgb(var(--fg) / 0.06);
  border: 1px solid rgb(var(--border));
  border-radius: var(--r);
  padding: 1rem;
  overflow-x: auto;
  margin: 1rem 0;
  line-height: 1.5;
}

.preview-container :deep(pre code) {
  background: transparent !important;
  border: none;
  padding: 0;
  font-size: 0.9em;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
}

/* hljs syntax highlighting - base */
.preview-container :deep(.hljs) {
  display: block;
  overflow-x: auto;
  background: transparent;
  color: rgb(var(--fg));
}

/* Dark theme tokens */
:root.dark .preview-container :deep(.hljs-keyword),
:root.dark .preview-container :deep(.hljs-selector-tag),
:root.dark .preview-container :deep(.hljs-literal),
:root.dark .preview-container :deep(.hljs-tag) {
  color: #c792ea;
  font-weight: normal;
}

:root.dark .preview-container :deep(.hljs-string),
:root.dark .preview-container :deep(.hljs-doctag),
:root.dark .preview-container :deep(.hljs-regexp) {
  color: #c3e88d;
}

:root.dark .preview-container :deep(.hljs-title),
:root.dark .preview-container :deep(.hljs-section),
:root.dark .preview-container :deep(.hljs-selector-id),
:root.dark .preview-container :deep(.hljs-function),
:root.dark .preview-container :deep(.hljs-title.function_) {
  color: #82aaff;
}

:root.dark .preview-container :deep(.hljs-variable),
:root.dark .preview-container :deep(.hljs-attr),
:root.dark .preview-container :deep(.hljs-template-variable),
:root.dark .preview-container :deep(.hljs-type),
:root.dark .preview-container :deep(.hljs-name),
:root.dark .preview-container :deep(.hljs-property) {
  color: #f07178;
}

:root.dark .preview-container :deep(.hljs-number),
:root.dark .preview-container :deep(.hljs-built_in),
:root.dark .preview-container :deep(.hljs-builtin-name),
:root.dark .preview-container :deep(.hljs-params) {
  color: #f78c6c;
}

:root.dark .preview-container :deep(.hljs-comment),
:root.dark .preview-container :deep(.hljs-quote) {
  color: #676e95;
  font-style: italic;
}

:root.dark .preview-container :deep(.hljs-operator),
:root.dark .preview-container :deep(.hljs-punctuation) {
  color: #89ddff;
}

/* Light theme tokens */
:root:not(.dark) .preview-container :deep(.hljs-keyword),
:root:not(.dark) .preview-container :deep(.hljs-selector-tag),
:root:not(.dark) .preview-container :deep(.hljs-literal),
:root:not(.dark) .preview-container :deep(.hljs-tag) {
  color: #d73a49;
  font-weight: 600;
}

:root:not(.dark) .preview-container :deep(.hljs-string),
:root:not(.dark) .preview-container :deep(.hljs-doctag),
:root:not(.dark) .preview-container :deep(.hljs-regexp) {
  color: #22863a;
}

:root:not(.dark) .preview-container :deep(.hljs-title),
:root:not(.dark) .preview-container :deep(.hljs-section),
:root:not(.dark) .preview-container :deep(.hljs-selector-id),
:root:not(.dark) .preview-container :deep(.hljs-function),
:root:not(.dark) .preview-container :deep(.hljs-title.function_) {
  color: #6f42c1;
  font-weight: 600;
}

:root:not(.dark) .preview-container :deep(.hljs-variable),
:root:not(.dark) .preview-container :deep(.hljs-attr),
:root:not(.dark) .preview-container :deep(.hljs-template-variable),
:root:not(.dark) .preview-container :deep(.hljs-type),
:root:not(.dark) .preview-container :deep(.hljs-name),
:root:not(.dark) .preview-container :deep(.hljs-property) {
  color: #e36209;
}

:root:not(.dark) .preview-container :deep(.hljs-number),
:root:not(.dark) .preview-container :deep(.hljs-built_in),
:root:not(.dark) .preview-container :deep(.hljs-builtin-name),
:root:not(.dark) .preview-container :deep(.hljs-params) {
  color: #005cc5;
}

:root:not(.dark) .preview-container :deep(.hljs-comment),
:root:not(.dark) .preview-container :deep(.hljs-quote) {
  color: #6a737d;
  font-style: italic;
}

:root:not(.dark) .preview-container :deep(.hljs-operator),
:root:not(.dark) .preview-container :deep(.hljs-punctuation) {
  color: #24292e;
}

/* Inline code */
.preview-container :deep(code) {
  background: rgb(var(--fg) / 0.08);
  border: 1px solid rgb(var(--border) / 0.5);
  border-radius: 4px;
  padding: 0.2em 0.4em;
  font-size: 0.9em;
  color: rgb(var(--primary));
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
}

/* Links */
.preview-container :deep(a) {
  color: rgb(var(--primary));
  text-decoration: underline;
  text-decoration-color: rgb(var(--primary) / 0.4);
  text-underline-offset: 2px;
  transition: all 0.15s ease;
}

.preview-container :deep(a:hover) {
  text-decoration-color: rgb(var(--primary));
}

/* Bold and italic */
.preview-container :deep(strong) {
  color: rgb(var(--fg));
  font-weight: 600;
}

.preview-container :deep(em) {
  color: rgb(var(--muted));
  font-style: italic;
}

/* Lists */
.preview-container :deep(ul),
.preview-container :deep(ol) {
  margin: 0.75rem 0;
  padding-left: 2em;
}

.preview-container :deep(li) {
  margin: 0.25rem 0;
}

.preview-container :deep(ul > li) {
  list-style: disc;
}

.preview-container :deep(ol > li) {
  list-style: decimal;
}

/* Task lists */
.preview-container :deep(ul > li:has(.fake-checkbox)) {
  list-style: none;
  margin-left: -1.5em;
  display: flex;
  align-items: flex-start;
  gap: 0.5em;
}

/* Blockquotes */
.preview-container :deep(blockquote) {
  border-left: 4px solid rgb(var(--primary) / 0.4);
  margin: 1rem 0;
  padding-left: 1rem;
  color: rgb(var(--muted));
  font-style: italic;
}

.preview-container :deep(blockquote p) {
  margin: 0.5rem 0;
}

/* Horizontal rules */
.preview-container :deep(hr) {
  border: none;
  border-top: 2px solid rgb(var(--border));
  margin: 2rem 0;
}

/* Tables */
.preview-container :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 1rem 0;
}

.preview-container :deep(th),
.preview-container :deep(td) {
  border: 1px solid rgb(var(--border));
  padding: 0.5em 0.75em;
  text-align: left;
}

.preview-container :deep(th) {
  background: rgb(var(--fg) / 0.05);
  font-weight: 600;
  color: rgb(var(--fg));
}

.preview-container :deep(tr:hover) {
  background: rgb(var(--fg) / 0.03);
}

/* Images */
.preview-container :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: var(--r);
  margin: 1rem 0;
}
</style>
