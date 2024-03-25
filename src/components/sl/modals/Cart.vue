<template>
  <Modal v-model="show" size="xl" name="cartModal" @before-open="onBeforeOpen">
    <template #title>Cart</template>

    <LoadingOverlay :show="showOverlay">
      <template v-if="cardStore.cart.length > 0">
        <div class="grid grid-cols-3 gap-4">
          <div v-for="card of cardStore.cart" :key="card.uid" class="grid grid-cols-6 gap-2">
            <div class="col-span-3">
              <div class="font-bold" :class="{ 'text-yellow-500': card.gold }">{{ card.name }}</div>
              <div class="text-sm">{{ card.uid }}</div>
              <div class="text-sm">
                Level {{ card.level }} <span class="text-xs">({{ card.bcx }} BCX)</span>
              </div>
            </div>
            <div class="col-span-2 self-center text-right">{{ Number(card.price) }} {{ card.currency }}</div>
            <div class="col-span-1 self-center text-right">
              <button @click="cardStore.toggleCart(card)">
                <XMarkIcon class="h-5 w-5 text-red-500" />
              </button>
            </div>
          </div>
        </div>

        <div class="mx-auto mt-10 max-w-[150px]">
          <div class="flex items-center">
            <input v-model="days" type="number" min="2" max="180" class="!rounded-r-none border-r-0" />
            <div class="self-stretch rounded-r-md border px-2 py-2 dark:border-gray-500 dark:bg-slate-600">Days</div>
          </div>
        </div>

        <div class="mt-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 class="font-bold">Your balances:</h3>

            <div class="flex flex-wrap gap-4">
              <div v-for="bal of cardStore.balances" :key="bal">{{ bal[1] }} {{ bal[0] }}</div>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button
              v-for="total of cartTotal"
              :key="total[0]"
              class="btn"
              :disabled="
                days < 2 ||
                days > 180 ||
                !cardStore.balances.has(total[0]) ||
                cardStore.balances.get(total[0]) < total[1]
              "
              @click="cardStore.requestPayment({ currency: total[0], days })"
            >
              {{ total[1] }} {{ total[0] }}
            </button>
          </div>
        </div>
      </template>

      <div v-else class="mb-10 pt-5 text-center text-xl font-bold">No items found!</div>
    </LoadingOverlay>
  </Modal>
</template>

<script setup>
import { XMarkIcon } from '@heroicons/vue/24/outline';
import Big from 'big.js';
import { computed, inject, onBeforeUnmount, onMounted, ref } from 'vue';
import Modal from '@/components/modals/Modal.vue';
import LoadingOverlay from '@/components/utilities/LoadingOverlay.vue';
import { useCardStore } from '@/stores/card';

const show = ref(false);
const showOverlay = ref(true);

const cardStore = useCardStore();
const event = inject('eventBus');

const days = ref(2);

const cartTotal = computed(() => {
  const total = cardStore.cart.reduce((acc, cur) => {
    if (!acc[cur.currency]) {
      acc[cur.currency] = new Big(0);
    }

    acc[cur.currency] = acc[cur.currency].add(cur.price);

    return acc;
  }, {});

  return Object.entries(total).map((t) => [t[0], t[1].mul(days.value).toNumber()]);
});

const onBeforeOpen = async () => {
  showOverlay.value = true;

  await cardStore.fetchBalances();

  showOverlay.value = false;
};

const onRentSuccessful = ({ eventData }) => {
  cardStore.cart = cardStore.cart.filter((c) => !eventData.includes(c.uid));
};

onMounted(() => {
  event.on('rent-cards-successful', onRentSuccessful);
});

onBeforeUnmount(() => {
  event.off('rent-cards-successful', onRentSuccessful);
});
</script>
