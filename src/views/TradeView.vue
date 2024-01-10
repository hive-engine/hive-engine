<template>
  <div class="page-header">
    <div class="mx-auto w-full max-w-7xl px-2 text-gray-200 sm:px-6 lg:px-8">
      <div class="grid min-h-[160px] items-center text-center md:grid-cols-4 md:text-left">
        <div class="col-span-full mt-3 md:col-span-3">
          <h1 class="text-4xl uppercase">Market</h1>
          <p class="mt-3 text-xl">Trade any Hive Engine token against HIVE on the internal DEX!</p>
        </div>
      </div>
    </div>
  </div>

  <Loading v-if="loading" />

  <div v-else class="page-content pt-5">
    <div
      v-if="metrics"
      class="mb-5 flex flex-wrap items-center justify-center border-b border-gray-400 pb-5 dark:border-gray-600 sm:justify-between"
    >
      <div class="mb-3 pr-2 sm:flex-grow sm:basis-0 md:basis-12">
        <div class="flex items-center">
          <SearchSelect v-model="symbol" classes="rounded-l-md" menu-class="rounded-md" :options="tokens" />

          <button
            class="self-stretch rounded-r-md border border-l-0 border-gray-500 bg-white p-2 hover:text-red-400 dark:border-gray-500 dark:bg-slate-600"
            @click="openTokenInfoModal(token)"
          >
            <information-circle-icon class="h-6 w-6" />
          </button>
        </div>
      </div>

      <div class="mb-3 flex-grow basis-0 px-2 text-sm">
        <div class="font-bold">Last Price</div>
        <div>{{ metrics.lastPrice }}</div>
        <div class="text-gray-500">${{ (metrics.lastPrice * hivePrice).toFixed(7) }}</div>
      </div>

      <div class="mb-3 flex-grow basis-0 px-2 text-sm">
        <div class="font-bold">
          24h
          <span
            :class="{
              'text-green-500': parseFloat(metrics.priceChangePercent) > 0,
              'text-red-500': parseFloat(metrics.priceChangePercent) < 0,
            }"
            >{{ metrics.priceChangePercent }}</span
          >
        </div>
        <div
          :class="{
            'text-green-500': parseFloat(metrics.priceChangePercent) > 0,
            'text-red-500': parseFloat(metrics.priceChangePercent) < 0,
          }"
        >
          {{ metrics.priceChangeHive }}
        </div>
        <div class="text-gray-500">${{ (metrics.priceChangeHive * hivePrice).toFixed(7) }}</div>
      </div>

      <div class="mb-3 flex-grow basis-0 px-2 text-sm">
        <div class="font-bold">Ask</div>
        <div>{{ metrics.lowestAsk }}</div>
        <div class="text-gray-500">${{ (metrics.lowestAsk * hivePrice).toFixed(7) }}</div>
      </div>

      <div class="mb-3 flex-grow basis-0 px-2 text-sm">
        <div class="font-bold">Bid</div>
        <div>{{ metrics.highestBid }}</div>
        <div class="text-gray-500">${{ (metrics.highestBid * hivePrice).toFixed(7) }}</div>
      </div>

      <div class="mb-3 flex-grow basis-0 pl-2 text-sm">
        <div class="font-bold">Volume</div>
        <div>{{ metrics.volume }}</div>
        <div class="text-gray-500">${{ (metrics.volume * hivePrice).toFixed(7) }}</div>
      </div>
    </div>

    <div class="mb-5">
      <div class="text-right">
        <button
          :disabled="interval === 'daily'"
          class="btn-sm rounded-l-md rounded-r-none px-4 py-1"
          @click="interval = 'daily'"
        >
          Daily
        </button>

        <button
          :disabled="interval === 'hourly'"
          class="btn-sm rounded-l-none rounded-r-md px-4 py-1"
          @click="interval = 'hourly'"
        >
          Hourly
        </button>
      </div>

      <CandleChart v-if="chartType === 'candle'" :data="candleChartData" />
      <DepthChart v-else-if="chartType === 'depth'" :data="depthChartData" />
      <VolumeChart v-else-if="chartType === 'volume'" :data="volumeChartData" />
    </div>

    <div class="mb-8 text-center">
      <button
        :disabled="chartType === 'candle'"
        class="btn-sm rounded-l-md rounded-r-none px-4 py-1"
        @click="chartType = 'candle'"
      >
        Candle
      </button>

      <button :disabled="chartType === 'depth'" class="btn-sm rounded-none px-4 py-1" @click="chartType = 'depth'">
        Depth
      </button>

      <button
        :disabled="chartType === 'volume'"
        class="btn-sm rounded-l-none rounded-r-md px-4 py-1"
        @click="chartType = 'volume'"
      >
        Volume
      </button>
    </div>

    <div v-if="isLoggedIn" class="grid gap-10 md:grid-cols-2">
      <div class="col-span-1">
        <div class="flex items-center justify-between">
          <h3 class="w-2/4 text-xl font-bold">Buy {{ symbol }}</h3>

          <RadioGroup v-model="buyOrderType" class="flex items-center">
            <RadioGroupOption v-slot="{ checked }" value="limit">
              <span
                :class="[
                  checked ? 'bg-red-700 shadow-inner shadow-red-800' : 'bg-red-600',
                  'cursor-pointer rounded-l-md p-2 font-bold text-white',
                ]"
                >Limit</span
              >
            </RadioGroupOption>

            <RadioGroupOption v-slot="{ checked, disabled }" value="market" :disabled="token.precision <= 3">
              <span
                :class="[
                  checked ? 'bg-red-700 shadow-inner shadow-red-800' : 'bg-red-600',
                  'cursor-pointer rounded-r-md p-2 font-bold text-white',
                  disabled ? 'cursor-not-allowed' : '',
                ]"
                >Market</span
              >
            </RadioGroupOption>
          </RadioGroup>
        </div>

        <div class="mt-3 flex items-center">
          <label for="buyPrice" class="w-2/4 font-bold">Price</label>

          <div class="flex w-full items-center">
            <input
              id="buyPrice"
              v-model="buyPrice"
              type="number"
              class="!rounded-r-none"
              :disabled="buyOrderType === 'market'"
            />
            <div
              class="rounded-r-md border border-l-0 border-gray-500 bg-gray-200 p-2 dark:border-gray-500 dark:bg-slate-600"
            >
              HIVE/{{ symbol }}
            </div>
          </div>
        </div>

        <div class="mt-3 flex items-center">
          <label for="buyQuantity" class="w-2/4 font-bold">Quantity</label>

          <div class="flex w-full items-center">
            <input
              id="buyQuantity"
              v-model="buyQuantity"
              type="number"
              class="!rounded-r-none"
              :disabled="buyOrderType === 'market'"
            />
            <div
              class="rounded-r-md border border-l-0 border-gray-500 bg-gray-200 p-2 dark:border-gray-500 dark:bg-slate-600"
            >
              {{ symbol }}
            </div>
          </div>
        </div>

        <div class="mt-3 flex items-center">
          <label for="buyTotal" class="w-2/4 font-bold">Total</label>

          <div class="flex w-full items-center">
            <input
              id="buyTotal"
              v-model="buyTotal"
              type="number"
              class="!rounded-r-none"
              :readonly="buyOrderType === 'limit'"
            />
            <div
              class="rounded-r-md border border-l-0 border-gray-500 bg-gray-200 p-2 dark:border-gray-500 dark:bg-slate-600"
            >
              HIVE
            </div>
          </div>
        </div>

        <div class="mt-3 flex items-center justify-between">
          <div class="w-3/4">
            Balance:
            <a
              class="cursor-pointer"
              @click="
                buyOrderType === 'limit'
                  ? (buyQuantity = toFixedWithoutRounding(hiveBalance / buyPrice, token.precision))
                  : (buyTotal = hiveBalance)
              "
              >{{ hiveBalance }} HIVE</a
            >
          </div>

          <button
            :disabled="disabledBuyButton"
            class="btn"
            @click="
              marketStore.requestPlaceOrder({
                action: 'buy',
                type: buyOrderType,
                symbol,
                price: toFixedWithoutRounding(buyPrice, 8),
                quantity: toFixedWithoutRounding(buyQuantity, token.precision),
                total: buyTotal,
              })
            "
          >
            Buy {{ symbol }}
          </button>
        </div>
      </div>

      <div class="col-span-1">
        <div class="flex items-center justify-between">
          <h3 class="w-2/4 text-xl font-bold">Sell {{ symbol }}</h3>

          <RadioGroup v-model="sellOrderType" class="flex items-center">
            <RadioGroupOption v-slot="{ checked }" value="limit">
              <span
                :class="[
                  checked ? 'bg-red-700 shadow-inner shadow-red-800' : 'bg-red-600',
                  'cursor-pointer rounded-l-md p-2 font-bold text-white',
                ]"
                >Limit</span
              >
            </RadioGroupOption>

            <RadioGroupOption v-slot="{ checked, disabled }" value="market" :disabled="token.precision <= 3">
              <span
                :class="[
                  checked ? 'bg-red-700 shadow-inner shadow-red-800' : 'bg-red-600',
                  'cursor-pointer rounded-r-md p-2 font-bold text-white',
                  disabled ? 'cursor-not-allowed' : '',
                ]"
                >Market</span
              >
            </RadioGroupOption>
          </RadioGroup>
        </div>

        <div class="mt-3 flex items-center">
          <label for="sellPrice" class="w-2/4 font-bold">Price</label>

          <div class="flex w-full items-center">
            <input
              id="sellPrice"
              v-model="sellPrice"
              type="number"
              class="!rounded-r-none"
              :disabled="sellOrderType === 'market'"
            />
            <div
              class="rounded-r-md border border-l-0 border-gray-500 bg-gray-200 p-2 dark:border-gray-500 dark:bg-slate-600"
            >
              HIVE/{{ symbol }}
            </div>
          </div>
        </div>

        <div class="mt-3 flex items-center">
          <label for="sellQuantity" class="w-2/4 font-bold">Quantity</label>

          <div class="flex w-full items-center">
            <input id="sellQuantity" v-model="sellQuantity" type="number" class="!rounded-r-none" />
            <div
              class="rounded-r-md border border-l-0 border-gray-500 bg-gray-200 p-2 dark:border-gray-500 dark:bg-slate-600"
            >
              {{ symbol }}
            </div>
          </div>
        </div>

        <div class="mt-3 flex items-center">
          <label for="sellTotal" class="w-2/4 font-bold">Total</label>

          <div class="flex w-full items-center">
            <input
              id="sellTotal"
              v-model="sellTotal"
              type="number"
              class="!rounded-r-none"
              :readonly="sellOrderType === 'limit'"
              :disabled="sellOrderType === 'market'"
            />
            <div
              class="rounded-r-md border border-l-0 border-gray-500 bg-gray-200 p-2 dark:border-gray-500 dark:bg-slate-600"
            >
              HIVE
            </div>
          </div>
        </div>

        <div class="mt-3 flex items-center justify-between">
          <div class="w-3/4">
            Balance:
            <a class="cursor-pointer" @click="sellQuantity = symbolBalance">{{ symbolBalance }} {{ symbol }}</a>
          </div>

          <button
            :disabled="disabledSellButton"
            class="btn"
            @click="
              marketStore.requestPlaceOrder({
                action: 'sell',
                type: sellOrderType,
                symbol,
                price: toFixedWithoutRounding(sellPrice, 8),
                quantity: toFixedWithoutRounding(sellQuantity, token.precision),
                total: sellTotal,
              })
            "
          >
            Sell {{ symbol }}
          </button>
        </div>
      </div>
    </div>

    <div class="grid gap-10 md:grid-cols-2">
      <div class="col-span-1 mt-5">
        <h3 class="mb-3 text-xl font-bold">Buy Orders</h3>

        <custom-table
          :fields="buyBookFields"
          :items="buyBook.slice(0, 15)"
          th-class="md:text-right"
          td-class="md:text-right"
        >
          <template #cell(price)="{ item }">
            <a
              class="cursor-pointer"
              @click="
                sellPrice = item.price;
                buyPrice = item.price;
                sellQuantity = item.quantity;
                buyQuantity = item.quantity;
              "
              >{{ item.price.toFixed(8) }}</a
            >
          </template>
        </custom-table>
      </div>

      <div class="col-span-1 mt-5">
        <h3 class="mb-3 text-xl font-bold">Sell Orders</h3>

        <custom-table
          :fields="sellBookFields"
          :items="sellBook.slice(0, 15)"
          th-class="md:text-left"
          td-class="md:text-left"
        >
          <template #cell(price)="{ item }">
            <a
              class="cursor-pointer"
              @click="
                sellPrice = item.price;
                buyPrice = item.price;
                sellQuantity = item.quantity;
                buyQuantity = item.quantity;
              "
              >{{ item.price.toFixed(8) }}</a
            >
          </template>
        </custom-table>
      </div>
    </div>

    <template v-if="isLoggedIn">
      <div class="flex items-center">
        <h3 class="mb-3 mt-5 w-3/4 text-xl font-bold">Open Orders</h3>

        <div v-if="selectedOrders.length > 1" class="w-full text-right">
          <button class="btn-sm px-4" @click="marketStore.requestCancelOrders(selectedOrders)">Cancel All</button>
        </div>
      </div>

      <custom-table :fields="openOrdersFields" :items="openOrders">
        <template #cell(checkbox)="{ item }">
          <input v-model="selectedOrders" type="checkbox" :value="item" />
        </template>

        <template #cell(type)="{ item }">
          <span :class="{ 'text-red-500': item.type === 'SELL', 'text-green-500': item.type === 'BUY' }">{{
            item.type
          }}</span>
        </template>

        <template #cell(txId)="{ item }">
          <button class="btn-sm" @click="marketStore.requestCancelOrders([item])">
            <XMarkIcon class="h-5 w-5" />
          </button>
        </template>
      </custom-table>
    </template>

    <h3 class="mb-3 mt-5 text-xl font-bold">Trade History</h3>

    <custom-table :fields="tradesHistoryFields" :items="tradesHistory">
      <template #cell(type)="{ item }">
        <span :class="{ 'text-red-500': item.type === 'SELL', 'text-green-500': item.type === 'BUY' }">{{
          item.type
        }}</span>
      </template>
    </custom-table>
  </div>

  <PageFooter />
