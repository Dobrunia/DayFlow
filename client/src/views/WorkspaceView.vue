<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useWorkspaceStore } from '@/stores/workspace';
import { WORKSPACE_EMOJIS } from '@/lib/workspace-emojis';
import WorkspaceColumn from '@/components/workspace/WorkspaceColumn.vue';
import { toast } from 'vue-sonner';
import { getGraphQLErrorMessage } from '@/lib/graphql-error';
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogClose,
} from 'radix-vue';

const route = useRoute();
const router = useRouter();
const workspaceStore = useWorkspaceStore();

const columnsContainer = ref<HTMLElement | null>(null);

function handleWheel(e: WheelEvent) {
  const target = e.target as HTMLElement;
  // Если курсор внутри вертикально скроллящегося контейнера — не перехватываем
  const scrollableParent = target.closest('.overflow-y-auto, .overflow-auto');
  if (scrollableParent && scrollableParent !== columnsContainer.value) return;

  if (!columnsContainer.value || e.deltaY === 0) return;
  e.preventDefault();
  columnsContainer.value.scrollLeft += e.deltaY;
}

const isEditing = ref(false);
const editTitle = ref('');
const showIconPicker = ref(false);
const showSummariesModal = ref(false);
const showEditModal = ref(false);
const editModalTitle = ref('');
const editModalDescription = ref('');
const editModalLoading = ref(false);
const cardSearch = ref('');
const titleInputRef = ref<HTMLInputElement | null>(null);

const workspaceId = computed(() => route.params.id as string);
const workspace = computed(() => workspaceStore.currentWorkspace);
const columns = computed(() => workspace.value?.columns ?? []);
const backlogCards = computed(() => workspace.value?.backlog ?? []);

const backlogColumn = computed(() => ({
  id: 'backlog',
  title: 'Беклог',
  order: -1,
  cards: [] as never[],
}));

const loading = computed(() => workspaceStore.loading);

watch(
  workspaceId,
  (id) => {
    if (id) {
      workspaceStore.fetchWorkspace(id);
    }
  },
  { immediate: true }
);

async function startEditTitle() {
  if (!workspace.value) return;
  editTitle.value = workspace.value.title;
  isEditing.value = true;
  await nextTick();
  titleInputRef.value?.focus();
}

async function saveTitle() {
  if (!workspace.value || editTitle.value.trim() === workspace.value.title) {
    isEditing.value = false;
    return;
  }

  try {
    await workspaceStore.updateWorkspace(workspace.value.id, { title: editTitle.value.trim() });
    isEditing.value = false;
  } catch (e) {
    toast.error(getGraphQLErrorMessage(e));
  }
}

async function addColumn() {
  if (!workspace.value) return;

  try {
    await workspaceStore.createColumn(workspace.value.id, 'Новая колонка');
  } catch (e) {
    toast.error(getGraphQLErrorMessage(e));
  }
}

async function setIcon(emoji: string) {
  if (!workspace.value) return;
  try {
    await workspaceStore.updateWorkspace(workspace.value.id, { icon: emoji });
    showIconPicker.value = false;
  } catch (e) {
    toast.error(getGraphQLErrorMessage(e));
  }
}

function openEditModal() {
  if (!workspace.value) return;
  editModalTitle.value = workspace.value.title;
  editModalDescription.value = workspace.value.description ?? '';
  showEditModal.value = true;
}

async function saveWorkspaceEdit() {
  if (!workspace.value) return;
  const title = editModalTitle.value.trim();
  if (!title) {
    toast.error('Введите название воркспейса');
    return;
  }

  try {
    editModalLoading.value = true;
    await workspaceStore.updateWorkspace(workspace.value.id, {
      title,
      description: editModalDescription.value.trim() || undefined,
    });
    showEditModal.value = false;
    toast.success('Сохранено');
  } catch (e) {
    toast.error(getGraphQLErrorMessage(e));
  } finally {
    editModalLoading.value = false;
  }
}

