<template>
  <div class="page-header">
    <div class="mx-auto w-full max-w-7xl px-2 text-gray-200 sm:px-6 lg:px-8">
      <div class="grid min-h-[160px] items-center text-center md:grid-cols-4 md:text-left">
        <div class="col-span-full mt-3 md:col-span-3">
          <h1 class="text-4xl uppercase">Rewards</h1>
        </div>
      </div>
    </div>
  </div>

  <Loading v-if="loading" />

  <div v-else class="page-content">
    <div class="alert-warning">You can only claim a token once a day, including manual and auto.</div>

    <CustomTable :fields="rewardsTableFields" :items="rewards">
      <template #cell(actions)="{ item }">
        <button class="btn-sm" @click.prevent="walletStore.requestClaimScotRewards(item.symbol)">Claim</button>
      </template>
    </CustomTable>

    <div class="mt-5 text-right">
      <button class="btn-sm" @click.prevent="claimAll">Claim All</button>
    </div>
  </div>

  <PageFooter />
</template>

<script setup>
import { useHead } from '@unhead/vue';
import { onBeforeMount, onBeforeUnmount, onMounted, ref } from 'vue';
import PageFooter from '@/components/PageFooter.vue';
import CustomTable from '@/components/utilities/CustomTable.vue';
import { emitter } from '@/plugins/mitt';
import { useWalletStore } from '@/stores/wallet';
import { sleep } from '@/utils';

useHead({
  title: 'SCOT Rewards',
});

const loading = ref(true);

const walletStore = useWalletStore();

const rewards = ref([]);

const rewardsTableFields = [
  { key: 'symbol', label: 'SYMBOL' },
  { key: 'stake', label: 'STAKE' },
  { key: 'reward', label: 'REWARD' },
  { key: 'actions', label: '' },
];

const fetchRewards = async () => {
  try {
    rewards.value = await walletStore.fetchScotRewards();
  } catch {
    //
  }
};

const claimAll = async () => {
  const symbols = rewards.value.map((r) => r.symbol);

  await walletStore.requestClaimScotRewards(symbols);
};

const onScotClaim = async () => {
  loading.value = true;

  await sleep(30 * 1000);

  await fetchRewards();

  loading.value = false;
};

onBeforeMount(async () => {
  loading.value = true;

  await fetchRewards();

  loading.value = false;
});

onMounted(() => {
  emitter.on('scot-claim-successful', onScotClaim);
});

onBeforeUnmount(() => {
  emitter.off('scot-claim-successful', onScotClaim);
});
</script>