</template>

<script setup>
import { RadioGroup, RadioGroupOption } from '@headlessui/vue';
import { InformationCircleIcon, XMarkIcon } from '@heroicons/vue/24/outline';
import { useHead } from '@unhead/vue';
import { useDocumentVisibility } from '@vueuse/core';
import { format } from 'date-fns';
import { computed, defineAsyncComponent, onBeforeMount, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useModal } from 'vue-final-modal';
import { useRoute, useRouter } from 'vue-router';
import CandleChart from '@/components/charts/CandleChart.vue';
import DepthChart from '@/components/charts/DepthChart.vue';
import VolumeChart from '@/components/charts/VolumeChart.vue';
import PageFooter from '@/components/PageFooter.vue';
import CustomTable from '@/components/utilities/CustomTable.vue';
import SearchSelect from '@/components/utilities/SearchSelect.vue';
import { emitter } from '@/plugins/mitt';
import { useStore } from '@/stores';
import { useMarketStore } from '@/stores/market';
import { useTokenStore } from '@/stores/token';
import { useUserStore } from '@/stores/user';
import { useWalletStore } from '@/stores/wallet';
import { filterOutliers, toFixedWithoutRounding } from '@/utils';

const TokenInfoModal = defineAsyncComponent(() => import('@/components/modals/TokenInfo.vue'));

