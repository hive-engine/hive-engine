<template>
  <Modal v-model="show" name="installKeychain">
    <div class="text-center mt-[-20px]">
      <img src="/images/hive-keychain.svg" class="block mx-auto max-w-xs p-4 bg-gray-600" />

      <div class="mt-10 font-bold text-xl">You need Hive Keychain installed to use hive-engine.com.</div>

      <div class="mt-5 text-sm">
        Hive Keychain is available for all the major browsers and mobile operating systems.
      </div>

      <a class="btn mt-10" target="_blank" href="https://hive-keychain.com">Download Hive Keychain</a>
    </div>
  </Modal>
</template>

<script setup>
import { ref } from 'vue';
import Modal from './Modal.vue';

const show = ref(false);
</script>
