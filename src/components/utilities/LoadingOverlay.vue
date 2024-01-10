<template>
  <div class="relative">
    <Loading v-if="show" small :show-text="false" class="absolute bottom-0 left-0 right-0 top-0 z-50" />

    <div :class="{ 'opacity-30': show }">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import Loading from '@/components/utilities/Loading.vue';

defineProps({
  show: { type: Boolean, default: false },
});
</script>
