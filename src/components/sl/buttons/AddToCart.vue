<template>
  <button
    :disabled="!cardStore.isLoggedIn || cardStore.player === card.seller"
    class="btn-sm"
    :class="{ 'bg-red-900 hover:bg-red-900': isInCart }"
    @click="cardStore.toggleCart(card)"
  >
    <XMarkIcon v-if="isInCart" class="h-5 w-5" />
    <PlusIcon v-else class="h-5 w-5" />
  </button>
</template>

<script setup>
import { useCardStore } from '@/stores/card';
import { PlusIcon, XMarkIcon } from '@heroicons/vue/24/outline';
import { computed } from 'vue';

const cardStore = useCardStore();

const props = defineProps({
  card: { type: Object, required: true },
});

const isInCart = computed(() => cardStore.cart.find((c) => c.uid === props.card.uid));
</script>