const loading = ref(true);
const route = useRoute();
const router = useRouter();

useHead({
  title: `Trade ${route.params.symbol}`,
});

const store = useStore();
const userStore = useUserStore();
const marketStore = useMarketStore();
const walletStore = useWalletStore();
const tokenStore = useTokenStore();
const visibility = useDocumentVisibility();

const symbol = ref(route.params.symbol);

const buyOrderType = ref('limit');
const buyPrice = ref('');
const buyQuantity = ref('');
const buyTotal = ref('');

const sellOrderType = ref('limit');
const sellPrice = ref('');
const sellQuantity = ref('');
const sellTotal = ref('');

const interval = ref('daily');
const chartType = ref('candle');
const selectedOrders = ref([]);

const candleChartData = ref({});
const depthChartData = ref({});
const volumeChartData = ref({});

const refresh = ref(true);

const isLoggedIn = computed(() => userStore.isLoggedIn);
const username = computed(() => userStore.username);
const hiveBalance = computed(() => {
  const balance = walletStore.wallet.find((w) => w.symbol === 'SWAP.HIVE');

  return balance ? balance.balance : 0;
});
const symbolBalance = computed(() => {
  const balance = walletStore.wallet.find((w) => w.symbol === symbol.value);

  return balance ? balance.balance : 0;
});

