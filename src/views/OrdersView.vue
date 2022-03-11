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
        <input type="checkbox" v-model="selectedOrders" :value="item" />
      </template>

      <template #cell(type)="{ item }">
        <span
          :class="{ 'text-red-500': item.type === 'SELL', 'text-green-500': item.type === 'BUY' }"
          >{{ item.type }}</span
        >
      </template>

      <template #cell(symbol)="{ item }">
        <router-link :to="{ name: 'trade', params: { symbol: item.symbol } }">{{
          item.symbol
        }}</router-link>
      </template>

      <template #cell(txId)="{ item }">
        <button @click="marketStore.requestCancelOrders([item])" class="btn-sm">
          <XIcon class="h-5 w-5" />
        </button>
      </template>
    </custom-table>

    <div class="mt-5 text-right" v-if="selectedOrders.length > 1">
      <button @click="marketStore.requestCancelOrders(selectedOrders)" class="btn-sm px-4">
        Cancel All
      </button>
    </div>
  </div>

  <PageFooter />
</template>

<script>
import {
  computed,
  defineComponent,
  inject,
  onBeforeMount,
  onBeforeUnmount,
  onMounted,
  ref,
} from "vue";
import { XIcon } from "@heroicons/vue/outline";
import { useStore } from "../stores";
import { useMarketStore } from "../stores/market";
import { useUserStore } from "../stores/user";
import CustomTable from "../components/utilities/CustomTable.vue";
import PageFooter from "../components/PageFooter.vue";
export default defineComponent({
  name: "OpenOrders",

  components: {
    XIcon,
    CustomTable,
    PageFooter,
  },

  setup() {
    const loading = ref(true);
    const event = inject("eventBus");

    const store = useStore();
    const marketStore = useMarketStore();
    const userStore = useUserStore();

    const selectedOrders = ref([]);

    const username = computed(() => userStore.username);
    const openOrders = computed(() => marketStore.openOrdersFormatted);

    const openOrdersFields = [
      { key: "checkbox", label: "" },
      { key: "timestamp", label: "DATE" },
      { key: "type", label: "TYPE" },
      { key: "quantity", label: "QUANTITY" },
      { key: "symbol", label: "SYMBOL" },
      { key: "price", label: "PRICE" },
      { key: "total", label: "TOTAL HIVE" },
      { key: "txId", label: "Action" },
    ];

    onBeforeMount(async () => {
      loading.value = true;

      await marketStore.fetchUserOrders(null, username.value);

      loading.value = false;
    });

    onMounted(() => {
      event.on("broadcast-success", async ({ id, ntrx }) => {
        loading.value = true;

        await store.validateTransaction(ntrx > 1 ? `${id}-0` : id);
      });

      event.on("transaction-validated", async () => {
        resetForm();

        await fetchTokenMarket();

        loading.value = false;
      });
    });

    onBeforeUnmount(() => {
      event.off("broadcast-success");
      event.off("transaction-validated");
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
