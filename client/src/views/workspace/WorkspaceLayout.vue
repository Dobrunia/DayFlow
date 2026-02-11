<script setup lang="ts">
import { computed, ref, watch, nextTick, provide } from 'vue';
import { useRoute, useRouter, RouterLink, RouterView } from 'vue-router';
import { useWorkspaceStore } from '@/stores/workspace';
import EmojiPickerPopover from '@/components/common/EmojiPickerPopover.vue';
import ToolboxPanel from '@/components/toolbox/ToolboxPanel.vue';
import SearchInput from '@/components/common/SearchInput.vue';
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

const isEditing = ref(false);
const editTitle = ref('');
const showEditModal = ref(false);
const editModalTitle = ref('');
const editModalDescription = ref('');
const editModalLoading = ref(false);
const confirmDelete = ref(false);
const titleInputRef = ref<HTMLInputElement | null>(null);

// Board-specific state (lives here so search stays in the original header)
const cardSearch = ref('');
const showSummariesModal = ref(false);
const showToolbox = ref(false);

// Provide cardSearch to child routes (WorkspaceView needs it)
provide('cardSearch', cardSearch);

const workspaceId = computed(() => route.params.id as string);
const workspace = computed(() => workspaceStore.currentWorkspace);
const loading = computed(() => workspaceStore.loading);
const columns = computed(() => workspace.value?.columns ?? []);
const backlogCards = computed(() => workspace.value?.backlog ?? []);
const tools = computed(() => workspace.value?.tools ?? []);

const currentMode = computed(() => {
  const name = route.name as string;
  if (name === 'workspace-roadmap') return 'roadmap';
  return 'board';
});

const isBoardRoute = computed(() => currentMode.value === 'board');

