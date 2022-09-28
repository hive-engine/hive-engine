<template>
  <vue-final-modal
    v-slot="{ params, close }"
    v-bind="$attrs"
    classes="flex justify-center items-center overflow-y-auto"
    :content-class="contentClasses"
  >
    <div class="border dark:border-gray-800 rounded bg-white dark:bg-gray-600 dark:text-gray-300">
      <div class="flex items-center justify-between px-6 py-4">
        <div class="text-3xl font-bold leading-6 text-gray-900 dark:text-gray-300">
          <slot name="title" :params="params"></slot>
        </div>

        <button class="dark:text-gray-300" @click="close">
          <XMarkIcon class="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div :class="bodyClass">
        <slot :params="params"></slot>
      </div>
    </div>
  </vue-final-modal>
</template>

<script setup>
import { XMarkIcon } from '@heroicons/vue/24/outline';
import { computed } from 'vue';

const props = defineProps({
  size: { type: String, default: 'sm' },
  bodyClass: { type: String, default: 'p-6 flex-grow' },
});

const contentClasses = computed(() => {
  const classes = ['w-full relative flex flex-col max-h-full'];

  if (props.size === 'xl') {
    return [...classes, 'max-w-6xl'];
  } else if (props.size === 'lg') {
    return [...classes, 'max-w-4xl'];
  } else if (props.size === 'md') {
    return [...classes, 'max-w-3xl'];
  }

  return [...classes, 'max-w-xl'];
});
</script>
