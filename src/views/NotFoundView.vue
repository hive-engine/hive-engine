<template>
  <div class="page-content flex flex-col items-center justify-center">
    <div>
      <div class="mb-5 text-9xl font-bold">404</div>
      <div class="mb-10 text-4xl">You have found a page that doesn't exist!</div>
      <router-link to="/" class="btn">Back to Home</router-link>
    </div>
  </div>

  <PageFooter />
</template>

<script setup>
import { useHead } from '@unhead/vue';
import PageFooter from '@/components/PageFooter.vue';

useHead({
  title: 'Not found',
});
</script>
