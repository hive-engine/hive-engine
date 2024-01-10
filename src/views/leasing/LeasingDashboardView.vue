<template>
  <div class="page-header">
    <div class="mx-auto w-full max-w-7xl px-2 text-gray-200 sm:px-6 lg:px-8">
      <div class="grid min-h-[120px] items-center text-center md:grid-cols-4 md:text-left">
        <div class="col-span-full mt-3 md:col-span-1">
          <h1 class="text-4xl uppercase">Lease Dashboard</h1>
        </div>
      </div>
    </div>
  </div>

  <Loading v-if="loading" />

  <div v-else class="page-content pt-3">
    <div class="flex items-center justify-between gap-4">
      <select v-model="selectedAsset" name="selectedAsset" class="mb-5 w-[200px]">
        <option :value="null">{{ selectedAsset ? 'Reset filter' : 'Filter by asset' }}</option>
        <option v-for="symbol of supportedAssets" :key="symbol" :value="symbol">{{ symbol }}</option>
      </select>

      <select v-model="selectedCurrency" name="selectedCurrency" class="mb-5 w-[200px]">
        <option :value="null">{{ selectedCurrency ? 'Reset filter' : 'Filter by currency' }}</option>
        <option v-for="symbol of leaseStore.currencies" :key="symbol" :value="symbol">{{ symbol }}</option>
      </select>
    </div>

    <TabGroup :selected-index="selectedTab" @change="onTabChange">
      <TabList class="flex space-x-4 rounded-md bg-slate-500 p-1 dark:bg-slate-700">
        <Tab v-slot="{ selected }" as="templete">
          <button :class="['btn hover:!bg-red-600 focus:outline-none', selected ? '!bg-red-600' : '!bg-transparent']">
            Requests
          </button>
        </Tab>

        <Tab v-slot="{ selected }" as="templete">
          <button :class="['btn hover:!bg-red-600 focus:outline-none', selected ? '!bg-red-600' : '!bg-transparent']">
            Delegated (Out)
          </button>
        </Tab>

        <Tab v-slot="{ selected }" as="templete">
          <button :class="['btn hover:!bg-red-600 focus:outline-none', selected ? '!bg-red-600' : '!bg-transparent']">
            Leased (In)
          </button>
        </Tab>

        <Tab v-slot="{ selected }" as="template">
          <button :class="['btn hover:!bg-red-600 focus:outline-none', selected ? '!bg-red-600' : '!bg-transparent']">
            Expired Leases
          </button>
        </Tab>
      </TabList>

      <TabPanels class="mt-3">
        <TabPanel>
          <CustomTable :items="computedRequests" :fields="requestsTableFields">
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

            <template #cell(expires_at)="{ item }">
              {{ item.expires_at.toLocaleString() }}
            </template>

            <template #cell(actions)="{ item }">
              <button class="btn-sm" @click.prevent="leaseStore.requestCancelLease(item)">Cancel</button>
            </template>
          </CustomTable>
        </TabPanel>

        <TabPanel>
          <CustomTable :items="computedDelegated" :fields="delegatedTableFields">
            <template #cell(amount)="{ item }"
              >{{ addCommas(item.asset === 'HP' ? Number((item.amount * item.vests_price).toFixed(3)) : item.amount) }}
              {{ item.asset }}</template
            >
            <template #cell(apr)="{ item }">{{ toFixedNoRounding(item.apr, 2) }}%</template>
            <template #cell(progress)="{ item }">{{ item.progress }}%</template>
            <template #cell(expires_at)="{ item }">
              {{ item.expires_at.toLocaleString() }}
            </template>
            <template #cell(actions)="{ item }">
              <button class="btn-sm" @click.prevent="leaseStore.requestUndelegate(item)">Undelegate</button>
            </template>
          </CustomTable>
        </TabPanel>

        <TabPanel>
          <CustomTable :items="computedLeased" :fields="leasedTableFields">
            <template #cell(amount)="{ item }"
              >{{ addCommas(item.asset === 'HP' ? Number((item.amount * item.vests_price).toFixed(3)) : item.amount) }}
              {{ item.asset }}</template
            >
            <template #cell(paid_payment)="{ item }">{{ item.paid_payment }} {{ item.currency }}</template>
            <template #cell(progress)="{ item }">{{ item.progress }}%</template>
            <template #cell(expires_at)="{ item }">
              {{ item.expires_at.toLocaleString() }}
            </template>
            <template #cell(actions)="{ item }">
              <button class="btn-sm" @click.prevent="openRenewLeaseModal(item)">Renew</button>
            </template>
          </CustomTable>
        </TabPanel>

        <TabPanel>
          <CustomTable :items="computedExpired" :fields="expiredTableFields">
            <template #cell(amount)="{ item }"
              >{{ addCommas(item.asset === 'HP' ? Number((item.amount * item.vests_price).toFixed(3)) : item.amount) }}
              {{ item.asset }}</template
            >
            <template #cell(payment_received)="{ item }">{{ item.payment_received }} {{ item.currency }}</template>
            <template #cell(expired_on)="{ item }">
              {{ item.expired_on.toLocaleString() }}
            </template>
            <template #cell(actions)="{ item }">
              <button class="btn-sm" @click.prevent="leaseStore.requestUndelegate(item)">Undelegate</button>
            </template>
          </CustomTable>
        </TabPanel>
      </TabPanels>
    </TabGroup>
  </div>
