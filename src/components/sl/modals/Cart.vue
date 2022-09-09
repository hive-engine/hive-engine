<template>
  <Modal v-model="show" size="xl" name="cartModal">
    <template #title>Cart</template>
  </Modal>
</template>

<script setup>
import { ref } from 'vue';
import Modal from '@/components/modals/Modal.vue';

const show = ref(false);
</script>
