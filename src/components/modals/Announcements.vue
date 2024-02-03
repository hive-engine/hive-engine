<template>
  <Modal modal-id="announcementsModal" :click-to-close="false" @closed="onClosed">
    <template #title>{{ title }} </template>

    <div v-html="htmlMessage" />
  </Modal>
</template>

<script setup>
import { useStorage } from '@vueuse/core';
import snarkdown from 'snarkdown';
import { computed } from 'vue';
import Modal from '@/components/modals/Modal.vue';

const props = defineProps({
  id: { type: Number, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
});

const htmlMessage = computed(() => snarkdown(props.message));

const onClosed = () => {
  const shown = useStorage('announcements-shown', []);
  shown.value.push(props.id);
};
</script>