</template>

<script setup>
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/vue';
import { useHead } from '@unhead/vue';
import { watchThrottled } from '@vueuse/core';
import { addWeeks } from 'date-fns';
import { computed, inject, onBeforeMount, onMounted, onBeforeUnmount, ref, defineAsyncComponent } from 'vue';
import { useModal, useVfm } from 'vue-final-modal';
import CustomTable from '@/components/utilities/CustomTable.vue';
import Loading from '@/components/utilities/Loading.vue';
import { useStore } from '@/stores';
import { useLeaseStore } from '@/stores/lease';
import { addCommas, toFixedNoRounding } from '@/utils';

const RenewLeaseModal = defineAsyncComponent(() => import('@/components/modals/RenewLeaseModal.vue'));

useHead({
  title: 'Lease Dashboard',
});

const loading = ref(false);

const vfm = useVfm();

const eventBus = inject('eventBus');
const eventSource = inject('eventSource');

const store = useStore();
const leaseStore = useLeaseStore();

const selectedAsset = ref(null);
const selectedCurrency = ref(null);
const selectedTab = ref(0);

const eventSourceConnected = ref(null);

const requestsTableFields = [
  { key: 'buyer', label: 'Buyer' },
  { key: 'amount', label: 'Amount', sortable: true },
  { key: 'duration', label: 'Duration', sortable: true },
  { key: 'total_payment', label: 'Payment', sortable: true },
  { key: 'duration', label: 'Duration', sortable: true },
  { key: 'apr', label: 'APR', sortable: true },
  { key: 'expires_at', label: 'Expires At', sortable: true },
  { key: 'actions', label: '' },
];

const delegatedTableFields = [
  { key: 'delegated_to', label: 'Delegated To', sortable: true },
  { key: 'amount', label: 'Amount', sortable: true },
  { key: 'apr', label: 'APR', sortable: true },
  { key: 'progress', label: 'Progress', sortable: true },
  { key: 'expires_at', label: 'Expires At', sortable: true },
  { key: 'actions', label: '' },
];

const leasedTableFields = [
  { key: 'beneficiary', label: 'Leasee', sortable: true },
  { key: 'leased_from', label: 'Leased From', sortable: true },
  { key: 'amount', label: 'Amount', sortable: true },
  { key: 'paid_payment', label: 'Paid', sortable: true },
  { key: 'progress', label: 'Progress', sortable: true },
  { key: 'expires_at', label: 'Expires At', sortable: true },
  { key: 'actions', label: '' },
];

const expiredTableFields = [
  { key: 'leasee', label: 'Leasee', sortable: true },
  { key: 'amount', label: 'Amount', sortable: true },
  { key: 'payment_received', label: 'Payment Received', sortable: true },
  { key: 'expired_on', label: 'Expired On', sortable: true },
  { key: 'actions', label: '' },
];

const supportedAssets = computed(() => Array.from(leaseStore.assets.keys()));

const computedDelegated = computed(() => {
  return leaseStore.dashboard.delegated
    .filter((r) => {
      if (selectedAsset.value && selectedCurrency.value) {
        return r.asset === selectedAsset.value && r.currency === selectedCurrency.value;
      } else if (selectedAsset.value) {
        return r.asset === selectedAsset.value;
      } else if (selectedCurrency.value) {
        return r.currency === selectedCurrency.value;
      }

      return true;
    })
    .map((d) => {
      return {
        ...d,
        delegated_to: d.beneficiary,
        progress: toFixedNoRounding((1 - (d.total_payment - d.paid_payment) / d.total_payment) * 100, 2),
        expires_at: addWeeks(new Date(d.created_at), d.duration),
      };
    });
});

