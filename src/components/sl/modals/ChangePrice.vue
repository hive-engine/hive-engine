<template>
  <Modal v-model="show" size="md" name="changePriceModal" @closed="onClosed">
    <template #title>Change Price</template>

    <div class="flex flex-wrap justify-evenly gap-4">
      <div v-for="card of cardStore.cancellable" :key="card.uid">
        <div class="font-bold" :class="{ 'text-yellow-500': card.gold }">
          {{ card.name }}
        </div>
        <div class="text-xs">{{ card.uid }}</div>
        <div class="flex text-xs">
          <div class="mr-3">Level {{ card.level }}</div>
          <div>BCX {{ card.bcx }}</div>
        </div>
      </div>
    </div>

    <div class="mx-auto mt-5 max-w-md text-center">
      <label class="mb-3 block font-bold">Rental Price for Each (per day)</label>
      <div class="mb-3 flex flex-wrap items-center justify-center gap-1">
        <input v-model="price" type="number" min="0.0001" class="max-w-[150px]" />

        <select class="max-w-fit" disabled>
          <option :value="currency">
            {{ currency }}
          </option>
        </select>

        <button class="btn self-stretch" :disabled="price < 0.0001" @click="changePrice">Change Price</button>
      </div>
    </div>
  </Modal>
</template>

<script setup>
import { computed, inject, onBeforeUnmount, onMounted, ref } from 'vue';
import Modal from '@/components/modals/Modal.vue';
import { useCardStore } from '@/stores/card';

const show = ref(false);

const cardStore = useCardStore();
const event = inject('eventBus');

const price = ref('');

const currency = computed(() => {
  if (cardStore.changeable.length > 0) {
    return cardStore.cancellable[0].currency;
  }

  return '';
});

const changePrice = () => {
  cardStore.requestChangePrice({ price: price.value, currency: currency.value });
};

const onClosed = () => {
  price.value = '';
};

const onChangePriceSuccessful = ({ eventData }) => {
  eventData.forEach((id) => {
    const index = cardStore.cards.findIndex((c) => c.market_id === id);

    cardStore.cards[index].buy_price = price.value;
  });

  event.emit('update-cards-successful');

  show.value = false;
};

onMounted(() => {
  event.on('change-price-successful', onChangePriceSuccessful);
});

onBeforeUnmount(() => {
  event.off('change-price-successful', onChangePriceSuccessful);
});
</script>
