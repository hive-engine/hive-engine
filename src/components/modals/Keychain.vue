<template>
  <Modal v-model="show" modal-id="installKeychainModal">
    <div class="mt-[-20px] text-center">
      <img src="/images/hive-keychain.svg" class="mx-auto block max-w-xs bg-gray-600 p-4" />

      <div class="mt-10 text-xl font-bold">You need Hive Keychain installed to use hive-engine.com.</div>

      <div class="mt-5 text-sm">
        Hive Keychain is available for all the major browsers and mobile operating systems.
      </div>

      <a class="btn mt-10" target="_blank" href="https://hive-keychain.com">Download Hive Keychain</a>
    </div>
  </Modal>
</template>

<script setup>
import { ref } from 'vue';
import Modal from '@/components/modals/Modal.vue';

const show = ref(false);
</script>
