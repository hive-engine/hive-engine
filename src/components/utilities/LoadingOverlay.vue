<template>
  <div class="relative">
    <Loading
      small
      :show-text="false"
      v-if="show"
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

  props: {
    show: { type: Boolean, default: false },
  },

  components: {
    Loading,
  },
});
</script>
