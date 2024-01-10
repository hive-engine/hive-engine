<template>
  <nav class="relative z-0 inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
    <button
      :disabled="!isPrevControlsActive"
      class="relative inline-flex items-center rounded-l-md border border-gray-300 bg-white px-2 py-2 text-sm font-bold text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
      @click="goToPrev"
    >
      <span class="sr-only">Previous</span>
      <ChevronLeftIcon class="h-5 w-5" aria-hidden="true" />
    </button>

    <template v-for="page in pagination">
      <button
        v-if="page"
        :key="`pagination-page-${page}`"
        aria-current="page"
        :class="[
          modelValue === page
            ? 'z-10 border-red-200 bg-red-50 text-red-400 dark:border-gray-700 dark:bg-gray-600 dark:text-gray-300'
            : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-800',
          'relative inline-flex items-center border px-4 py-2 text-sm font-bold',
        ]"
        @click="updatePageHandler(page)"
      >
        {{ page }}
      </button>

      <span
        v-else
        :key="`pagination-page-${page}-else`"
        class="relative inline-flex items-center border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300"
        >...</span
      >
    </template>

    <button
      :disabled="!isNextControlsActive"
      class="relative inline-flex items-center rounded-r-md border border-gray-300 bg-white px-2 py-2 text-sm font-bold text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
      @click="goToNext"
    >
      <span class="sr-only">Next</span>
      <ChevronRightIcon class="h-5 w-5" aria-hidden="true" />
    </button>
  </nav>
</template>

<script setup>
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline';
import { computed } from 'vue';

const props = defineProps({
  pages: {
    type: Number,
    default: 0,
  },
  rangeSize: {
    type: Number,
    default: 1,
  },
  modelValue: {
    type: Number,
    default: 1,
  },
});

const emit = defineEmits(['update:modelValue']);

const pagination = computed(() => {
  const res = [];

  const minPaginationElems = 3 + props.rangeSize * 2;

  let rangeStart = props.pages <= minPaginationElems ? 1 : props.modelValue - props.rangeSize;
  let rangeEnd = props.pages <= minPaginationElems ? props.pages : props.modelValue + props.rangeSize;

  rangeEnd = rangeEnd > props.pages ? props.pages : rangeEnd;

  rangeStart = rangeStart < 1 ? 1 : rangeStart;

  if (props.pages > minPaginationElems) {
    const isStartBoundaryReached = rangeStart - 1 < 3;
    const isEndBoundaryReached = props.pages - rangeEnd < 3;
    if (isStartBoundaryReached) {
      rangeEnd = minPaginationElems - 2;
      for (let i = 1; i < rangeStart; i += 1) {
        res.push(i);
      }
    } else {
      res.push(1);
      res.push(null);
    }
    if (isEndBoundaryReached) {
      rangeStart = props.pages - (minPaginationElems - 3);
      for (let i = rangeStart; i <= props.pages; i += 1) {
        res.push(i);
      }
    } else {
      for (let i = rangeStart; i <= rangeEnd; i += 1) {
        res.push(i);
      }
      res.push(null);
      res.push(props.pages);
    }
  } else {
    for (let i = rangeStart; i <= rangeEnd; i += 1) {
      res.push(i);
    }
  }
  return res;
});

const isPrevControlsActive = computed(() => props.modelValue > 1);
const isNextControlsActive = computed(() => props.modelValue < props.pages);

const updatePageHandler = (params) => {
  emit('update:modelValue', params);
};

// const goToFirst = () => {
//   if (isPrevControlsActive.value) {
//     emit("update:modelValue", 1);
//   }
// };

const goToPrev = () => {
  if (isPrevControlsActive.value) {
    emit('update:modelValue', props.modelValue - 1);
  }
};

// const goToLast = () => {
//   if (isNextControlsActive.value) {
//     emit("update:modelValue", props.pages);
//   }
// };

const goToNext = () => {
  if (isNextControlsActive.value) {
    emit('update:modelValue', props.modelValue + 1);
  }
};
</script>