const computedLeased = computed(() => {
  return leaseStore.dashboard.leases_in
    .filter((r) => {
      if (selectedAsset.value && selectedCurrency.value) {
        return r.asset === selectedAsset.value && r.currency === selectedCurrency.value;
      } else if (selectedAsset.value) {
        return r.asset === selectedAsset.value;
      } else if (selectedCurrency.value) {
        return r.currency === selectedCurrency.value;
      }

      return true;
    })
    .map((d) => {
      return {
        ...d,
        leased_from: d.filled_by,
        progress: toFixedNoRounding((1 - (d.total_payment - d.paid_payment) / d.total_payment) * 100, 2),
        expires_at: addWeeks(new Date(d.created_at), d.duration),
      };
    });
});

const computedRequests = computed(() => {
  return leaseStore.dashboard.requests
    .filter((r) => {
      if (selectedAsset.value && selectedCurrency.value) {
        return r.asset === selectedAsset.value && r.currency === selectedCurrency.value;
      } else if (selectedAsset.value) {
        return r.asset === selectedAsset.value;
      } else if (selectedCurrency.value) {
        return r.currency === selectedCurrency.value;
      }

      return true;
    })
    .map((d) => {
      return {
        ...d,
        expires_at: new Date(d.expires_at),
      };
    });
});

const computedExpired = computed(() => {
  return leaseStore.dashboard.expired
    .filter((r) => {
      if (selectedAsset.value && selectedCurrency.value) {
        return r.asset === selectedAsset.value && r.currency === selectedCurrency.value;
      } else if (selectedAsset.value) {
        return r.asset === selectedAsset.value;
      } else if (selectedCurrency.value) {
        return r.currency === selectedCurrency.value;
      }

      return true;
    })
    .map((d) => {
      return {
        ...d,
        leasee: d.beneficiary,
        progress: toFixedNoRounding((1 - (d.total_payment - d.paid_payment) / d.total_payment) * 100, 2),
        expired_on: new Date(d.completed_at),
      };
    });
});

const onTabChange = (idx) => {
  selectedTab.value = idx;
  selectedAsset.value = null;
  selectedCurrency.value = null;
};

const onBoardcastSuccess = async ({ id }) => {
  await vfm.closeAll();

  loading.value = true;

  await store.validateTransaction(id);

  loading.value = false;
};

const onLeaseUndelegation = ({ eventData }) => {
  const { dashboard } = leaseStore;

  if (dashboard && dashboard.delegated) {
    leaseStore.dashboard = {
      ...leaseStore.dashboard,
      delegated: leaseStore.dashboard.delegated.filter((d) => d.id !== eventData.id),
    };
  }
};

const openRenewLeaseModal = async (lease) => {
  const { open } = useModal({ component: RenewLeaseModal, attrs: { lease } });

  await open();
};

let interval = null;

watchThrottled(
  eventSourceConnected,
  (connected) => {
    if (connected) {
      if (interval) clearInterval(interval);
    } else {
      interval = setInterval(leaseStore.fetchUserLeases, 30 * 1000);
    }
  },
  { throttle: 3 * 1000 },
);

onBeforeMount(async () => {
  loading.value = true;

  await leaseStore.fetchUserLeases();

  loading.value = false;
});

let eventSourceInstance = eventSource.getInstance();

onMounted(() => {
  eventSourceInstance.addEventListener('open', () => (eventSourceConnected.value = true));
  eventSourceInstance.addEventListener('error', () => (eventSourceConnected.value = false));
  eventSourceInstance.addEventListener('updateDashboard', leaseStore.fetchUserLeases);

  eventBus.on('lease-renew-successful', onBoardcastSuccess);
  eventBus.on('lease-request-cancel-successful', onBoardcastSuccess);
  eventBus.on('lease-undelegation-successful', onLeaseUndelegation);
});

onBeforeUnmount(() => {
  eventSourceInstance.removeEventListener('open', () => (eventSourceConnected.value = true));
  eventSourceInstance.removeEventListener('error', () => (eventSourceConnected.value = false));
  eventSourceInstance.removeEventListener('updateDashboard', leaseStore.fetchUserLeases);

  eventBus.off('lease-renew-successful', onBoardcastSuccess);
  eventBus.off('lease-request-cancel-successful', onBoardcastSuccess);
  eventBus.off('lease-undelegation-successful', onLeaseUndelegation);

  if (interval) {
    clearInterval(interval);
  }
});
</script>
