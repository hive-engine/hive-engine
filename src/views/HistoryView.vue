<template>
  <div class="page-header">
    <div class="mx-auto w-full max-w-7xl px-2 text-gray-200 sm:px-6 lg:px-8">
      <div class="grid min-h-[160px] items-center text-center md:grid-cols-4 md:text-left">
        <div class="col-span-full mt-3 md:col-span-3">
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
        <button class="btn-sm" @click="openTransactionInfoModal(item)">
          <InformationCircleIcon class="h-5 w-5" />
        </button>
      </template>
    </CustomTable>

    <div v-if="!disabledLoadMore" class="mt-5 text-center">
      <button class="btn-sm" @click="fetchAccountHistory(true)">Load More</button>
    </div>
  </div>

  <PageFooter />
</template>

<script setup>
import { ChevronLeftIcon, InformationCircleIcon } from '@heroicons/vue/24/outline';
import { useHead } from '@unhead/vue';
import { format } from 'date-fns';
import { computed, defineAsyncComponent, onBeforeMount, ref, watch } from 'vue';
import { useModal } from 'vue-final-modal';
import { useRoute } from 'vue-router';
import PageFooter from '@/components/PageFooter.vue';
import CustomTable from '@/components/utilities/CustomTable.vue';
import { sidechain } from '@/plugins/sidechain';
import { useUserStore } from '@/stores/user';
import { toFixedWithoutRounding } from '@/utils';

const TransactionInfoModal = defineAsyncComponent(() => import('@/components/modals/TransactionInfo.vue'));

const loading = ref(true);
const route = useRoute();

const userStore = useUserStore();

const offset = ref(0);
const limit = ref(30);
const disabledLoadMore = ref(false);

const username = computed(() => userStore.username);
const symbol = computed(() => route.params.symbol);

useHead({
  title: `${symbol.value} History`,
});

const rawHistory = ref([]);
const historyTableFields = [
  { key: 'date', label: 'DATE' },
  { key: 'operation', label: 'OPERATION' },
  { key: 'from', label: 'FROM' },
  { key: 'to', label: 'TO' },
  { key: 'amount', label: 'AMOUNT' },
  { key: 'action', label: '' },
];

const history = computed(() => {
  return rawHistory.value.map((h) => {
    let amount = h.quantity ? Number(h.quantity) : 0;

    if (h.operation === 'market_sell' || h.operation === 'market_buy') {
      amount = Number(h.quantityTokens);
    } else if (h.operation === 'market_placeOrder') {
      amount = toFixedWithoutRounding(Number(h.quantityLocked) / Number(h.price), 8);
    } else if (h.operation === 'market_cancel') {
      amount = Number(h.quantityReturned);
    } else if (h.operation === 'market_expire') {
      amount = Number(h.quantityUnlocked);
    }

    return {
      ...h,
      date: format(new Date(h.timestamp * 1000), 'Pp'),
      operation: titleCase(h.operation),
      to: h.to ? h.to : 'N/A',
      from: h.from ? getContractName(h.from) : 'N/A',
      amount,
      symbol: h.symbol,
    };
  });
});

watch(
  () => userStore.username,
  async () => {
    if (userStore.isLoggedIn) {
      disabledLoadMore.value = false;
      offset.value = 0;

      loading.value = true;

      await fetchAccountHistory();

      loading.value = false;
    }
  },
);

const titleCase = (str) => {
  return str
    .split('_')
    .map((w) => w[0].toUpperCase() + w.substr(1))
    .join(' ')
    .replace(/([A-Z])/g, ' $1');
};

const getContractName = (str) => {
  if (str.startsWith('contract_')) {
    const contract = str.replace('contract_', '');

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

const openTransactionInfoModal = async (transaction) => {
  const { open } = useModal({ component: TransactionInfoModal, attrs: { transaction } });

  await open();
};

onBeforeMount(async () => {
  loading.value = true;

  await fetchAccountHistory();

  loading.value = false;
});
</script>