const hivePrice = computed(() => store.hivePrice);

const tokens = computed(() => tokenStore.tokens.map((t) => ({ text: t.symbol, value: t.symbol })));

const token = computed(() => marketStore.token);
const buyBook = computed(() =>
  marketStore.buyBookFormatted.map((b) => ({
    ...b,
    quantity: b.quantity.toFixed(token.value.precision),
  })),
);
const sellBook = computed(() =>
  marketStore.sellBookFormatted.map((b) => ({
    ...b,
    quantity: b.quantity.toFixed(token.value.precision),
  })),
);
const openOrders = computed(() => marketStore.openOrdersFormatted);
const tradesHistory = computed(() => marketStore.tradesHistoryFormatted);
const metrics = computed(() => marketStore.metrics);
const marketHistory = computed(() => marketStore.marketHistory);

const buyBookFields = [
  { key: 'hive_volume', label: 'Total HIVE', class: 'md:hidden lg:table-cell' },
  { key: 'total', label: 'HIVE' },
  { key: 'quantity', label: symbol.value },
  { key: 'price', label: 'BID' },
];

const sellBookFields = [
  { key: 'price', label: 'ASK' },
  { key: 'quantity', label: symbol.value },
  { key: 'total', label: 'HIVE' },
  { key: 'hive_volume', label: 'Total HIVE', class: 'md:hidden lg:table-cell' },
];

