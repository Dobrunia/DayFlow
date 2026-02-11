<script setup lang="ts">
import { computed, ref, watch, nextTick, provide, onBeforeUnmount } from 'vue';
import { useRoute, useRouter, RouterLink, RouterView, onBeforeRouteLeave } from 'vue-router';
import { useWorkspaceStore } from '@/stores/workspace';
import { useAuthStore } from '@/stores/auth';
import { apolloClient } from '@/lib/apollo';
import {
  GENERATE_INVITE_TOKEN_MUTATION,
  REMOVE_WORKSPACE_MEMBER_MUTATION,
  ACQUIRE_WORKSPACE_LOCK_MUTATION,
  RELEASE_WORKSPACE_LOCK_MUTATION,
  HEARTBEAT_WORKSPACE_LOCK_MUTATION,
} from '@/graphql/mutations';
import EmojiPickerPopover from '@/components/common/EmojiPickerPopover.vue';
import ToolboxPanel from '@/components/toolbox/ToolboxPanel.vue';
import SearchInput from '@/components/common/SearchInput.vue';
import CopyButton from '@/components/common/CopyButton.vue';
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
const authStore = useAuthStore();

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
  { immediate: true },
);

// ── Editing lock ─────────────────────────────────────────────────────────────

const lockHeld = ref(false);
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

const lockedByOther = computed(() => {
  const ws = workspace.value;
  if (!ws?.editingBy) return false;
  return ws.editingBy !== authStore.user?.id;
});

const lockUser = computed(() => workspace.value?.editingUser ?? null);

const isReadOnly = computed(() => lockedByOther.value);

// Provide read-only flag to child routes
provide('isReadOnly', isReadOnly);

async function acquireLock() {
  if (!workspace.value) return;
  try {
    await apolloClient.mutate({
      mutation: ACQUIRE_WORKSPACE_LOCK_MUTATION,
      variables: { workspaceId: workspace.value.id },
    });
    lockHeld.value = true;
    startHeartbeat();
  } catch {
    // Lock held by someone else — just poll to refresh state
    await workspaceStore.fetchWorkspace(workspace.value.id);
  }
}

async function releaseLock() {
  stopHeartbeat();
  if (!lockHeld.value || !workspace.value) return;
  lockHeld.value = false;
  try {
    await apolloClient.mutate({
      mutation: RELEASE_WORKSPACE_LOCK_MUTATION,
      variables: { workspaceId: workspace.value.id },
    });
  } catch {
    // best-effort
  }
}

function startHeartbeat() {
  stopHeartbeat();
  heartbeatTimer = setInterval(async () => {
    if (!lockHeld.value || !workspace.value) return;
    try {
      await apolloClient.mutate({
        mutation: HEARTBEAT_WORKSPACE_LOCK_MUTATION,
        variables: { workspaceId: workspace.value.id },
      });
    } catch {
      // lost lock
      lockHeld.value = false;
      stopHeartbeat();
    }
  }, 15_000);
}

function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

// Poll lock state for non-lock-holders (every 10s)
let lockPollTimer: ReturnType<typeof setInterval> | null = null;

watch(
  [workspace, lockHeld],
  () => {
    if (lockPollTimer) {
      clearInterval(lockPollTimer);
      lockPollTimer = null;
    }
    // If we DON'T hold the lock, poll periodically to detect when it's freed
    if (workspace.value && !lockHeld.value) {
      lockPollTimer = setInterval(async () => {
        if (workspace.value) {
          await workspaceStore.fetchWorkspace(workspace.value.id);
          // Auto-acquire if lock just freed
          if (!workspace.value.editingBy) {
            await acquireLock();
          }
        }
      }, 10_000);
    }
  },
  { immediate: true },
);

// Acquire lock when workspace loads
watch(
  workspace,
  (ws) => {
    if (ws && !lockHeld.value && !lockedByOther.value) {
      acquireLock();
    }
  },
  { immediate: true },
);

// Release lock on leave
onBeforeRouteLeave(() => {
  releaseLock();
});

onBeforeUnmount(() => {
  releaseLock();
  if (lockPollTimer) clearInterval(lockPollTimer);
});

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

// ── Sharing ──────────────────────────────────────────────────────────────────

const showShareModal = ref(false);
const generatingToken = ref(false);

const isOwner = computed(
  () => workspace.value?.owner?.id === authStore.user?.id,
);

const inviteUrl = computed(() => {
  const token = workspace.value?.inviteToken;
  if (!token) return '';
  return `${window.location.origin}/invite/${token}`;
});

async function generateInviteToken() {
  if (!workspace.value) return;
  try {
    generatingToken.value = true;
    await apolloClient.mutate({
      mutation: GENERATE_INVITE_TOKEN_MUTATION,
      variables: { workspaceId: workspace.value.id },
    });
    // Re-fetch to update local state (computed is readonly)
    await workspaceStore.fetchWorkspace(workspace.value.id);
    toast.success('Ссылка сгенерирована');
  } catch (e) {
    toast.error(getGraphQLErrorMessage(e));
  } finally {
    generatingToken.value = false;
  }
}

