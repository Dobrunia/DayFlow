<script setup lang="ts">
import { ref } from 'vue';
import { toast } from 'vue-sonner';

const props = withDefaults(
  defineProps<{
    /** Text to copy to clipboard */
    text: string;
    /** Toast message on success */
    successMessage?: string;
    /** Button title attribute */
    title?: string;
  }>(),
  {
    successMessage: 'Скопировано',
    title: 'Копировать',
  },
);

const copied = ref(false);

function copy() {
  navigator.clipboard.writeText(props.text).then(
    () => {
      copied.value = true;
      toast.success(props.successMessage);
      setTimeout(() => (copied.value = false), 2000);
    },
    () => toast.error('Не удалось скопировать'),
  );
}

defineExpose({ copied });
</script>

<template>
  <button
    type="button"
    class="icon-btn-ghost transition-colors"
    :class="copied && 'text-success!'"
    :title="title"
    @click.stop="copy"
  >
    <span :class="copied ? 'i-lucide-check' : 'i-lucide-copy'" />
  </button>
</template>
