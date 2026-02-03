<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import AddItemDialog from '../library/AddItemDialog.vue';

const isDialogOpen = ref(false);

function handleKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    isDialogOpen.value = true;
  }
}

onMounted(() => window.addEventListener('keydown', handleKeydown));
onUnmounted(() => window.removeEventListener('keydown', handleKeydown));
</script>

<template>
  <button @click="isDialogOpen = true" class="btn-primary gap-1.5" title="Добавить (Ctrl+K)">
    <span class="i-lucide-plus" />
    Добавить
  </button>

  <AddItemDialog :open="isDialogOpen" @close="isDialogOpen = false" />
</template>
