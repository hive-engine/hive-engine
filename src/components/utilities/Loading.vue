<template>
  <div
    class="loading-animation text-center flex flex-col items-center justify-center"
    :class="{ 'loading-screen': !small }"
  >
    <Spinner large class="text-red-600" />

    <div v-if="showText" class="mt-3 mb-0">Loading...</div>
  </div>
</template>

<script>
export default {
  name: "Loading",

  props: {
    small: { type: Boolean, default: false },
    showText: { type: Boolean, default: true },
  },
};
</script>

<style lang="scss">
.loading-screen {
  height: calc(100vh - 484px);
}
</style>
