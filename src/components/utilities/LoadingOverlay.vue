<template>
  <div class="relative">
    <Loading
      v-if="show"
      small
      :show-text="false"
      class="absolute top-0 bottom-0 left-0 right-0 z-50"
    />

    <div :class="{ 'opacity-30': show }">
      <slot></slot>
    </div>
  </div>
</template>

<script>
import { defineComponent } from "vue";
import Loading from "./Loading.vue";

export default defineComponent({
  name: "LoadingOverlay",

  components: {
    Loading,
  },

  props: {
    show: { type: Boolean, default: false },
  },
});
</script>
