<template>
  <vue-final-modal
    v-slot="{ params, close }"
    v-bind="$attrs"
    classes="flex justify-center items-center overflow-y-auto"
    content-class="w-full max-w-xl relative flex flex-col max-h-full"
  >
    <div class="border dark:border-gray-800 rounded bg-white dark:bg-gray-600 dark:text-gray-300">
      <div class="flex items-center justify-between px-6 py-4">
        <div class="text-3xl font-bold leading-6 text-gray-900 dark:text-gray-300">
          <slot name="title" :params="params"></slot>
        </div>

        <button class="dark:text-gray-300" @click="close">
          <x-icon class="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div class="p-6 flex-grow">
        <slot :params="params"></slot>
      </div>
    </div>
  </vue-final-modal>
</template>

<script>
import { defineComponent } from "vue";
import { XIcon } from "@heroicons/vue/outline";

export default defineComponent({
  name: "Modal",

  components: {
    XIcon,
  },

  inheritAttrs: false,
});
</script>
