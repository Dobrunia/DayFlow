<script setup lang="ts">
// CardLink has no visual body — summary is rendered by CardItem
defineProps<{
  payload: { url: string; summary?: string };
}>();
</script>

<template>
  <!-- Link cards have no inline body; URL is in CardItem footer, summary is shared -->
</template>