watch(
  workspaceId,
  (id) => {
    if (id) workspaceStore.fetchWorkspace(id);
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

async function setIcon(emoji: string) {
  if (!workspace.value) return;
  try {
    await workspaceStore.updateWorkspace(workspace.value.id, { icon: emoji });
  } catch (e) {
    toast.error(getGraphQLErrorMessage(e));
  }
}

function openEditModal() {
  if (!workspace.value) return;
  editModalTitle.value = workspace.value.title;
  editModalDescription.value = workspace.value.description ?? '';
  confirmDelete.value = false;
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
    toast(`«${wsTitle}» удалён`);
  } catch (e) {
    toast.error(getGraphQLErrorMessage(e));
  }
}

// Summaries (board-specific but in header)
const allSummaries = computed(() => {
  if (!workspace.value) return [];
  const summaries: { cardTitle: string; columnTitle: string; summary: string }[] = [];
  for (const card of backlogCards.value) {
    const payload =
      typeof card.payload === 'string' ? JSON.parse(card.payload || '{}') : card.payload;
    const summary = (payload as { summary?: string })?.summary?.trim();
    if (summary)
      summaries.push({ cardTitle: card.title || '(без названия)', columnTitle: 'Беклог', summary });
  }
  for (const col of columns.value) {
    for (const card of col.cards ?? []) {
      const payload =
        typeof card.payload === 'string' ? JSON.parse(card.payload || '{}') : card.payload;
      const summary = (payload as { summary?: string })?.summary?.trim();
      if (summary)
        summaries.push({
          cardTitle: card.title || '(без названия)',
          columnTitle: col.title,
          summary,
        });
    }
  }
  return summaries;
});

const summariesText = computed(() => {
  if (!workspace.value) return '';
  let text = `# ${workspace.value.title}\n\n`;
  for (const item of allSummaries.value) {
    text += `## ${item.cardTitle}\n> ${item.columnTitle}\n\n${item.summary}\n\n---\n\n`;
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
  <div class="h-[calc(100vh-128px)] flex flex-col relative overflow-hidden">
    <!-- Loading -->
    <div v-if="loading" class="flex-1 flex-center">
      <span class="i-lucide-loader-2 animate-spin text-2xl text-muted" />
    </div>

    <!-- Workspace Content -->
    <template v-else-if="workspace">
      <!-- Original Header (untouched) -->
      <div class="flex-shrink-0 px-6 py-2">
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-4 shrink-0">
            <!-- Back button -->
            <RouterLink
              to="/"
              class="inline-flex items-center gap-1 text-link hover:underline underline-offset-3"
            >
              <span class="i-lucide-arrow-left" />
              <span>Воркспейсы</span>
            </RouterLink>

            <!-- Workspace icon (click to change) -->
            <div class="relative shrink-0">
              <EmojiPickerPopover :model-value="workspace.icon || ''" @update:model-value="setIcon">
                <button
                  type="button"
                  class="w-9 h-9 rounded-[var(--r)] flex-center text-xl bg-fg/5 hover:bg-fg/10 transition-colors"
                  title="Сменить иконку"
                >
                  <span v-if="workspace.icon">{{ workspace.icon }}</span>
                  <span v-else class="i-lucide-layout-grid text-base text-muted" />
                </button>
              </EmojiPickerPopover>
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

          <!-- Search + Actions (same as original) -->
          <div class="flex items-center gap-3">
            <template v-if="isBoardRoute">
              <SearchInput
                v-model="cardSearch"
                placeholder="Поиск карточек..."
                class="w-48"
              />
              <button
                v-if="allSummaries.length > 0"
                @click="showSummariesModal = true"
                class="btn-ghost"
                title="Все конспекты"
              >
                <span class="i-lucide-book-open" />
                <span>Конспекты</span>
              </button>

              <button
                @click.stop="showToolbox = !showToolbox"
                @mousedown.stop
                class="btn-ghost"
                :class="{ 'text-primary bg-primary/10': showToolbox }"
                title="Инструменты"
              >
                <span class="i-lucide-box" />
              </button>
            </template>

            <button @click="openEditModal" class="btn-ghost" title="Настройки воркспейса">
              <span class="i-lucide-settings" />
            </button>
          </div>
        </div>

        <!-- Sub-header: Description (left) + Mode tabs (right) -->
        <div class="flex items-center gap-4 mt-2">
          <p v-if="workspace.description" class="page-desc flex-1 min-w-0 truncate">
            {{ workspace.description }}
          </p>
          <span v-else class="flex-1" />

          <div class="mode-tabs shrink-0">
            <RouterLink
              :to="`/workspace/${workspaceId}/board`"
              class="mode-tab"
              active-class="active"
            >
              <span class="i-lucide-columns-3 text-sm" />
              <span>Доска</span>
            </RouterLink>
            <RouterLink
              :to="`/workspace/${workspaceId}/roadmap`"
              class="mode-tab"
              active-class="active"
            >
              <span class="i-lucide-map text-sm" />
              <span>Роадмап</span>
            </RouterLink>
          </div>
        </div>
      </div>

      <!-- Child route content -->
      <RouterView />

      <!-- Toolbox Panel (board only) -->
      <ToolboxPanel
        v-if="isBoardRoute"
        :is-open="showToolbox"
        :workspace-id="workspace.id"
        :tools="tools"
        @close="showToolbox = false"
      />
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
              <span>Копировать</span>
            </button>
            <button type="button" class="btn-primary" @click="downloadSummaries">
              <span class="i-lucide-download" />
              <span>Скачать .md</span>
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
              <div v-if="confirmDelete" class="flex items-center gap-2">
                <span class="text-sm text-danger">Это необратимо! Удалить?</span>
                <button type="button" class="btn-delete" @click="deleteWorkspace">
                  <span>Да</span>
                </button>
                <button type="button" class="btn-ghost" @click="confirmDelete = false">
                  <span>Нет</span>
                </button>
              </div>
              <button v-else type="button" class="btn-delete" @click="confirmDelete = true">
                <span class="i-lucide-trash-2" />
                <span>Удалить</span>
              </button>
              <button type="submit" class="btn-primary" :disabled="editModalLoading">
                <span v-if="editModalLoading" class="i-lucide-loader-2 animate-spin" />
                <span>Сохранить</span>
              </button>
            </div>
          </form>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  </div>
</template>
