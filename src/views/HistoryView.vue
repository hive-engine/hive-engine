<template>
  <div class="page-header">
    <div class="w-full max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 text-gray-200">
      <div class="grid md:grid-cols-4 text-center md:text-left min-h-[160px] items-center">
        <div class="col-span-full md:col-span-3 mt-3">
          <h1 class="text-4xl uppercase">History: {{ symbol }}</h1>
        </div>
      </div>
    </div>
  </div>

  <Loading v-if="loading" />

  <div v-else class="page-content">
    <router-link :to="{ name: 'wallet', params: { account: username } }" class="btn-sm mb-3">
      <ChevronLeftIcon class="h-5 w-5" />
    </router-link>

    <CustomTable :fields="historyTableFields" :items="history">
      <template #cell(amount)="{ item }">{{ item.amount }} {{ symbol }}</template>

      <template #cell(action)="{ item }">
        <button class="btn-sm" @click="vfm$.show('transactionInfo', item)">
          <InformationCircleIcon class="h-5 w-5" />
        </button>
      </template>
    </CustomTable>

    <div v-if="!disabledLoadMore" class="text-center mt-5">
      <button class="btn-sm" @click="fetchAccountHistory(true)">Load More</button>
    </div>
  </div>

  <TransactionInfo />

  <PageFooter />
</template>

<script setup>
import { computed, inject, onBeforeMount, ref } from "vue";
import { ChevronLeftIcon, InformationCircleIcon } from "@heroicons/vue/24/outline";
import { format } from "date-fns";
import { useRoute } from "vue-router";
import { useUserStore } from "../stores/user";
import { sidechain } from "../plugins/sidechain";
import { toFixedWithoutRounding } from "../utils";
import CustomTable from "../components/utilities/CustomTable.vue";
import TransactionInfo from "../components/modals/TransactionInfo.vue";
import PageFooter from "../components/PageFooter.vue";

const loading = ref(true);
const vfm$ = inject("$vfm");
const route = useRoute();

const userStore = useUserStore();
const username = computed(() => userStore.username);

const offset = ref(0);
const limit = ref(20);
const disabledLoadMore = ref(false);
const symbol = computed(() => route.params.symbol);

const rawHistory = ref([]);
const historyTableFields = [
  { key: "date", label: "DATE" },
  { key: "operation", label: "OPERATION" },
  { key: "from", label: "FROM" },
  { key: "to", label: "TO" },
  { key: "amount", label: "AMOUNT" },
  { key: "action", label: "" },
];

const history = computed(() => {
  return rawHistory.value.map((h) => {
    let amount = h.quantity ? Number(h.quantity) : 0;

    if (h.operation === "market_sell" || h.operation === "market_buy") {
      amount = Number(h.quantityTokens);
    } else if (h.operation === "market_placeOrder") {
      amount = toFixedWithoutRounding(Number(h.quantityLocked) / Number(h.price), 8);
    } else if (h.operation === "market_cancel") {
      amount = Number(h.quantityReturned);
    } else if (h.operation === "market_expire") {
      amount = Number(h.quantityUnlocked);
    }

    return {
      ...h,
      date: format(new Date(h.timestamp * 1000), "Pp"),
      operation: titleCase(h.operation),
      to: h.to ? h.to : "N/A",
      from: h.from ? getContractName(h.from) : "N/A",
      amount,
      symbol: h.symbol,
    };
  });
});

const titleCase = (str) => {
  return str
    .split("_")
    .map((w) => w[0].toUpperCase() + w.substr(1))
    .join(" ")
    .replace(/([A-Z])/g, " $1");
};

const getContractName = (str) => {
  if (str.startsWith("contract_")) {
    const contract = str.replace("contract_", "");

    return `${contract.charAt(0).toUpperCase() + contract.substring(1)} Contract`;
  }

  return str;
};

const fetchAccountHistory = async (more = false) => {
  try {
    if (more) {
      offset.value += limit.value;
    }

    const query = {
      account: username.value,
      limit: limit.value,
      offset: offset.value,
    };

    if (route.params.symbol) {
      query.symbol = route.params.symbol;
    }

    const history = await sidechain.getAccountHistory(query);

    if (history.length === 0 || history.length < limit.value) {
      disabledLoadMore.value = true;
    }

    if (more) {
      rawHistory.value = [...rawHistory.value, ...history];
    } else {
      rawHistory.value = history;
    }
  } catch {
    //
  }
};

onBeforeMount(async () => {
  loading.value = true;

  await fetchAccountHistory();

  loading.value = false;
});
</script>
