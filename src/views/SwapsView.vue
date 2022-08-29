<template>
  <div class="page-header">
    <div class="w-full max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 text-gray-200">
      <div class="grid md:grid-cols-4 text-center md:text-left min-h-[160px] items-center">
        <div class="col-span-full md:col-span-3 mt-3">
          <h1 class="text-4xl uppercase">Swaps</h1>
        </div>
      </div>
    </div>
  </div>

  <Loading v-if="loading" />

  <div v-else class="page-content">
    <div class="alert-warning">
      For swap request details containing transactions, please go to
      <a href="https://dswap.trade" target="_blank" class="font-bold">DSwap website</a>.
    </div>

    <CustomTable :fields="swapFields" :items="swaps">
      <template #cell(from)="{ item }">{{ item.fromAmount }} {{ item.fromSymbol }}</template>

      <template #cell(requested)="{ item }"
        >{{ item.amountRequested }} {{ item.toSymbol }}</template
      >

      <template #cell(realized)="{ item }">{{ item.actualAmount }} {{ item.toSymbol }}</template>

      <template #cell(status)="{ item }">
        <span :class="[getStatusClass(item.status), 'py-1 px-2 text-sm font-bold']">
          {{ item.status }}
        </span>
      </template>
    </CustomTable>
  </div>

  <PageFooter />
</template>

<script setup>
import axios from "axios";
import { format } from "date-fns";
import { computed, onBeforeMount, ref } from "vue";
import { DSWAP_API, DSWAP_SOURCE_ID } from "../config";
import { useUserStore } from "../stores/user";
import PageFooter from "../components/PageFooter.vue";
import CustomTable from "../components/utilities/CustomTable.vue";

const loading = ref(true);

const userStore = useUserStore();

const username = computed(() => userStore.username);

const statusObj = {
  1: "Init",
  2: "In progress",
  3: "Success",
  4: "Failed",
};

const statusClass = {
  Init: "bg-yellow-400 text-yellow-900",
  "In progress": "bg-yellow-400 text-yellow-900",
  Success: "bg-green-400 text-green-900",
  Failed: "bg-red-400 text-red-900",
};

const swaps = ref([]);

const swapFields = [
  { key: "date", label: "DATE" },
  { key: "from", label: "FROM" },
  { key: "requested", label: "AMOUNT REQUESTED" },
  { key: "realized", label: "AMOUNT REALIZED" },
  { key: "status", label: "STATUS" },
];

const getStatusClass = (status) => {
  return statusClass[status];
};

onBeforeMount(async () => {
  loading.value = true;

  try {
    let { data } = await axios.get(`${DSWAP_API}/SwapRequest`, {
      params: { account: username.value, sourceId: DSWAP_SOURCE_ID, limit: 50 },
    });

    data = data.map((s) => ({
      date: format(new Date(s.CreatedAt), "Pp"),
      fromSymbol: s.TokenInput,
      fromAmount: s.TokenInputAmount,
      toSymbol: s.TokenOutput,
      amountRequested: s.TokenOutputAmount,
      actualAmount: s.TokenOutputAmountActual,
      status: statusObj[s.SwapStatusId],
    }));

    swaps.value = data;
  } catch {
    //
  }

  loading.value = false;
});
</script>
