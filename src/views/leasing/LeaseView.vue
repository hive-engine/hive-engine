<template>
  <div class="page-header">
    <div class="mx-auto w-full max-w-7xl px-2 text-gray-200 sm:px-6 lg:px-8">
      <div class="grid min-h-[120px] items-center text-center md:grid-cols-4 md:text-left">
        <div class="col-span-full mt-3 md:col-span-1">
          <h1 class="text-4xl uppercase">Lease Market</h1>
        </div>

        <div class="col-span-full mt-3 md:col-span-3">
          <div class="flex flex-wrap items-center justify-center gap-4 md:justify-end">
            <template v-if="userStore.isLoggedIn">
              <button class="btn" @click="openRequestLeaseModal">Request a Lease</button>

              <RouterLink class="btn" :to="{ name: 'leasing-dashboard', params: { account: userStore.username } }"
                >Dashboard</RouterLink
              >
            </template>

            <button v-else class="btn" @click="vfm.open('loginModal')">Login to Request</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <Loading v-if="loading" />

  <div v-else class="page-content pt-3">
    <div class="flex items-center justify-between gap-4">
      <select v-model="selectedAsset" name="selectedAsset" class="mb-5 w-[200px]">
        <option :value="null">Filter by asset</option>
        <option v-for="symbol of supportedAssets" :key="symbol" :value="symbol">{{ symbol }}</option>
      </select>

      <select v-model="selectedCurrency" name="selectedCurrency" class="mb-5 w-[200px]">
        <option :value="null">Filter by currency</option>
        <option v-for="symbol of leaseStore.currencies" :key="symbol" :value="symbol">{{ symbol }}</option>
      </select>
    </div>

    <CustomTable :items="computedRequests" :fields="tableFields" :per-page="15">
      <template #cell(amount)="{ item }"
        >{{ addCommas(item.asset === 'HP' ? Number((item.amount * item.vests_price).toFixed(3)) : item.amount) }}
        {{ item.asset }}</template
      >
      <template #cell(duration)="{ item }">{{ item.duration }} weeks</template>
      <template #cell(daily_payment)="{ item }"
        >{{ item.daily_payment }} <span class="text-xs">{{ item.currency }}</span></template
      >
      <template #cell(total_payment)="{ item }"
        >{{ item.total_payment }} <span class="text-xs">{{ item.currency }}</span></template
      >
      <template #cell(apr)="{ item }">{{ toFixedNoRounding(item.apr, 2) }}%</template>

      <template #cell(action)="{ item }">
        <button
          v-if="userStore.isLoggedIn"
          :disabled="item.beneficiary === userStore.username || (item.locked && item.unlocks_at > new Date())"
          class="btn py-1"
          @click="leaseStore.fillLeaseRequest(item.id)"
        >
          <template v-if="!item.locked || (item.locked && item.unlocks_at <= new Date())">Fill</template>

          <template v-else> Available {{ item.unlock_time_remaining }} </template>
        </button>

        <button v-else class="btn py-1" @click="vfm.open('loginModal')">Login</button>
      </template>
    </CustomTable>
  </div>
</template>

<script setup>
import { useHead } from '@unhead/vue';
import { watchThrottled } from '@vueuse/core';
import { computed, defineAsyncComponent, inject, onBeforeMount, onBeforeUnmount, onMounted, ref } from 'vue';
import { useModal, useVfm } from 'vue-final-modal';
import CustomTable from '@/components/utilities/CustomTable.vue';
import { useStore } from '@/stores';
import { useLeaseStore } from '@/stores/lease';
import { useUserStore } from '@/stores/user';
import { addCommas, toFixedNoRounding } from '@/utils';

const RequestLeaseModal = defineAsyncComponent(() => import('@/components/modals/RequestLease.vue'));

useHead({
  title: 'Lease',
});

const vfm = useVfm();

const store = useStore();
const leaseStore = useLeaseStore();
const userStore = useUserStore();

const eventBus = inject('eventBus');
const eventSource = inject('eventSource');

const loading = ref(false);

const tableFields = [
  { key: 'beneficiary', label: 'Lessee' },
  { key: 'amount', label: 'Amount', sortable: true },
  { key: 'duration', label: 'Duration', sortable: true },
  { key: 'daily_payment', label: 'Daily Payment', sortable: true },
  { key: 'total_payment', label: 'Total Payment', sortable: true },
  { key: 'apr', label: 'APR', sortable: true },
  { key: 'action', label: '' },
];

const selectedAsset = ref(null);
const selectedCurrency = ref(null);
const eventSourceConnected = ref(null);

const supportedAssets = computed(() => Array.from(leaseStore.assets.keys()));

const computedRequests = computed(() => {
  return leaseStore.requests.filter((r) => {
    if (selectedAsset.value && selectedCurrency.value) {
      return r.asset === selectedAsset.value && r.currency === selectedCurrency.value;
    } else if (selectedAsset.value) {
      return r.asset === selectedAsset.value;
    } else if (selectedCurrency.value) {
      return r.currency === selectedCurrency.value;
    }

    return true;
  });
});

onBeforeMount(async () => {
  loading.value = true;

  await leaseStore.fetchLeaseRequests();

  loading.value = false;
});

const onBoardcastSuccess = async ({ id }) => {
  await vfm.closeAll();

  loading.value = true;

  await store.validateTransaction(id);

  loading.value = false;
};

const openRequestLeaseModal = async () => {
  const { open } = useModal({ component: RequestLeaseModal });

  await open();
};

let interval = null;

watchThrottled(
  eventSourceConnected,
  (connected) => {
    if (connected) {
      if (interval) clearInterval(interval);
    } else {
      interval = setInterval(leaseStore.fetchLeaseRequests, 10 * 1000);
    }
  },
  { throttle: 3 * 1000 },
);

let eventSourceInstance = eventSource.getInstance();

onMounted(() => {
  eventSourceInstance.addEventListener('open', () => (eventSourceConnected.value = true));
  eventSourceInstance.addEventListener('error', () => (eventSourceConnected.value = false));
  eventSourceInstance.addEventListener('updateRequests', leaseStore.fetchLeaseRequests);

  eventBus.on('lease-request-successful', onBoardcastSuccess);
  eventBus.on('lease-request-cancel-successful', onBoardcastSuccess);
});

onBeforeUnmount(() => {
  eventSourceInstance.removeEventListener('open', () => (eventSourceConnected.value = true));
  eventSourceInstance.removeEventListener('error', () => (eventSourceConnected.value = false));
  eventSourceInstance.removeEventListener('updateRequests', leaseStore.fetchLeaseRequests);

  eventBus.off('lease-request-successful', onBoardcastSuccess);
  eventBus.off('lease-request-cancel-successful', onBoardcastSuccess);

  if (interval) {
    clearInterval(interval);
  }
});
</script>
