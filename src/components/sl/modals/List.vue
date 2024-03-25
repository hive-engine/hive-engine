<template>
  <Modal v-model="show" size="md" name="listCards" @closed="onClosed">
    <template #title>List for Rent</template>

    <div class="flex flex-wrap justify-evenly gap-4">
      <div v-for="card of cardStore.listable" :key="card.uid">
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

    <div class="mx-auto mt-5 max-w-sm text-center">
      <label class="mb-3 block font-bold">Rental Price for Each (per day)</label>
      <div class="mb-3 flex flex-wrap items-center justify-center gap-1">
        <input v-model="price" type="number" min="0.0001" class="max-w-[150px]" />

        <select v-model="currency" class="max-w-fit">
          <option v-for="currencySymbol of cardStore.settings.currencies" :key="currencySymbol" :value="currencySymbol">
            {{ currencySymbol }}
          </option>
        </select>

        <button class="btn self-stretch" :disabled="price < 0.0001" @click="listCards">List</button>
      </div>
    </div>
  </Modal>
</template>

<script setup>
import { inject, onBeforeUnmount, onMounted, ref } from 'vue';
import Modal from '@/components/modals/Modal.vue';
import { useCardStore } from '@/stores/card';

const show = ref(false);

const cardStore = useCardStore();
const event = inject('eventBus');

const price = ref('');
const currency = ref(cardStore.settings?.currencies[0]);

const listCards = () => {
  cardStore.requestListCards({ price: price.value, currency: currency.value });
};

const onClosed = () => {
  price.value = '';
  currency.value = 'SWAP.HIVE';
};

const onListCardsSuccessful = ({ id, eventData }) => {
  eventData.forEach((uid, idx) => {
    const index = cardStore.cards.findIndex((c) => c.uid === uid);

    cardStore.cards[index].market_id = `${id}-${idx}`;
    cardStore.cards[index].buy_price = price.value;
    cardStore.cards[index].currency = currency.value;
    cardStore.cards[index].market_listing_type = 'HE_RENT';
  });

  event.emit('update-cards-successful');

  show.value = false;
};

onMounted(() => {
  event.on('list-cards-successful', onListCardsSuccessful);
});

onBeforeUnmount(() => {
  event.off('list-cards-successful', onListCardsSuccessful);
});
</script>