const openOrdersFields = [
  { key: 'checkbox', label: '' },
  { key: 'timestamp', label: 'DATE' },
  { key: 'type', label: 'TYPE' },
  { key: 'quantity', label: symbol.value },
  { key: 'price', label: 'PRICE' },
  { key: 'total', label: 'TOTAL HIVE' },
  { key: 'txId', label: 'Action' },
];

const tradesHistoryFields = [
  { key: 'timestamp', label: 'DATE' },
  { key: 'type', label: 'TYPE' },
  { key: 'buyer', label: 'BUYER', class: 'hidden sm:table-cell' },
  { key: 'seller', label: 'SELLER', class: 'hidden sm:table-cell' },
  { key: 'quantity', label: symbol.value },
  { key: 'price', label: 'PRICE' },
  { key: 'total', label: 'TOTAL HIVE' },
];

const disabledBuyButton = computed(() => {
  return buyQuantity.value <= 0 || Number(buyTotal.value) <= 0 || Number(buyTotal.value) > hiveBalance.value;
});

const disabledSellButton = computed(() => {
  return sellQuantity.value <= 0 || Number(sellTotal.value) <= 0 || sellQuantity.value > symbolBalance.value;
});

watch(isLoggedIn, async (loggedIn) => {
  if (loggedIn) {
    await Promise.all([
      marketStore.fetchUserOrders(symbol.value, username.value),
      walletStore.fetchWallet(username.value, ['SWAP.HIVE', symbol.value]),
    ]);
  }
});