async function removeMember(userId: string) {
  if (!workspace.value) return;
  try {
    await apolloClient.mutate({
      mutation: REMOVE_WORKSPACE_MEMBER_MUTATION,
      variables: { workspaceId: workspace.value.id, userId },
    });
    await workspaceStore.fetchWorkspace(workspace.value.id);
    toast.success('Участник удалён');
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
      <!-- Lock banner -->
      <div
        v-if="lockedByOther && lockUser"
        class="flex-shrink-0 px-6 py-2 bg-warning/10 border-b border-warning/30 flex items-center gap-2 text-sm"
      >
        <span class="i-lucide-lock text-warning" />
        <span class="text-fg">
          Сейчас редактирует <strong>{{ lockUser.email }}</strong> — режим просмотра
        </span>
      </div>

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

            <button @click="showShareModal = true" class="btn-ghost" title="Совместный доступ">
              <span class="i-lucide-share-2" />
            </button>
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
            <CopyButton :text="summariesText" success-message="Конспекты скопированы" title="Копировать" />
            <button type="button" class="btn-primary" @click="downloadSummaries">
              <span class="i-lucide-download" />
              <span>Скачать .md</span>
            </button>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>

    <!-- Share Modal -->
    <DialogRoot v-model:open="showShareModal">
      <DialogPortal>
        <DialogOverlay class="dialog-overlay" @click="showShareModal = false" />
        <DialogContent
          :aria-describedby="undefined"
          class="dialog-content max-w-md"
          @escape-key-down="showShareModal = false"
        >
          <div class="dialog-header">
            <DialogTitle class="dialog-title">Совместный доступ</DialogTitle>
            <DialogClose class="icon-btn-close">
              <span class="i-lucide-x" />
            </DialogClose>
          </div>

          <div class="space-y-5">
            <!-- Invite link -->
            <template v-if="isOwner">
              <div>
                <p class="text-sm font-medium mb-2">Пригласительная ссылка</p>
                <div v-if="inviteUrl" class="flex items-center gap-2">
                  <input
                    type="text"
                    :value="inviteUrl"
                    readonly
                    class="input flex-1 text-xs font-mono select-all"
                    @focus="($event.target as HTMLInputElement).select()"
                  />
                  <CopyButton :text="inviteUrl" success-message="Ссылка скопирована" />
                </div>
                <p v-else class="text-xs text-muted mb-2">Ссылка ещё не создана</p>
                <button
                  type="button"
                  class="btn-ghost mt-2"
                  :disabled="generatingToken"
                  @click="generateInviteToken"
                >
                  <span v-if="generatingToken" class="i-lucide-loader-2 animate-spin" />
                  <span class="i-lucide-refresh-cw" v-else />
                  <span>{{ inviteUrl ? 'Перегенерировать' : 'Создать ссылку' }}</span>
                </button>
              </div>
            </template>

            <!-- Members list -->
            <div>
              <p class="text-sm font-medium mb-2">Участники</p>
              <div class="space-y-2">
                <!-- Owner -->
                <div v-if="workspace?.owner" class="flex items-center gap-3 p-2 rounded-[var(--r)] bg-fg/3">
                  <img
                    v-if="workspace.owner.avatarUrl"
                    :src="workspace.owner.avatarUrl"
                    class="w-7 h-7 rounded-full object-cover"
                    alt=""
                  />
                  <span
                    v-else
                    class="w-7 h-7 rounded-full bg-fg/10 flex-center text-muted i-lucide-user text-sm"
                  />
                  <div class="flex-1 min-w-0">
                    <p class="text-sm text-fg truncate">{{ workspace.owner.email }}</p>
                  </div>
                  <span class="text-xs text-muted shrink-0">Владелец</span>
                </div>

                <!-- Members -->
                <div
                  v-for="m in workspace?.members ?? []"
                  :key="m.id"
                  class="flex items-center gap-3 p-2 rounded-[var(--r)] bg-fg/3"
                >
                  <img
                    v-if="m.user.avatarUrl"
                    :src="m.user.avatarUrl"
                    class="w-7 h-7 rounded-full object-cover"
                    alt=""
                  />
                  <span
                    v-else
                    class="w-7 h-7 rounded-full bg-fg/10 flex-center text-muted i-lucide-user text-sm"
                  />
                  <div class="flex-1 min-w-0">
                    <p class="text-sm text-fg truncate">{{ m.user.email }}</p>
                  </div>
                  <button
                    v-if="isOwner"
                    type="button"
                    class="icon-btn-ghost text-danger"
                    title="Удалить участника"
                    @click="removeMember(m.userId)"
                  >
                    <span class="i-lucide-user-x" />
                  </button>
                </div>

                <p
                  v-if="!workspace?.members?.length"
                  class="text-xs text-muted italic"
                >
                  Пока нет участников
                </p>
              </div>
            </div>
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
              <template v-if="isOwner">
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
              </template>
              <span v-else /><!-- spacer for non-owner -->
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
