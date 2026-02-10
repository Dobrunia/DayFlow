<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useRoadmapStore } from '@/stores/roadmap';
import { useWorkspaceStore } from '@/stores/workspace';
import { toast } from 'vue-sonner';
import { getGraphQLErrorMessage } from '@/lib/graphql-error';
import { LIMITS } from 'dayflow-shared';
import type { RoadmapNode } from '@/graphql/types';
import RoadmapNodeItem from '@/components/roadmap/RoadmapNodeItem.vue';
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogClose,
} from 'radix-vue';

const route = useRoute();
const roadmapStore = useRoadmapStore();
const workspaceStore = useWorkspaceStore();

const workspaceId = computed(() => route.params.id as string);
const roadmap = computed(() => roadmapStore.currentRoadmap);
const loading = computed(() => roadmapStore.loading);

// Paste modal
const showPasteModal = ref(false);
const pasteText = ref('');
const pasteTitle = ref('');
const pasteLoading = ref(false);

// Edit node modal
const showEditNodeModal = ref(false);
const editNodeId = ref('');
const editNodeTitle = ref('');

// Add child inline
const addingParentId = ref<string | null>(null);
const newNodeTitle = ref('');

// Delete confirmation
const deletingNodeId = ref<string | null>(null);

// Delete roadmap confirmation
const showDeleteRoadmapConfirm = ref(false);

watch(
  workspaceId,
  (id) => {
    if (id) roadmapStore.fetchRoadmap(id);
  },
  { immediate: true }
);

// ─── Serialize tree to indented text ───

function serializeNodes(nodes: RoadmapNode[], indent = 0): string {
  const sorted = [...nodes].sort((a, b) => a.order - b.order);
  const lines: string[] = [];
  for (const n of sorted) {
    lines.push('  '.repeat(indent) + n.title);
    if (n.children?.length) lines.push(serializeNodes(n.children, indent + 1));
  }
  return lines.join('\n');
}

// ─── Create / rebuild from text ───

async function parseAndCreateNodes(rmId: string, text: string) {
  const lines = text.split('\n').filter((l) => l.trim());
  const stack: { indent: number; id: string | null }[] = [{ indent: -1, id: null }];
  let created = 0;

  for (const line of lines) {
    if (created >= LIMITS.MAX_ROADMAP_NODES) {
      toast.error(`Достигнут лимит: ${LIMITS.MAX_ROADMAP_NODES} узлов`);
      break;
    }

    const indent = line.search(/\S/);
    const nodeTitle = line.replace(/^\s*[-*•·]\s*/, '').trim();
    if (!nodeTitle) continue;

    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }
    const parentId = stack[stack.length - 1].id;

    try {
      const node = await roadmapStore.createNode(rmId, parentId, nodeTitle);
      stack.push({ indent, id: node.id });
      created++;
    } catch {
      // continue on single node failure
    }
  }
}

function openEditRoadmap() {
  pasteTitle.value = roadmap.value?.title ?? '';
  pasteText.value = roadmap.value?.nodes ? serializeNodes(rootNodes.value) : '';
  showPasteModal.value = true;
}

async function createFromPaste() {
  const title = pasteTitle.value.trim();
  const text = pasteText.value.trim();

  if (!title) {
    toast.error('Введите название роадмапа');
    return;
  }
  if (!text) {
    toast.error('Вставьте текст роадмапа');
    return;
  }

  try {
    pasteLoading.value = true;
    const isRebuild = !!roadmap.value;

    if (isRebuild) {
      await roadmapStore.deleteRoadmap(roadmap.value!.id);
    }

    const rm = await roadmapStore.createRoadmap(workspaceId.value, title, text);
    await parseAndCreateNodes(rm.id, text);
    showPasteModal.value = false;
    pasteText.value = '';
    pasteTitle.value = '';
    await roadmapStore.fetchRoadmap(workspaceId.value);
    toast.success(isRebuild ? 'Роадмап обновлён' : 'Роадмап создан');
  } catch (e) {
    toast.error(getGraphQLErrorMessage(e));
  } finally {
    pasteLoading.value = false;
  }
}

// ─── Delete roadmap ───

async function confirmDeleteRoadmap() {
  if (!roadmap.value) return;
  try {
    await roadmapStore.deleteRoadmap(roadmap.value.id);
    showDeleteRoadmapConfirm.value = false;
    toast.success('Роадмап удалён');
  } catch (e) {
    toast.error(getGraphQLErrorMessage(e));
  }
}

// ─── Node operations ───

async function toggleNodeDone(node: RoadmapNode) {
  try {
    await roadmapStore.updateNode(node.id, { done: !node.done });
  } catch (e) {
    toast.error(getGraphQLErrorMessage(e));
  }
}

