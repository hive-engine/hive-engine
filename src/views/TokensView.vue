<template>
  <div class="page-header">
    <div class="mx-auto w-full max-w-7xl px-2 text-gray-200 sm:px-6 lg:px-8">
      <div class="grid min-h-[160px] items-center text-center md:grid-cols-4 md:text-left">
        <div class="col-span-full mt-3 md:col-span-3">
          <h1 class="text-4xl uppercase">Tokens</h1>
        </div>

        <div class="col-span-full mt-3 md:col-span-1">
          <input
            v-model="filter"
            type="text"
            placeholder="Search tokens"
            @input="(event) => (filter = event.target.value.toUpperCase())"
          />
        </div>
      </div>
    </div>
  </div>

  <Loading v-if="loading" />

  <div v-else class="page-content">
    <custom-table :fields="fields" :items="filteredTokens" :per-page="100">
      <template #cell(icon)="{ item }">
        <img :src="item.icon" class="w-10" />
      </template>

      <template #cell(marketCap)="{ item }">${{ item.marketCap.toLocaleString() }}</template>

      <template #cell(price)="{ item }">${{ addCommas(item.price, true) }}</template>

      <template #cell(change)="{ item }">
        <span
          :class="{
            'text-green-500': parseFloat(item.change) > 0,
            'text-red-500': parseFloat(item.change) < 0,
          }"
          >{{ item.change }}</span
        >
      </template>

      <template #cell(volume)="{ item }">${{ addCommas(item.volume, true) }}</template>

      <template #cell(circulatingSupply)="{ item }">
        {{ item.circulatingSupply.toLocaleString() }}
      </template>

      <template #cell(actions)="{ item }">
        <div class="flex">
          <button class="btn-sm mr-1" @click="openTokenInfoModal(item)">
            <InformationCircleIcon class="h-5 w-5" />
          </button>

          <router-link
            v-if="item.symbol !== 'SWAP.HIVE'"
            :to="{ name: 'trade', params: { symbol: item.symbol } }"
            class="btn-sm"
          >
            <ArrowsRightLeftIcon class="h-5 w-5" />
          </router-link>
        </div>
      </template>
    </custom-table>
  </div>

  <PageFooter />
</template>

<script setup>
import { ArrowsRightLeftIcon, InformationCircleIcon } from '@heroicons/vue/24/outline';
import { useHead } from '@unhead/vue';
import { computed, defineAsyncComponent, inject, onBeforeMount, ref } from 'vue';
import { useModal } from 'vue-final-modal';
import PageFooter from '@/components/PageFooter.vue';
import CustomTable from '@/components/utilities/CustomTable.vue';
import { useStore } from '@/stores';
import { useTokenStore } from '@/stores/token';
import { addCommas } from '@/utils';

const TokenInfoModal = defineAsyncComponent(() => import('@/components/modals/TokenInfo.vue'));

useHead({
  title: 'Tokens',
});

const loading = ref(true);
const filter = ref('');
const toFixedWithoutRounding = inject('toFixedWithoutRounding');

const store = useStore();
const tokenStore = useTokenStore();

const fields = [
  { key: 'icon', label: '' },
  { key: 'symbol', label: 'Token', sortable: true },
  { key: 'name', label: 'Name' },
  { key: 'marketCap', label: 'Market Cap', sortable: true },
  { key: 'price', label: 'Price', sortable: true },
  { key: 'change', label: '% Change', sortable: true },
  { key: 'volume', label: '24h Volume', sortable: true },
  { key: 'circulatingSupply', label: 'Supply', sortable: true },
  { key: 'actions', label: '' },
];

const metrics = computed(() =>
  tokenStore.metrics.reduce((acc, cur) => {
    const { volume, volumeExpiration, lastPrice, priceChangePercent: change } = cur;

    acc.set(cur.symbol, {
      volume: Number(volume),
      volumeExpiration,
      price: Number(lastPrice),
      change,
    });

    return acc;
  }, new Map()),
);

const tokens = computed(() => {
  return tokenStore.tokens
    .filter((t) => !store.settings.deprecated_tokens.includes(t.symbol))
    .reduce((acc, cur) => {
      let { maxSupply, supply, circulatingSupply } = cur;

      let volume = 0;
      let price = 0;
      let change = 0;
      let volumeExpiration = 0;

      if (metrics.value.has(cur.symbol)) {
        ({ volume, price, change, volumeExpiration } = metrics.value.get(cur.symbol));

        if (volumeExpiration * 1000 < Date.now()) {
          volume = 0;
        }
      }

      price = toFixedWithoutRounding(price * store.hivePrice, 5);
      volume = toFixedWithoutRounding(volume * store.hivePrice, 0);
      maxSupply = Number(maxSupply);
      supply = Number(supply);
      circulatingSupply = Number(circulatingSupply);

      const marketCap = toFixedWithoutRounding(circulatingSupply * price, 0);

      acc.push({
        ...cur,
        maxSupply,
        supply,
        circulatingSupply,
        marketCap,
        volume,
        price,
        change,
      });

      return acc;
    }, [])
    .sort((a, b) => b.volume - a.volume);
});

const filteredTokens = computed(() => {
  const regExp = new RegExp(filter.value, 'i');

  return tokens.value.filter((t) => {
    if (filter.value !== '') {
      return regExp.test(t.symbol);
    }

    return true;
  });
});

const openTokenInfoModal = async (token) => {
  const { open } = useModal({ component: TokenInfoModal, attrs: { token } });

  await open();
};

onBeforeMount(async () => {
  loading.value = true;

  try {
    await Promise.all([tokenStore.fetchTokens(), tokenStore.fetchMetrics()]);
  } catch {
    //
  }

  loading.value = false;
});
</script>
