<template>
  <div
    class="loading-animation flex flex-col items-center justify-center text-center"
    :class="{ 'loading-screen': !small }"
  >
    <Spinner large class="!text-red-600" />

    <div v-if="showText" class="mb-0 mt-3">Loading...</div>
  </div>
</template>

<script setup>
defineProps({
  small: { type: Boolean, default: false },
  showText: { type: Boolean, default: true },
});
</script>

<style lang="scss">
.loading-screen {
  height: calc(100vh - 484px);
}
</style>
