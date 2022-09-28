<template>
  <div class="page-content flex flex-col items-center justify-center">
    <div>
      <div class="text-9xl font-bold mb-5">404</div>
      <div class="text-4xl mb-10">You have found a page that doesn't exist!</div>
      <router-link to="/" class="btn">Back to Home</router-link>
    </div>
  </div>

  <PageFooter />
</template>

<script setup>
import PageFooter from '../components/PageFooter.vue';
</script>
