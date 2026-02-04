import { ref, nextTick, onMounted, onUnmounted, type Ref } from 'vue';
import { toast } from 'vue-sonner';
import { getGraphQLErrorMessage } from '@/lib/graphql-error';

/**
 * Общая логика inline-редактирования заголовка:
 * - фокус на инпут после startEdit (nextTick + focus)
 * - один клик вне контейнера сохраняет и закрывает (mousedown на document)
 * - при ошибке сохранения возврат в режим редактирования.
 * onSave должен бросить ошибку при неудаче.
 */
export function useInlineEdit(
  containerRef: Ref<HTMLElement | null>,
  getCurrentTitle: () => string,
  onSave: (newTitle: string) => Promise<unknown>
) {
  const isEditing = ref(false);
  const editTitle = ref('');
  const inputRef = ref<HTMLInputElement | null>(null);

  async function startEdit() {
    editTitle.value = getCurrentTitle();
    isEditing.value = true;
    await nextTick();
    inputRef.value?.focus();
  }

  async function saveEdit() {
    const trimmed = editTitle.value.trim();
    if (trimmed === getCurrentTitle()) {
      isEditing.value = false;
      return;
    }

    const newTitle = trimmed;
    isEditing.value = false;

    try {
      await onSave(newTitle);
    } catch (e) {
      isEditing.value = true;
      editTitle.value = newTitle;
      toast.error(getGraphQLErrorMessage(e));
    }
  }

  function handleClickOutside(e: MouseEvent) {
    if (!isEditing.value || !containerRef.value) return;
    if (containerRef.value.contains(e.target as Node)) return;
    saveEdit();
  }

  onMounted(() => {
    document.addEventListener('mousedown', handleClickOutside);
  });
  onUnmounted(() => {
    document.removeEventListener('mousedown', handleClickOutside);
  });

  return {
    isEditing,
    editTitle,
    inputRef,
    startEdit,
    saveEdit,
  };
}