function openEditNode(node: RoadmapNode) {
  editNodeId.value = node.id;
  editNodeTitle.value = node.title;
  showEditNodeModal.value = true;
}

async function saveNodeEdit() {
  if (!editNodeTitle.value.trim()) {
    toast.error('Введите название узла');
    return;
  }
  if (!editNodeId.value) return;
  try {
    await roadmapStore.updateNode(editNodeId.value, { title: editNodeTitle.value.trim() });
    showEditNodeModal.value = false;
  } catch (e) {
    toast.error(getGraphQLErrorMessage(e));
  }
}

function startAddChild(parentId: string | null) {
  addingParentId.value = parentId;
  newNodeTitle.value = '';
}

async function confirmAddNode() {
  if (!newNodeTitle.value.trim()) {
    toast.error('Введите название узла');
    return;
  }
  if (!roadmap.value) return;
  if (progress.value.total >= LIMITS.MAX_ROADMAP_NODES) {
    toast.error(`Максимум ${LIMITS.MAX_ROADMAP_NODES} узлов в роадмапе`);
    return;
  }
  try {
    await roadmapStore.createNode(
      roadmap.value.id,
      addingParentId.value,
      newNodeTitle.value.trim()
    );
    addingParentId.value = null;
    newNodeTitle.value = '';
  } catch (e) {
    toast.error(getGraphQLErrorMessage(e));
  }
}

async function confirmDeleteNode() {
  if (!deletingNodeId.value) return;
  try {
    await roadmapStore.deleteNode(deletingNodeId.value);
    deletingNodeId.value = null;
  } catch (e) {
    toast.error(getGraphQLErrorMessage(e));
  }
}

// ─── Computed ───

const rootNodes = computed(() => {
  if (!roadmap.value?.nodes) return [];
  return [...roadmap.value.nodes].filter((n) => !n.parentId).sort((a, b) => a.order - b.order);
});

function flattenNodes(nodes: RoadmapNode[]): RoadmapNode[] {
  const result: RoadmapNode[] = [];
  for (const n of nodes) {
    result.push(n);
    if (n.children?.length) result.push(...flattenNodes(n.children));
  }
  return result;
}

const progress = computed(() => {
  if (!roadmap.value?.nodes) return { done: 0, total: 0 };
  const all = flattenNodes(roadmap.value.nodes);
  return { done: all.filter((n) => n.done).length, total: all.length };
});

const progressPercent = computed(() =>
  progress.value.total === 0 ? 0 : Math.round((progress.value.done / progress.value.total) * 100)
);

const llmPrompt = computed(() => {
  const ws = workspaceStore.currentWorkspace;
  const title = ws?.title ?? '[ВСТАВЬ ТЕМУ]';
  const desc = ws?.description ? `\nКонтекст: ${ws.description}` : '';
  return `Создай подробный роадмап для изучения темы «${title}».${desc}

Формат — вложенный список с отступами (2 пробела на уровень):

Основы
  Подтема 1
  Подтема 2
    Детальная подтема
Продвинутый уровень
  Подтема 3

Требования:
- Каждый пункт — одна тема или навык
- Вложенность = зависимость (сначала родитель)
- 3–5 уровней глубины
- 15–30 пунктов
- От базовых понятий к продвинутым`;
});

function copyNodeAiPrompt(node: RoadmapNode) {
  const ws = workspaceStore.currentWorkspace;

  const context = ws ? (ws.description ? `${ws.title} — ${ws.description}` : ws.title) : '';

  const lines: string[] = [
    'Ты помогаешь мне учиться через карточки с источниками и задачами.',
    '',
    `Нужно проработать тему «${node.title}».`,
    '',
    'Не объясняй теорию в ответе.',
    'Твоя задача — составить ПЛАН ИЗУЧЕНИЯ.',
    '',
    'Формат ответа строго такой:',
    '',
    '1) ИСТОЧНИКИ',
    '- что почитать (документация, статьи)',
    '- что посмотреть (видео, курсы, доклады)',
    '- для каждого источника: зачем он нужен и на что обратить внимание',
    '',
    '2) ЗАДАЧИ',
    '- 3–6 практических задач по теме',
    '- от простого к сложному',
    '- каждая задача должна быть конкретной и выполнимой',
    '',
    '3) РЕЗУЛЬТАТ ОБУЧЕНИЯ',
    '- какие навыки я должен получить',
    '- какие карточки или заметки стоит создать после выполнения задач',
    '',
    'Ограничения:',
    '- не пересказывай содержание источников',
    '- не пиши учебник',
    '- не уходи в соседние или продвинутые темы',
  ];

  if (context) {
    lines.splice(3, 0, `Контекст проекта: ${context}`, '');
  }

  navigator.clipboard.writeText(lines.join('\n')).then(
    () => toast.success('Промпт скопирован'),
    () => toast.error('Не удалось скопировать')
  );
}