async function deleteWorkspace() {
  if (!workspace.value) return;

  const wsTitle = workspace.value.title;
  showEditModal.value = false;

  try {
    await workspaceStore.deleteWorkspace(workspace.value.id);
    router.push('/');
    toast(`«${wsTitle}» удалён`, {
      action: {
        label: 'Отменить',
        onClick: () => {
          workspaceStore
            .undoDeleteWorkspace()
            .then((newId) => {
              if (newId) {
                toast.success('Воркспейс восстановлен');
                router.push(`/workspace/${newId}`);
              }
            })
            .catch((e) => {
              toast.error(getGraphQLErrorMessage(e));
            });
        },
      },
    });
  } catch (e) {
    toast.error(getGraphQLErrorMessage(e));
  }
}

// Собираем все конспекты из карточек воркспейса
const allSummaries = computed(() => {
  if (!workspace.value) return [];

  const summaries: { cardTitle: string; columnTitle: string; summary: string }[] = [];

  // Беклог
  for (const card of backlogCards.value) {
    const payload =
      typeof card.payload === 'string' ? JSON.parse(card.payload || '{}') : card.payload;
    const summary = (payload as { summary?: string })?.summary?.trim();
    if (summary) {
      summaries.push({
        cardTitle: card.title || '(без названия)',
        columnTitle: 'Беклог',
        summary,
      });
    }
  }

  // Колонки
  for (const col of columns.value) {
    for (const card of col.cards ?? []) {
      const payload =
        typeof card.payload === 'string' ? JSON.parse(card.payload || '{}') : card.payload;
      const summary = (payload as { summary?: string })?.summary?.trim();
      if (summary) {
        summaries.push({
          cardTitle: card.title || '(без названия)',
          columnTitle: col.title,
          summary,
        });
      }
    }
  }

  return summaries;
});

const summariesText = computed(() => {
  if (!workspace.value) return '';

  let text = `# ${workspace.value.title}\n\n`;

  for (const item of allSummaries.value) {
    text += `## ${item.cardTitle}\n`;
    text += `> ${item.columnTitle}\n\n`;
    text += `${item.summary}\n\n---\n\n`;
  }

  return text.trim();
});

function copySummaries() {
  navigator.clipboard.writeText(summariesText.value).then(
    () => toast.success('Конспекты скопированы'),
    () => toast.error('Не удалось скопировать')
  );
}

