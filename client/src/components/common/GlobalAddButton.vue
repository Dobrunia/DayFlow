<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import CreateCardDialog from '@/components/card/CreateCardDialog.vue';

const isDialogOpen = ref(false);

function handleKeydown(e: KeyboardEvent) {
  // Ctrl/⌘ + Alt/Option + N
  if ((e.ctrlKey || e.metaKey) && e.altKey && e.code === 'KeyN') {
    e.preventDefault();
    isDialogOpen.value = true;
  }
}

onMounted(() => window.addEventListener('keydown', handleKeydown));
onUnmounted(() => window.removeEventListener('keydown', handleKeydown));
</script>

<template>
  <button type="button" @click="isDialogOpen = true" class="global-add-btn" title="Ctrl+Alt+N / ⌘+⌥+N">
    <span class="global-add-btn-bg" />
    <span class="global-add-btn-content">
      <span class="i-lucide-plus" />
      <span>Добавить карточку</span>
    </span>
  </button>

  <CreateCardDialog :open="isDialogOpen" @close="isDialogOpen = false" />
</template>

<style scoped>
.global-add-btn {
  position: relative;
  padding: 0 16px;
  height: 36px;
  border-radius: var(--r);
  font-size: 14px;
  font-weight: 500;
  color: rgb(var(--on-primary));
  cursor: pointer;
  overflow: hidden;
  transition: box-shadow 0.2s ease;
}

.global-add-btn:hover {
  box-shadow: 0 4px 20px rgb(var(--primary) / 0.4);
}

.global-add-btn-bg {
  position: absolute;
  inset: 0;
  background: rgb(var(--primary) / 0.5);
}

/* Shimmer overlay - only on hover */
.global-add-btn::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    110deg,
    transparent 20%,
    rgba(255, 255, 255, 0.4) 50%,
    transparent 80%
  );
  background-size: 200% 100%;
  background-position: 200% 0;
  pointer-events: none;
  transition: none;
}

.global-add-btn:hover::after {
  animation: shimmer 0.8s ease-out;
}

.global-add-btn-content {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  z-index: 1;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