const promptCopied = ref(false);

function copyPrompt() {
  navigator.clipboard.writeText(llmPrompt.value).then(
    () => {
      promptCopied.value = true;
      toast.success('Промпт скопирован');
      setTimeout(() => (promptCopied.value = false), 2000);
    },
    () => toast.error('Не удалось скопировать')
  );
}
</script>

<template>
  <div class="flex-1 overflow-y-auto px-6 pb-6">
    <div class="max-w-3xl mx-auto py-4">
      <!-- Loading -->
      <div v-if="loading && !roadmap" class="flex-center py-12">
        <span class="i-lucide-loader-2 animate-spin text-2xl text-muted" />
      </div>

      <!-- Empty state: no roadmap yet -->
      <template v-else-if="!roadmap">
        <div class="text-center py-12">
          <span class="i-lucide-map text-4xl mb-3 block mx-auto opacity-40" />
          <p class="mb-6">Роадмап ещё не создан</p>

          <div class="flex gap-2 justify-center">
            <button class="btn-ghost" @click="showPasteModal = true">
              <span class="i-lucide-clipboard-paste" />
              <span>Вставить текст</span>
            </button>
            <button
              class="btn-ghost transition-colors"
              :class="promptCopied ? 'text-[rgb(var(--success))]' : ''"
              @click="copyPrompt"
            >
              <span :class="promptCopied ? 'i-lucide-check' : 'i-lucide-sparkles'" />
              <span>{{ promptCopied ? 'Скопировано' : 'Промпт для LLM' }}</span>
            </button>
          </div>
        </div>
      </template>

      <!-- Roadmap exists -->
      <template v-else>
        <!-- Title + Actions -->
        <div class="flex items-center gap-3 mb-4">
          <h2 class="text-lg font-bold flex-1 truncate">{{ roadmap.title }}</h2>
          <button class="icon-btn-ghost" title="Изменить роадмап" @click="openEditRoadmap">
            <span class="i-lucide-pencil" />
          </button>
        </div>

        <!-- Progress -->
        <div v-if="progress.total > 0" class="mb-6">
          <div class="flex items-center justify-between text-sm text-muted mb-1">
            <span>{{ progress.done }}/{{ progress.total }}</span>
            <span>{{ progressPercent }}%</span>
          </div>
          <div class="h-2 bg-fg/10 rounded-full overflow-hidden">
            <div
              class="h-full bg-primary rounded-full transition-all duration-300"
              :style="{ width: `${progressPercent}%` }"
            />
          </div>
        </div>

        <!-- Tree -->
        <div v-if="rootNodes.length > 0" class="space-y-0.5">
          <RoadmapNodeItem
            v-for="node in rootNodes"
            :key="node.id"
            :node="node"
            :depth="0"
            @toggle-done="toggleNodeDone"
            @edit-node="openEditNode"
            @add-child="startAddChild"
            @delete-node="deletingNodeId = $event"
            @copy-ai-prompt="copyNodeAiPrompt"
          />
        </div>

        <div v-else-if="!loading" class="text-center py-8 text-muted">
          Роадмап пуст. Добавьте узлы вручную или вставьте текст.
        </div>

        <!-- Inline add child (triggered by + on a node) -->
        <div v-if="addingParentId !== null" class="mt-4 flex gap-2 items-center">
          <input
            v-model="newNodeTitle"
            class="input flex-1 text-sm"
            placeholder="Название узла..."
            @keyup.enter="confirmAddNode"
            @keyup.escape="addingParentId = null"
            autofocus
          />
          <button class="icon-btn-primary" @click="confirmAddNode">
            <span class="i-lucide-check" />
          </button>
          <button class="icon-btn-ghost" @click="addingParentId = null">
            <span class="i-lucide-x" />
          </button>
        </div>
      </template>
    </div>

    <!-- Paste Modal -->
    <DialogRoot v-model:open="showPasteModal">
      <DialogPortal>
        <DialogOverlay class="dialog-overlay" @click="showPasteModal = false" />
        <DialogContent
          :aria-describedby="undefined"
          class="dialog-content max-w-lg"
          @escape-key-down="showPasteModal = false"
        >
          <div class="dialog-header">
            <DialogTitle class="dialog-title">
              {{ roadmap ? 'Изменить роадмап' : 'Создать роадмап из текста' }}
            </DialogTitle>
            <DialogClose class="icon-btn-close"><span class="i-lucide-x" /></DialogClose>
          </div>
          <form @submit.prevent="createFromPaste" class="space-y-4">
            <div>
              <label for="rm-paste-title" class="block text-sm font-medium mb-1">Название *</label>
              <input id="rm-paste-title" v-model="pasteTitle" class="input" required />
            </div>
            <div>
              <label for="rm-paste-text" class="block text-sm font-medium mb-1">
                Текст (вложенный список, отступы = иерархия)
              </label>
              <textarea
                id="rm-paste-text"
                v-model="pasteText"
                class="textarea h-48 font-mono text-sm"
                placeholder="Основы&#10;  Подтема 1&#10;  Подтема 2&#10;    Детальная подтема&#10;Продвинутый"
                required
              />
            </div>
            <div class="flex justify-between items-center gap-3 pt-4">
              <button
                v-if="roadmap"
                type="button"
                class="btn-delete"
                @click="
                  showPasteModal = false;
                  showDeleteRoadmapConfirm = true;
                "
              >
                <span class="i-lucide-trash-2" />
                <span>Удалить</span>
              </button>
              <span v-else />
              <button type="submit" class="btn-primary" :disabled="pasteLoading">
                <span v-if="pasteLoading" class="i-lucide-loader-2 animate-spin" />
                <span>{{ roadmap ? 'Сохранить' : 'Создать' }}</span>
              </button>
            </div>
          </form>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>

    <!-- Edit Node Modal -->
    <DialogRoot v-model:open="showEditNodeModal">
      <DialogPortal>
        <DialogOverlay class="dialog-overlay" @click="showEditNodeModal = false" />
        <DialogContent
          :aria-describedby="undefined"
          class="dialog-content max-w-md"
          @escape-key-down="showEditNodeModal = false"
        >
          <div class="dialog-header">
            <DialogTitle class="dialog-title">Редактировать узел</DialogTitle>
            <DialogClose class="icon-btn-close"><span class="i-lucide-x" /></DialogClose>
          </div>
          <form @submit.prevent="saveNodeEdit" class="space-y-4">
            <input v-model="editNodeTitle" class="input" required autofocus />
            <div class="flex justify-end gap-2 pt-2">
              <button type="button" class="btn-ghost" @click="showEditNodeModal = false">
                <span>Отмена</span>
              </button>
              <button type="submit" class="btn-primary"><span>Сохранить</span></button>
            </div>
          </form>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>

    <!-- Delete Node Confirmation -->
    <DialogRoot :open="!!deletingNodeId" @update:open="deletingNodeId = null">
      <DialogPortal>
        <DialogOverlay class="dialog-overlay" @click="deletingNodeId = null" />
        <DialogContent
          :aria-describedby="undefined"
          class="dialog-content max-w-sm"
          @escape-key-down="deletingNodeId = null"
        >
          <div class="dialog-header">
            <DialogTitle class="dialog-title">Удалить узел?</DialogTitle>
            <DialogClose class="icon-btn-close"><span class="i-lucide-x" /></DialogClose>
          </div>
          <p class="text-sm text-muted mb-4">Все дочерние узлы тоже будут удалены.</p>
          <div class="flex justify-end gap-2">
            <button class="btn-ghost" @click="deletingNodeId = null"><span>Отмена</span></button>
            <button class="btn-danger" @click="confirmDeleteNode">
              <span class="i-lucide-trash-2" />
              <span>Удалить</span>
            </button>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>

    <!-- Delete Roadmap Confirmation -->
    <DialogRoot v-model:open="showDeleteRoadmapConfirm">
      <DialogPortal>
        <DialogOverlay class="dialog-overlay" @click="showDeleteRoadmapConfirm = false" />
        <DialogContent
          :aria-describedby="undefined"
          class="dialog-content max-w-sm"
          @escape-key-down="showDeleteRoadmapConfirm = false"
        >
          <div class="dialog-header">
            <DialogTitle class="dialog-title">Удалить роадмап?</DialogTitle>
            <DialogClose class="icon-btn-close"><span class="i-lucide-x" /></DialogClose>
          </div>
          <p class="text-sm text-muted mb-4">
            Роадмап и все узлы будут удалены. Это действие нельзя отменить.
          </p>
          <div class="flex justify-end gap-2">
            <button class="btn-ghost" @click="showDeleteRoadmapConfirm = false"><span>Отмена</span></button>
            <button class="btn-danger" @click="confirmDeleteRoadmap">
              <span class="i-lucide-trash-2" />
              <span>Удалить</span>
            </button>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  </div>
</template>