watch(symbol, () => {
  router.push({ name: 'trade', params: { symbol: symbol.value } });
});

watch(buyPrice, () => {
  if (buyPrice.value > 0 && buyQuantity.value > 0 && buyOrderType.value !== 'market') {
    buyTotal.value = (buyQuantity.value * buyPrice.value).toFixed(8);
  }
});

watch(buyQuantity, () => {
  if (buyPrice.value > 0 && buyQuantity.value > 0 && buyOrderType.value !== 'market') {
    buyTotal.value = (buyQuantity.value * buyPrice.value).toFixed(8);
  }
});

watch(buyTotal, (value) => {
  let balance = value;
  let totalQuantity = 0;

  if (buyOrderType.value === 'market') {
    for (let i = 0; i < sellBook.value.length; i += 1) {
      let { quantity, price } = sellBook.value[i];

      quantity = Number(quantity);
      price = price.toNumber();

      const totalPrice = quantity * price;

      if (totalPrice > balance) {
        totalQuantity += balance / price;
        balance = 0;
      } else {
        totalQuantity += quantity;
        balance -= totalPrice;
      }
    }

    buyQuantity.value = totalQuantity.toFixed(8);
    buyPrice.value = toFixedWithoutRounding(buyTotal.value / buyQuantity.value, 8);
  }
});

watch(sellPrice, () => {
  if (sellPrice.value > 0 && sellQuantity.value > 0 && sellOrderType.value !== 'market') {
    sellTotal.value = (sellQuantity.value * sellPrice.value).toFixed(8);
  }
});

watch(sellQuantity, (value) => {
  if (sellPrice.value > 0 && sellQuantity.value > 0 && sellOrderType.value !== 'market') {
    sellTotal.value = (sellQuantity.value * sellPrice.value).toFixed(8);
  } else {
    let totalQuantity = value;
    let total = 0;

    for (let i = 0; i < buyBook.value.length; i += 1) {
      let { quantity, price } = buyBook.value[i];

      quantity = Number(quantity);
      price = price.toNumber();

      if (quantity < totalQuantity) {
        total += quantity * price;
        totalQuantity -= quantity;
      } else {
        total += totalQuantity * price;
        totalQuantity = 0;
      }
    }

    sellTotal.value = total.toFixed(8);
    sellPrice.value = toFixedWithoutRounding(sellTotal.value / sellQuantity.value, 8);
  }
});

watch(interval, async () => {
  await marketStore.fetchMarketHistory(symbol.value, interval.value);

  produceCandleChart();
  producevDepthChart();
  produceVolumeChart();
});

watch(visibility, (current) => {
  if (current === 'visible') {
    refresh.value = true;
  } else {
    refresh.value = false;
  }
});

const produceCandleChart = () => {
  const history = marketHistory.value.map((h) => ({
    x: new Date(h.timestamp * 1000).getTime(),
    o: Number(h.open),
    h: Number(h.high),
    l: Number(h.low),
    c: Number(h.close),
  }));

  candleChartData.value = {
    datasets: [
      {
        label: symbol,
        data: history,
        color: {
          up: '#01c075',
          down: '#d92f4d',
          unchanged: '#999',
        },
      },
    ],
  };
};

