<template>
  <div class="page-header">
    <div class="mx-auto w-full max-w-7xl px-2 text-gray-200 sm:px-6 lg:px-8">
      <div class="grid min-h-[160px] items-center text-center md:grid-cols-4 md:text-left">
        <div class="col-span-full mt-3 md:col-span-3">
          <h1 class="text-4xl uppercase">Open Orders</h1>
        </div>
      </div>
    </div>
  </div>

  <Loading v-if="loading" />

  <div v-else class="page-content">
    <custom-table :fields="openOrdersFields" :items="openOrders">
      <template #cell(checkbox)="{ item }">
        <input v-model="selectedOrders" type="checkbox" :value="item" />
      </template>

      <template #cell(type)="{ item }">
        <span :class="{ 'text-red-500': item.type === 'SELL', 'text-green-500': item.type === 'BUY' }">{{
          item.type
        }}</span>
      </template>

      <template #cell(symbol)="{ item }">
        <router-link :to="{ name: 'trade', params: { symbol: item.symbol } }">
          {{ item.symbol }}
        </router-link>
      </template>

      <template #cell(txId)="{ item }">
        <button class="btn-sm" @click="marketStore.requestCancelOrders([item])">
          <XMarkIcon class="h-5 w-5" />
        </button>
      </template>
    </custom-table>

    <div v-if="selectedOrders.length > 1" class="mt-5 text-right">
      <button class="btn-sm px-4" @click="marketStore.requestCancelOrders(selectedOrders)">Cancel All</button>
    </div>
  </div>

  <PageFooter />
</template>

<script setup>
import { XMarkIcon } from '@heroicons/vue/24/outline';
import { useHead } from '@unhead/vue';
import { computed, onBeforeMount, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import PageFooter from '@/components/PageFooter.vue';
import CustomTable from '@/components/utilities/CustomTable.vue';
import { emitter } from '@/plugins/mitt';
import { useStore } from '@/stores';
import { useMarketStore } from '@/stores/market';
import { useUserStore } from '@/stores/user';

useHead({
  title: 'Open Orders',
});

const loading = ref(true);

const store = useStore();
const marketStore = useMarketStore();
const userStore = useUserStore();

const selectedOrders = ref([]);

const username = computed(() => userStore.username);
const openOrders = computed(() => marketStore.openOrdersFormatted);

const openOrdersFields = [
  { key: 'checkbox', label: '' },
  { key: 'timestamp', label: 'DATE', sortable: true },
  { key: 'type', label: 'TYPE', sortable: true },
  { key: 'quantity', label: 'QUANTITY' },
  { key: 'symbol', label: 'SYMBOL' },
  { key: 'price', label: 'PRICE' },
  { key: 'total', label: 'TOTAL HIVE' },
  { key: 'txId', label: 'Action' },
];

const onBoardcastSuccess = async ({ id, ntrx }) => {
  loading.value = true;

  await store.validateTransaction(ntrx > 1 ? `${id}-0` : id);
};

const onTransactionValidated = async () => {
  await marketStore.fetchUserOrders(null, username.value);

  loading.value = false;
};

watch(
  () => userStore.username,
  async () => {
    if (userStore.isLoggedIn) {
      loading.value = true;

      await marketStore.fetchUserOrders(null, username.value);

      loading.value = false;
    }
  },
);

onBeforeMount(async () => {
  loading.value = true;

  try {
    await marketStore.fetchUserOrders(null, username.value);
  } catch {
    //
  }

  loading.value = false;
});

onMounted(() => {
  emitter.on('broadcast-success', onBoardcastSuccess);

  emitter.on('transaction-validated', onTransactionValidated);
});

onBeforeUnmount(() => {
  emitter.off('broadcast-success', onBoardcastSuccess);
  emitter.off('transaction-validated', onTransactionValidated);
});
</script>
