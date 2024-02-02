<template>
  <Modal modal-id="announcementsModal" :click-to-close="false" @closed="onClosed">
    <template #title>{{ title }} </template>

    <div class="text-pretty text-lg">{{ message }}</div>
  </Modal>
</template>

<script setup>
import { useStorage } from '@vueuse/core';
import Modal from '@/components/modals/Modal.vue';

const props = defineProps({
  id: { type: Number, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
});

const onClosed = () => {
  const shown = useStorage('announcements-shown', []);
  shown.value.push(props.id);
};
</script>
