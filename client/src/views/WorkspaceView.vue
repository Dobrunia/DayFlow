<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useWorkspaceStore } from '@/stores/workspace';
import { WORKSPACE_EMOJIS } from '@/lib/workspace-emojis';
import WorkspaceColumn from '@/components/workspace/WorkspaceColumn.vue';
import CreateWorkspaceDialog from '@/components/workspace/CreateWorkspaceDialog.vue';
import { toast } from 'vue-sonner';
import { getGraphQLErrorMessage } from '@/lib/graphql-error';

const route = useRoute();
const router = useRouter();
const workspaceStore = useWorkspaceStore();

const isEditing = ref(false);
const editTitle = ref('');
const showCreateDialog = ref(false);
const showIconPicker = ref(false);
const cardSearch = ref('');

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

// Check if creating new workspace
const isNewWorkspace = computed(() => workspaceId.value === 'new');

watch(
  workspaceId,
  (id) => {
    if (id && id !== 'new') {
      workspaceStore.fetchWorkspace(id);
    } else if (id === 'new') {
      showCreateDialog.value = true;
    }
  },
  { immediate: true }
);

function startEditTitle() {
  if (!workspace.value) return;
  editTitle.value = workspace.value.title;
  isEditing.value = true;
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

async function deleteWorkspace() {
  if (!workspace.value || !confirm('Удалить воркспейс? Это действие нельзя отменить.')) return;

  try {
    await workspaceStore.deleteWorkspace(workspace.value.id);
    router.push('/');
    toast.success('Воркспейс удалён');
  } catch (e) {
    toast.error(getGraphQLErrorMessage(e));
  }
}

function handleWorkspaceCreated(id: string) {
  showCreateDialog.value = false;
  router.replace(`/workspace/${id}`);
}

function handleDialogClose() {
  showCreateDialog.value = false;
  if (isNewWorkspace.value) {
    router.push('/');
  }
}
</script>

<template>
  <div class="h-[calc(100vh-4rem)] flex flex-col">
    <!-- Create Dialog -->
    <CreateWorkspaceDialog
      :open="showCreateDialog"
      @close="handleDialogClose"
      @created="handleWorkspaceCreated"
    />

    <!-- Loading -->
    <div v-if="loading && !isNewWorkspace" class="flex-1 flex-center">
      <div class="loading-spinner" />
    </div>

    <!-- Workspace Content -->
    <template v-else-if="workspace">
      <!-- Header -->
      <div class="flex-shrink-0 px-6 py-4 border-b border-border bg-bg">
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-4 shrink-0">
            <!-- Back button -->
            <RouterLink to="/" class="icon-btn-ghost">
              <span class="i-lucide-arrow-left" />
            </RouterLink>

            <!-- Workspace icon (click to change) -->
            <div class="relative shrink-0 z-[60]">
              <button
                type="button"
                class="w-9 h-9 rounded-lg flex-center text-xl bg-muted/50 hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                title="Сменить иконку"
                @click="showIconPicker = !showIconPicker"
              >
                <span v-if="workspace.icon">{{ workspace.icon }}</span>
                <span v-else class="i-lucide-layout-grid text-base text-fg-muted" />
              </button>
              <div
                v-if="showIconPicker"
                class="absolute top-full left-0 mt-1 p-2.5 rounded-xl border border-border bg-bg shadow-xl w-[min(352px,90vw)] grid grid-cols-8 gap-1.5 max-h-[260px] overflow-y-auto overflow-x-hidden scrollbar-hide"
              >
                <button
                  v-for="emoji in WORKSPACE_EMOJIS"
                  :key="emoji"
                  type="button"
                  class="w-9 h-9 rounded-lg flex-center text-xl hover:bg-muted transition-colors shrink-0"
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
              v-model="editTitle"
              @keyup.enter="saveTitle"
              @keyup.escape="isEditing = false"
              @blur="saveTitle"
              class="input w-full text-xl font-bold py-1 px-2"
              autofocus
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
                class="absolute left-2.5 top-1/2 -translate-y-1/2 i-lucide-search text-fg-muted text-sm pointer-events-none"
              />
              <input
                v-model="cardSearch"
                type="text"
                placeholder="Поиск карточек..."
                class="input pl-8 pr-8 py-1.5 w-48 text-sm"
              />
              <button
                v-if="cardSearch"
                type="button"
                class="absolute right-2 top-1/2 -translate-y-1/2 text-fg-muted hover:text-fg"
                @click="cardSearch = ''"
              >
                <span class="i-lucide-x text-sm" />
              </button>
            </div>
            <button @click="addColumn" class="btn-secondary gap-1.5">
              <span class="i-lucide-plus" />
              Колонка
            </button>

            <button @click="deleteWorkspace" class="icon-btn-danger" title="Удалить воркспейс">
              <span class="i-lucide-trash-2 text-xs" />
            </button>
          </div>
        </div>

        <!-- Description -->
        <p v-if="workspace.description" class="page-desc mt-2 ml-12">
          {{ workspace.description }}
        </p>
      </div>

      <!-- Backlog + Columns -->
      <div class="flex-1 overflow-x-auto overflow-y-hidden">
        <div class="h-full flex gap-4 p-6" style="min-width: max-content">
          <WorkspaceColumn
            :column="backlogColumn"
            :workspace-id="workspace.id"
            :backlog-cards="backlogCards"
            :is-backlog-column="true"
            :search-query="cardSearch"
          />

          <WorkspaceColumn
            v-for="column in columns"
            :key="column.id"
            :column="column"
            :workspace-id="workspace.id"
            :search-query="cardSearch"
          />

          <!-- Add Column Button (placeholder) -->
          <button @click="addColumn" class="btn-add-column flex-shrink-0">
            <span class="i-lucide-plus text-xl" />
            <span class="text-sm">Добавить колонку</span>
          </button>
        </div>
      </div>
    </template>

    <!-- Not Found -->
    <div v-else-if="!isNewWorkspace" class="flex-1 flex-center flex-col gap-4">
      <span class="i-lucide-folder-x text-4xl text-fg-muted" />
      <p class="text-fg-muted">Воркспейс не найден</p>
      <RouterLink to="/" class="btn-primary"> На главную </RouterLink>
    </div>
  </div>
</template>