const producevDepthChart = () => {
  const buyOrderDataset = filterOutliers(buyBook.value.map((o) => o.volume));
  const sellOrderDataset = filterOutliers(sellBook.value.map((o) => o.volume));

  buyOrderDataset.reverse();

  const buyOrderLabels = [
    ...new Set(buyBook.value.filter((o) => buyOrderDataset.includes(o.volume)).map((o) => parseFloat(o.price))),
  ];

  const sellOrderLabels = [
    ...new Set(sellBook.value.filter((o) => sellOrderDataset.includes(o.volume)).map((o) => parseFloat(o.price))),
  ];

  buyOrderLabels.reverse();

  depthChartData.value = {
    labels: buyOrderLabels.concat(sellOrderLabels),
    datasets: [
      {
        label: 'Buy',
        borderColor: '#02c076',
        backgroundColor: '#02c076',
        fill: 'origin',
        pointRadius: 0,
        data: buyOrderDataset,
      },
      {
        label: 'Sell',
        borderColor: '#d9304e',
        backgroundColor: '#d9304e',
        fill: 'origin',
        pointRadius: 0,
        data: new Array(buyOrderDataset.length).fill(null).concat(sellOrderDataset),
      },
    ],
  };
};

const produceVolumeChart = () => {
  const history = marketHistory.value
    .slice()
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 60);

  history.reverse();

  volumeChartData.value = {
    labels: history.map((h) => format(new Date(h.timestamp * 1000), 'Pp')),
    datasets: [
      {
        label: 'SWAP.HIVE',
        backgroundColor: '#01c075',
        data: history.map((h) => Number(h.quoteVolume)),
      },
      {
        label: symbol,
        backgroundColor: '#d92f4d',
        data: history.map((h) => Number(h.baseVolume)),
      },
    ],
  };
};

const fetchTokenMarket = async () => {
  try {
    const requests = [
      marketStore.fetchOrders(symbol.value),
      marketStore.fetchMarketHistory(symbol.value, interval.value),
      marketStore.fetchToken(symbol.value),
      marketStore.fetchTokenMetrics(symbol.value),
      marketStore.fetchTradeHistory(symbol.value),
    ];

    if (tokens.value.length <= 0) {
      requests.push(tokenStore.fetchTokens());
    }

    if (isLoggedIn.value) {
      requests.push(marketStore.fetchUserOrders(symbol.value, username.value));
      requests.push(walletStore.fetchWallet(username.value, ['SWAP.HIVE', symbol.value]));
    }

    await Promise.all(requests);

    produceCandleChart();
    producevDepthChart();
    produceVolumeChart();
  } catch {
    //
  }
};

const refreshTokenMarket = async () => {
  if (refresh.value) {
    await fetchTokenMarket();
  }
};

const resetForm = () => {
  buyOrderType.value = 'limit';
  buyPrice.value = '';
  buyQuantity.value = '';
  buyTotal.value = '';

  sellOrderType.value = 'limit';
  sellPrice.value = '';
  sellQuantity.value = '';
  sellTotal.value = '';

  selectedOrders.value = [];
};

const onBroadcastSuccess = async ({ id, ntrx }) => {
  loading.value = true;

  await store.validateTransaction(ntrx > 1 ? `${id}-0` : id);
};

const onTransactionValidated = async () => {
  resetForm();

  await fetchTokenMarket();

  loading.value = false;
};

let refreshTimeout = null;

onBeforeMount(async () => {
  loading.value = true;

  await fetchTokenMarket();

  loading.value = false;
});

const openTokenInfoModal = async (token) => {
  const { open } = useModal({ component: TokenInfoModal, attrs: { token } });

  await open();
};

onMounted(() => {
  refreshTimeout = setInterval(refreshTokenMarket, 60 * 1000);

  emitter.on('broadcast-success', onBroadcastSuccess);

  emitter.on('transaction-validated', onTransactionValidated);
});

onBeforeUnmount(() => {
  clearInterval(refreshTimeout);

  emitter.off('broadcast-success', onBroadcastSuccess);
  emitter.off('transaction-validated', onTransactionValidated);
});
</script>
