<template>
  <Modal v-model="show" name="rentalModal" size="xl" @before-open="onBeforeOpen" @closed="onClosed">
    <template #title>{{ card.name }}</template>

    <LoadingOverlay :show="showOverlay">
      <div class="mb-5 flex flex-wrap items-center justify-between">
        <div v-if="card.edition && card.color" class="flex flex-wrap gap-2 font-bold">
          <div class="flex items-center justify-center gap-2">
            <Edition class="h-6 w-6" :edition="card.edition" /> {{ getEdition(card.edition) }}
          </div>

          <div class="flex items-center justify-center gap-2">
            <Element class="h-6 w-6" :color="card.color" /> {{ getElement(card.color) }}
          </div>

          <div class="flex items-center justify-center gap-2">
            <Rarity class="h-6 w-6" :rarity="card.rarity" /> {{ getRarity(card.rarity) }}
          </div>

          <div class="flex items-center justify-center gap-2">
            <Foil class="h-6 w-6" :gold="card.gold" /> {{ card.gold ? 'Gold' : 'Regular' }}
          </div>
        </div>
      </div>

      <CustomTable :key="key" :items="cards" :fields="fields" :per-page="12">
        <template #cell(uid)="{ item }">
          {{ item.uid }}
        </template>

        <template #cell(price)="{ item }"> {{ Number(item.price) }} {{ item.currency }}/Day </template>

        <template #cell(actions)="{ item }">
          <AddToCart :card="item" />
        </template>
      </CustomTable>
    </LoadingOverlay>
  </Modal>
</template>

<script setup>
import { computed, ref } from 'vue';
import Modal from '@/components/modals/Modal.vue';
import AddToCart from '@/components/sl/buttons/AddToCart.vue';
import Edition from '@/components/sl/Edition.vue';
import Element from '@/components/sl/Element.vue';
import Foil from '@/components/sl/Foil.vue';
import Rarity from '@/components/sl/Rarity.vue';
import CustomTable from '@/components/utilities/CustomTable.vue';
import LoadingOverlay from '@/components/utilities/LoadingOverlay.vue';
import { useCardStore } from '@/stores/card';
import { getEdition, getElement, getRarity } from '@/utils';

const show = ref(false);
const showOverlay = ref(true);

const cardStore = useCardStore();

const key = ref(null);
const card = ref({
  name: null,
  edition: null,
  color: null,
  rarity: null,
  gold: null,
});

const fields = [
  { key: 'uid', label: 'Card' },
  { key: 'level', label: 'Level', sortable: true },
  { key: 'bcx', label: 'BCX', sortable: true },
  { key: 'power', label: 'Collection Power' },
  { key: 'seller', label: 'Owner' },
  { key: 'price', label: 'Price', sortable: true },
  { key: 'actions', label: '' },
];

const cards = computed(() => {
  let rentals = cardStore.for_rent;

  return rentals;
});

const onBeforeOpen = async (e) => {
  showOverlay.value = true;

  const { card_detail_id: id, edition, gold, currency } = e.ref.params.value;

  key.value = `${id}_${edition}_${gold}`;

  const { name, color, rarity } = cardStore.details.get(id);

  card.value = {
    name,
    edition,
    color,
    rarity,
    gold,
  };

  await cardStore.fetchForRentByCard({ id, edition, gold, currency });

  showOverlay.value = false;
};

const onClosed = () => {};
</script>