function downloadSummaries() {
  if (!workspace.value) return;

  const blob = new Blob([summariesText.value], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${workspace.value.title} — конспекты.md`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  toast.success('Файл скачан');
}
</script>

<template>
  <div class="h-[calc(100vh-128px)] flex flex-col">
    <!-- Loading -->
    <div v-if="loading" class="flex-1 flex-center">
      <span class="i-lucide-loader-2 animate-spin text-2xl text-muted" />
    </div>

    <!-- Workspace Content -->
    <template v-else-if="workspace">
      <!-- Header -->
      <div class="flex-shrink-0 px-6 py-2">
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-4 shrink-0">
            <!-- Back button -->
            <RouterLink
              to="/"
              class="inline-flex items-center gap-1 text-link hover:underline underline-offset-3"
            >
              <span class="i-lucide-arrow-left" />
              <span>Назад</span>
            </RouterLink>

            <!-- Workspace icon (click to change) -->
            <div class="relative shrink-0">
              <button
                type="button"
                class="w-9 h-9 rounded-[var(--r)] flex-center text-xl bg-fg/5 hover:bg-fg/10 transition-colors"
                title="Сменить иконку"
                @click="showIconPicker = !showIconPicker"
              >
                <span v-if="workspace.icon">{{ workspace.icon }}</span>
                <span v-else class="i-lucide-layout-grid text-base text-muted" />
              </button>
              <div
                v-if="showIconPicker"
                class="absolute top-full left-0 mt-1 p-2.5 card w-[min(352px,90vw)] grid grid-cols-8 gap-1.5 max-h-[260px] overflow-y-auto scrollbar-hide z-20"
              >
                <button
                  v-for="emoji in WORKSPACE_EMOJIS"
                  :key="emoji"
                  type="button"
                  class="w-9 h-9 rounded-[var(--r)] flex-center text-xl hover:bg-fg/6 transition-colors shrink-0"
                  @click="setIcon(emoji)"
                >
                  {{ emoji }}
                </button>
              </div>
            </div>
          </div>

          <!-- Title (editable) -->
          <div class="flex-1 min-w-0">
            <input
              v-if="isEditing"
              ref="titleInputRef"
              v-model="editTitle"
              @keyup.enter="saveTitle"
              @keyup.escape="isEditing = false"
              @blur="saveTitle"
              class="input w-full text-xl font-bold py-1 px-2"
            />
            <h1
              v-else
              :title="workspace.title"
              class="text-xl font-bold text-fg cursor-text truncate"
              @dblclick="startEditTitle"
            >
              {{ workspace.title }}
            </h1>
          </div>

          <!-- Search + Actions -->
          <div class="flex items-center gap-3">
            <div class="relative">
              <span
                class="absolute left-2.5 top-1/2 -translate-y-1/2 i-lucide-search text-muted text-sm pointer-events-none"
              />
              <input
                v-model="cardSearch"
                type="text"
                placeholder="Поиск карточек..."
                class="input pl-8 pr-8 h-9 w-48 text-sm"
              />
              <button
                v-if="cardSearch"
                type="button"
                class="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-fg"
                @click="cardSearch = ''"
              >
                <span class="i-lucide-x text-sm" />
              </button>
            </div>
            <button
              v-if="allSummaries.length > 0"
              @click="showSummariesModal = true"
              class="btn-ghost"
              title="Все конспекты"
            >
              <span class="i-lucide-book-open" />
              Конспекты
            </button>

            <button @click="openEditModal" class="icon-btn-edit" title="Редактировать воркспейс">
              <span class="i-lucide-edit-2" />
            </button>
          </div>
        </div>

        <!-- Description -->
        <p v-if="workspace.description" class="page-desc mt-2">
          {{ workspace.description }}
        </p>
      </div>

      <!-- Backlog + Columns -->
      <div
        ref="columnsContainer"
        class="flex-1 overflow-x-auto overflow-y-hidden workspace-scroll"
        @wheel="handleWheel"
      >
        <div class="h-full flex gap-4 px-6 pb-6" style="min-width: max-content">
          <WorkspaceColumn
            :column="backlogColumn"
            :workspace-id="workspace.id"
            :backlog-cards="backlogCards"
            :is-backlog-column="true"
            :search-query="cardSearch"
          />

          <WorkspaceColumn
            v-for="(column, idx) in columns"
            :key="column.id"
            :is-first="idx === 0"
            :is-last="idx === columns.length - 1"
            :column="column"
            :workspace-id="workspace.id"
            :search-query="cardSearch"
          />

          <!-- Add Column Button -->
          <button
            v-if="columns.length < 20"
            @click="addColumn"
            class="shrink-0 w-72 h-32 border-2 border-dashed border-border rounded-[var(--r)] flex-center flex-col gap-2 text-muted hover:text-fg hover:border-fg/30 transition-colors"
          >
            <span class="i-lucide-plus text-xl" />
            <span class="text-sm">Добавить колонку</span>
          </button>
        </div>
      </div>
    </template>

    <!-- Not Found -->
    <div v-else class="flex-1 flex-center flex-col gap-4">
      <span class="i-lucide-folder-x text-4xl text-muted" />
      <p class="text-muted">Воркспейс не найден</p>
      <RouterLink to="/" class="btn-primary">На главную</RouterLink>
    </div>

    <!-- Summaries Modal -->
    <DialogRoot v-model:open="showSummariesModal">
      <DialogPortal>
        <DialogOverlay class="dialog-overlay" @click="showSummariesModal = false" />
        <DialogContent
          :aria-describedby="undefined"
          class="dialog-content max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
          @escape-key-down="showSummariesModal = false"
        >
          <div class="dialog-header">
            <DialogTitle class="dialog-title">Все конспекты</DialogTitle>
            <DialogClose class="icon-btn-close">
              <span class="i-lucide-x" />
            </DialogClose>
          </div>

          <div class="flex-1 overflow-y-auto pr-2 -mr-2 space-y-4">
            <div
              v-for="(item, idx) in allSummaries"
              :key="idx"
              class="p-3 rounded-[var(--r)] bg-fg/3 border-l-2 border-primary/40"
            >
              <div class="flex items-center gap-2 mb-2">
                <span class="text-sm font-medium text-fg">{{ item.cardTitle }}</span>
                <span class="text-xs text-muted">{{ item.columnTitle }}</span>
              </div>
              <p class="text-sm text-muted whitespace-pre-wrap">{{ item.summary }}</p>
            </div>

            <div v-if="allSummaries.length === 0" class="text-center py-8 text-muted">
              Нет конспектов
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-4 border-t border-border mt-4">
            <button type="button" class="btn-ghost" @click="copySummaries">
              <span class="i-lucide-copy" />
              Копировать
            </button>
            <button type="button" class="btn-primary" @click="downloadSummaries">
              <span class="i-lucide-download" />
              Скачать .md
            </button>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>

    <!-- Edit Workspace Modal -->
    <DialogRoot v-model:open="showEditModal">
      <DialogPortal>
        <DialogOverlay class="dialog-overlay" @click="showEditModal = false" />
        <DialogContent
          :aria-describedby="undefined"
          class="dialog-content max-w-md"
          @escape-key-down="showEditModal = false"
        >
          <div class="dialog-header">
            <DialogTitle class="dialog-title">Редактировать воркспейс</DialogTitle>
            <DialogClose class="icon-btn-close">
              <span class="i-lucide-x" />
            </DialogClose>
          </div>

          <form @submit.prevent="saveWorkspaceEdit" class="space-y-4">
            <div>
              <label for="ws-edit-title" class="block text-sm font-medium mb-1">Название *</label>
              <input
                id="ws-edit-title"
                v-model="editModalTitle"
                type="text"
                class="input"
                required
              />
            </div>
            <div>
              <label for="ws-edit-desc" class="block text-sm font-medium mb-1">Описание</label>
              <textarea
                id="ws-edit-desc"
                v-model="editModalDescription"
                class="textarea h-24"
                placeholder="Опционально"
              />
            </div>
            <div class="flex justify-between items-center gap-3 pt-4">
              <button type="button" class="btn-delete" @click="deleteWorkspace">
                <span class="i-lucide-trash-2" />
                Удалить
              </button>
              <button type="submit" class="btn-primary" :disabled="editModalLoading">
                <span v-if="editModalLoading" class="i-lucide-loader-2 animate-spin" />
                Сохранить
              </button>
            </div>
          </form>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  </div>
</template>

<style scoped>
/* Видимый горизонтальный скроллбар для колонок */
.workspace-scroll::-webkit-scrollbar {
  height: 10px;
}

.workspace-scroll::-webkit-scrollbar-track {
  background: rgb(var(--fg) / 0.05);
  border-radius: 5px;
  margin: 0 24px;
}

.workspace-scroll::-webkit-scrollbar-thumb {
  background: rgb(var(--fg) / 0.2);
  border-radius: 5px;
}

.workspace-scroll::-webkit-scrollbar-thumb:hover {
  background: rgb(var(--fg) / 0.3);
}

.workspace-scroll {
  scrollbar-width: auto;
  scrollbar-color: rgb(var(--fg) / 0.2) rgb(var(--fg) / 0.05);
}
</style>
