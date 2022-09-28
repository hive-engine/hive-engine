<template>
  <div class="page-header">
    <div class="w-full max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 text-gray-200">
      <div class="grid md:grid-cols-4 text-center md:text-left min-h-[160px] items-center">
        <div class="col-span-full md:col-span-3 mt-3">
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

<script>
import { XMarkIcon } from '@heroicons/vue/24/outline';
import { computed, defineComponent, inject, onBeforeMount, onBeforeUnmount, onMounted, ref } from 'vue';
import PageFooter from '../components/PageFooter.vue';
import CustomTable from '../components/utilities/CustomTable.vue';
import { useStore } from '../stores';
import { useMarketStore } from '../stores/market';
import { useUserStore } from '../stores/user';
export default defineComponent({
  name: 'OpenOrders',

  components: {
    XMarkIcon,
    CustomTable,
    PageFooter,
  },

  setup() {
    const loading = ref(true);
    const event = inject('eventBus');

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
      event.on('broadcast-success', onBoardcastSuccess);

      event.on('transaction-validated', onTransactionValidated);
    });

    onBeforeUnmount(() => {
      event.off('broadcast-success', onBoardcastSuccess);
      event.off('transaction-validated', onTransactionValidated);
    });

    return {
      loading,

      openOrders,
      openOrdersFields,
      selectedOrders,

      marketStore,
    };
  },
});
</script>
