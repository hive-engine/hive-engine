<template>
  <div class="page-header">
    <div class="w-full max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 text-gray-200">
      <div class="grid md:grid-cols-4 text-center md:text-left min-h-[160px] items-center">
        <div class="col-span-full md:col-span-3 mt-3">
          <h1 class="text-4xl uppercase">Market</h1>
          <p class="text-xl mt-3">Trade any Hive Engine token against HIVE on the internal DEX!</p>
        </div>
      </div>
    </div>
  </div>

  <Loading v-if="loading" />

  <div v-else class="page-content pt-5">
    <div
      class="flex flex-wrap items-center justify-center sm:justify-between mb-5 border-b border-gray-400 dark:border-gray-600 pb-5"
      v-if="metrics"
    >
      <div class="mb-3 pr-2 sm:basis-0 sm:flex-grow md:basis-12">
        <div class="flex items-center">
          <SearchSelect
            class="rounded-l-md"
            menu-class="rounded-md"
            v-model="symbol"
            :options="tokens"
          />

          <button
            class="self-stretch bg-white dark:bg-slate-600 border-gray-400 dark:border-gray-500 border border-l-0 rounded-r-md p-2 hover:text-red-400"
            @click="vfm$.show('tokenInfoModal', token)"
          >
            <information-circle-icon class="h-6 w-6" />
          </button>
        </div>
      </div>

      <div class="mb-3 px-2 text-sm basis-0 flex-grow">
        <div class="font-bold">Last Price</div>
        <div>{{ metrics.lastPrice }}</div>
        <div class="text-gray-500">${{ (metrics.lastPrice * hivePrice).toFixed(7) }}</div>
      </div>

      <div class="mb-3 px-2 text-sm basis-0 flex-grow">
        <div class="font-bold">
          24h
          <span
            :class="{
              'text-green-500': parseFloat(metrics.priceChangePercent) > 0,
              'text-red-500': parseFloat(metrics.priceChangePercent) < 0,
            }"
          >{{ metrics.priceChangePercent }}</span>
        </div>
        <div
          :class="{
            'text-green-500': parseFloat(metrics.priceChangePercent) > 0,
            'text-red-500': parseFloat(metrics.priceChangePercent) < 0,
          }"
        >{{ metrics.priceChangeHive }}</div>
        <div class="text-gray-500">${{ (metrics.priceChangeHive * hivePrice).toFixed(7) }}</div>
      </div>

      <div class="mb-3 px-2 text-sm basis-0 flex-grow">
        <div class="font-bold">Ask</div>
        <div>{{ metrics.lowestAsk }}</div>
        <div class="text-gray-500">${{ (metrics.lowestAsk * hivePrice).toFixed(7) }}</div>
      </div>

      <div class="mb-3 px-2 text-sm basis-0 flex-grow">
        <div class="font-bold">Bid</div>
        <div>{{ metrics.highestBid }}</div>
        <div class="text-gray-500">${{ (metrics.highestBid * hivePrice).toFixed(7) }}</div>
      </div>

      <div class="mb-3 pl-2 text-sm basis-0 flex-grow">
        <div class="font-bold">Volume</div>
        <div>{{ metrics.volume }}</div>
        <div class="text-gray-500">${{ (metrics.volume * hivePrice).toFixed(7) }}</div>
      </div>
    </div>

    <div class="mb-5">
      <div class="text-right">
        <button
          :disabled="interval === 'daily'"
          @click="interval = 'daily'"
          class="btn-sm px-4 py-1 rounded-l-md rounded-r-none"
        >Daily</button>

        <button
          :disabled="interval === 'hourly'"
          @click="interval = 'hourly'"
          class="btn-sm px-4 py-1 rounded-l-none rounded-r-md"
        >Hourly</button>
      </div>

      <CandleChart v-if="chartType === 'candle'" :chart-data="candleChartData" />
      <DepthChart v-else-if="chartType === 'depth'" :chart-data="depthChartData" />
      <VolumeChart v-else-if="chartType === 'volume'" :chart-data="volumeChartData" />
    </div>

    <div class="text-center mb-8">
      <button
        :disabled="chartType === 'candle'"
        @click="chartType = 'candle'"
        class="btn-sm px-4 py-1 rounded-l-md rounded-r-none"
      >Candle</button>

      <button
        :disabled="chartType === 'depth'"
        @click="chartType = 'depth'"
        class="btn-sm px-4 py-1 rounded-none"
      >Depth</button>

      <button
        :disabled="chartType === 'volume'"
        @click="chartType = 'volume'"
        class="btn-sm px-4 py-1 rounded-l-none rounded-r-md"
      >Volume</button>
    </div>

    <div v-if="isLoggedIn" class="grid md:grid-cols-2 gap-10">
      <div class="col-span-1">
        <div class="flex items-center justify-between">
          <h3 class="text-xl font-bold w-2/4">Buy {{ symbol }}</h3>

          <RadioGroup v-model="buyOrderType" class="flex items-center">
            <RadioGroupOption v-slot="{ checked }" value="limit">
              <span
                :class="[
                  checked ? 'bg-red-700 shadow-red-800 shadow-inner' : 'bg-red-600',
                  'cursor-pointer p-2 text-white font-bold rounded-l-md',
                ]"
              >Limit</span>
            </RadioGroupOption>

            <RadioGroupOption v-slot="{ checked }" value="market">
              <span
                :class="[
                  checked ? 'bg-red-700 shadow-red-800 shadow-inner' : 'bg-red-600',
                  'cursor-pointer p-2 text-white font-bold rounded-r-md',
                ]"
              >Market</span>
            </RadioGroupOption>
          </RadioGroup>
        </div>

        <div class="flex items-center mt-3">
          <label for="buyPrice" class="w-2/4 font-bold">Price</label>

          <div class="flex items-center w-full">
            <input
              id="buyPrice"
              type="number"
              class="w-full dark:bg-slate-600 dark:border-gray-500 rounded-l-md h-10 focus:ring-0 border-r-inherit border-gray-400"
              v-model="buyPrice"
            />
            <div
              class="bg-gray-200 dark:bg-slate-600 dark:border-gray-500 rounded-r-md h-10 p-2 border border-l-0 border-gray-400"
            >HIVE/{{ symbol }}</div>
          </div>
        </div>

        <div class="flex items-center mt-3">
          <label for="buyQuantity" class="w-2/4 font-bold">Quantity</label>

          <div class="flex items-center w-full">
            <input
              id="buyQuantity"
              type="number"
              class="w-full dark:bg-slate-600 dark:border-gray-500 rounded-l-md h-10 focus:ring-0 border-r-inherit border-gray-400 disabled:bg-[rgba(0,0,0,.05)]"
              v-model="buyQuantity"
              :disabled="buyOrderType === 'market'"
            />
            <div
              class="bg-gray-200 dark:bg-slate-600 dark:border-gray-500 rounded-r-md h-10 p-2 border border-l-0 border-gray-400"
            >{{ symbol }}</div>
          </div>
        </div>

        <div class="flex items-center mt-3">
          <label for="buyTotal" class="w-2/4 font-bold">Total</label>

          <div class="flex items-center w-full">
            <input
              id="buyTotal"
              type="number"
              class="w-full dark:bg-slate-600 dark:border-gray-500 rounded-l-md h-10 focus:ring-0 border-r-inherit border-gray-400 disabled:bg-[rgba(0,0,0,.05)]"
              v-model="buyTotal"
            />
            <div
              class="bg-gray-200 dark:bg-slate-600 dark:border-gray-500 rounded-r-md h-10 p-2 border border-l-0 border-gray-400"
            >HIVE</div>
          </div>
        </div>

        <div class="flex items-center justify-between mt-3">
          <div class="w-3/4">
            Balance:
            <a
              class="cursor-pointer"
              @click="buyQuantity = toFixedWithoutRounding(hiveBalance / buyPrice, token.precision)"
            >{{ hiveBalance }} HIVE</a>
          </div>

          <button
            :disabled="disabledBuyButton"
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
            class="btn"
          >Buy {{ symbol }}</button>
        </div>
      </div>

      <div class="col-span-1">
        <div class="flex items-center justify-between">
          <h3 class="text-xl font-bold w-2/4">Sell {{ symbol }}</h3>

          <RadioGroup v-model="sellOrderType" class="flex items-center">
            <RadioGroupOption v-slot="{ checked }" value="limit">
              <span
                :class="[
                  checked ? 'bg-red-700 shadow-red-800 shadow-inner' : 'bg-red-600',
                  'cursor-pointer p-2 text-white font-bold rounded-l-md',
                ]"
              >Limit</span>
            </RadioGroupOption>

            <RadioGroupOption v-slot="{ checked }" value="market">
              <span
                :class="[
                  checked ? 'bg-red-700 shadow-red-800 shadow-inner' : 'bg-red-600',
                  'cursor-pointer p-2 text-white font-bold rounded-r-md',
                ]"
              >Market</span>
            </RadioGroupOption>
          </RadioGroup>
        </div>

        <div class="flex items-center mt-3">
          <label for="sellPrice" class="w-2/4 font-bold">Price</label>

          <div class="flex items-center w-full">
            <input
              id="sellPrice"
              type="number"
              class="w-full h-10 dark:bg-slate-600 dark:border-gray-500 rounded-l-md focus:ring-0 border-r-inherit border-gray-400"
              v-model="sellPrice"
            />
            <div
              class="bg-gray-200 dark:bg-slate-600 dark:border-gray-500 rounded-r-md h-10 p-2 border border-l-0 border-gray-400"
            >HIVE/{{ symbol }}</div>
          </div>
        </div>

        <div class="flex items-center mt-3">
          <label for="sellQuantity" class="w-2/4 font-bold">Quantity</label>

          <div class="flex items-center w-full">
            <input
              id="sellQuantity"
              type="number"
              class="w-full h-10 dark:bg-slate-600 dark:border-gray-500 rounded-l-md focus:ring-0 border-r-inherit border-gray-400 disabled:bg-[rgba(0,0,0,.05)]"
              v-model="sellQuantity"
            />
            <div
              class="bg-gray-200 dark:bg-slate-600 dark:border-gray-500 rounded-r-md h-10 p-2 border border-l-0 border-gray-400"
            >{{ symbol }}</div>
          </div>
        </div>

        <div class="flex items-center mt-3">
          <label for="sellTotal" class="w-2/4 font-bold">Total</label>

          <div class="flex items-center w-full">
            <input
              id="sellTotal"
              type="number"
              class="w-full h-10 dark:bg-slate-600 dark:border-gray-500 rounded-l-md focus:ring-0 border-r-inherit border-gray-400 disabled:bg-[rgba(0,0,0,.05)]"
              v-model="sellTotal"
              :readonly="sellOrderType === 'limit'"
              :disabled="sellOrderType === 'market'"
            />
            <div
              class="bg-gray-200 dark:bg-slate-600 dark:border-gray-500 rounded-r-md h-10 p-2 border border-l-0 border-gray-400"
            >HIVE</div>
          </div>
        </div>

        <div class="flex items-center justify-between mt-3">
          <div class="w-3/4">
            Balance:
            <a
              class="cursor-pointer"
              @click="sellQuantity = symbolBalance"
            >{{ symbolBalance }} {{ symbol }}</a>
          </div>

          <button
            :disabled="disabledSellButton"
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
            class="btn"
          >Sell {{ symbol }}</button>
        </div>
      </div>
    </div>

    <div class="grid md:grid-cols-2 gap-10">
      <div class="col-span-1 mt-5">
        <h3 class="text-xl font-bold mb-3">Buy Orders</h3>

        <custom-table
          :fields="buyBookFields"
          :items="buyBook"
          th-class="md:text-right"
          td-class="md:text-right"
        >
          <template #cell(price)="{ item }">
            <a
              class="cursor-pointer"
              @click="sellPrice = item.price; buyPrice = item.price; sellQuantity = item.quantity; buyQuantity = item.quantity;"
            >{{ item.price.toFixed(8) }}</a>
          </template>
        </custom-table>
      </div>

      <div class="col-span-1 mt-5">
        <h3 class="text-xl font-bold mb-3">Sell Orders</h3>

        <custom-table
          :fields="sellBookFields"
          :items="sellBook"
          th-class="md:text-left"
          td-class="md:text-left"
        >
          <template #cell(price)="{ item }">
            <a
              class="cursor-pointer"
              @click="sellPrice = item.price; buyPrice = item.price; sellQuantity = item.quantity; buyQuantity = item.quantity;"
            >{{ item.price.toFixed(8) }}</a>
          </template>
        </custom-table>
      </div>
    </div>

    <template v-if="isLoggedIn">
      <div class="flex items-center">
        <h3 class="w-3/4 text-xl font-bold mt-5 mb-3">Open Orders</h3>

        <div class="w-full text-right" v-if="selectedOrders.length > 1">
          <button
            @click="marketStore.requestCancelOrders(selectedOrders)"
            class="btn-sm px-4"
          >Cancel All</button>
        </div>
      </div>

      <custom-table :fields="openOrdersFields" :items="openOrders">
        <template #cell(checkbox)="{ item }">
          <input type="checkbox" v-model="selectedOrders" :value="item" />
        </template>

        <template #cell(type)="{ item }">
          <span
            :class="{ 'text-red-500': item.type === 'SELL', 'text-green-500': item.type === 'BUY' }"
          >{{ item.type }}</span>
        </template>

        <template #cell(txId)="{ item }">
          <button @click="marketStore.requestCancelOrders([item])" class="btn-sm">
            <XIcon class="h-5 w-5" />
          </button>
        </template>
      </custom-table>
    </template>

    <h3 class="text-xl font-bold mt-5 mb-3">Trade History</h3>

    <custom-table :fields="tradesHistoryFields" :items="tradesHistory">
      <template #cell(type)="{ item }">
        <span
          :class="{ 'text-red-500': item.type === 'SELL', 'text-green-500': item.type === 'BUY' }"
        >{{ item.type }}</span>
      </template>
    </custom-table>
  </div>

  <PageFooter />
  <TokenInfo />
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
  watch,
} from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  RadioGroup,
  RadioGroupOption,
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from "@headlessui/vue";
import { InformationCircleIcon, XIcon } from "@heroicons/vue/outline";
import { format } from "date-fns";
import { useStore } from "../stores";
import { useUserStore } from "../stores/user";
import { useMarketStore } from "../stores/market";
import { useWalletStore } from "../stores/wallet";
import { useTokenStore } from "../stores/token";
import { filterOutliers } from "../utils";
import CustomTable from "../components/utilities/CustomTable.vue";
import SearchSelect from "../components/utilities/SearchSelect.vue";
import TokenInfo from "../components/modals/TokenInfo.vue";
import PageFooter from "../components/PageFooter.vue";
import CandleChart from "../components/charts/CandleChart.vue";
import DepthChart from "../components/charts/DepthChart.vue";
import VolumeChart from "../components/charts/VolumeChart.vue";

export default defineComponent({
  name: "Trade",

  components: {
    RadioGroup,
    RadioGroupOption,
    Listbox,
    ListboxButton,
    ListboxOptions,
    ListboxOption,
    InformationCircleIcon,
    XIcon,
    CustomTable,
    SearchSelect,
    PageFooter,
    CandleChart,
    DepthChart,
    VolumeChart,
    TokenInfo,
  },

  setup() {
    const loading = ref(true);
    const route = useRoute();
    const router = useRouter();
    const vfm$ = inject("$vfm");
    const event = inject("eventBus");

    const store = useStore();
    const userStore = useUserStore();
    const marketStore = useMarketStore();
    const walletStore = useWalletStore();
    const tokenStore = useTokenStore();

    const toFixedWithoutRounding = inject("toFixedWithoutRounding");

    const symbol = ref(route.params.symbol);

    const buyOrderType = ref("limit");
    const buyPrice = ref("");
    const buyQuantity = ref("");
    const buyTotal = ref("");

    const sellOrderType = ref("limit");
    const sellPrice = ref("");
    const sellQuantity = ref("");
    const sellTotal = ref("");

    const interval = ref("daily");
    const chartType = ref("candle");
    const selectedOrders = ref([]);

    const candleChartData = ref({});
    const depthChartData = ref({});
    const volumeChartData = ref({});

    const isLoggedIn = computed(() => userStore.isLoggedIn);
    const username = computed(() => userStore.username);
    const hiveBalance = computed(() => {
      const balance = walletStore.wallet.find((w) => w.symbol === "SWAP.HIVE");

      return balance ? balance.balance : 0;
    });
    const symbolBalance = computed(() => {
      const balance = walletStore.wallet.find((w) => w.symbol === symbol.value);

      return balance ? balance.balance : 0;
    });

    const hivePrice = computed(() => store.hivePrice);

    const tokens = computed(() =>
      tokenStore.tokens.map((t) => ({ text: t.symbol, value: t.symbol }))
    );

    const buyBook = computed(() => marketStore.buyBookFormatted.slice(0, 15));
    const sellBook = computed(() => marketStore.sellBookFormatted.slice(0, 15));
    const openOrders = computed(() => marketStore.openOrdersFormatted);
    const tradesHistory = computed(() => marketStore.tradesHistoryFormatted);
    const token = computed(() => marketStore.token);
    const metrics = computed(() => marketStore.metrics);
    const marketHistory = computed(() => marketStore.marketHistory);

    const buyBookFields = [
      { key: "hive_volume", label: "Total HIVE", class: "md:hidden lg:table-cell" },
      { key: "total", label: "HIVE" },
      { key: "quantity", label: symbol.value },
      { key: "price", label: "BID" },
    ];

    const sellBookFields = [
      { key: "price", label: "ASK" },
      { key: "quantity", label: symbol.value },
      { key: "total", label: "HIVE" },
      { key: "hive_volume", label: "Total HIVE", class: "md:hidden lg:table-cell" },
    ];

    const openOrdersFields = [
      { key: "checkbox", label: "" },
      { key: "timestamp", label: "DATE" },
      { key: "type", label: "TYPE" },
      { key: "quantity", label: symbol.value },
      { key: "price", label: "PRICE" },
      { key: "total", label: "TOTAL HIVE" },
      { key: "txId", label: "Action" },
    ];

    const tradesHistoryFields = [
      { key: "timestamp", label: "DATE" },
      { key: "type", label: "TYPE" },
      { key: "buyer", label: "BUYER", class: "hidden sm:table-cell" },
      { key: "seller", label: "SELLER", class: "hidden sm:table-cell" },
      { key: "quantity", label: symbol.value },
      { key: "price", label: "PRICE" },
      { key: "total", label: "TOTAL HIVE" },
    ];

    const disabledBuyButton = computed(() => {
      return buyQuantity.value <= 0 || buyTotal.value <= 0 || buyTotal.value > hiveBalance.value;
    });

    const disabledSellButton = computed(() => {
      return (
        sellQuantity.value <= 0 || sellTotal.value <= 0 || sellQuantity.value > symbolBalance.value
      );
    });

    watch(isLoggedIn, async (loggedIn) => {
      if (loggedIn) {
        await Promise.all([
          marketStore.fetchUserOrders(symbol.value, username.value),
          walletStore.fetchWallet(username.value, ["SWAP.HIVE", symbol.value]),
        ]);
      }
    });

    watch(symbol, () => {
      router.push({ name: "trade", params: { symbol: symbol.value } });
    });

    watch(buyPrice, () => {
      if (buyPrice.value > 0 && buyQuantity.value > 0 && buyOrderType.value !== "market") {
        buyTotal.value = (buyQuantity.value * buyPrice.value).toFixed(8);
      }
    });

    watch(buyQuantity, () => {
      if (buyPrice.value > 0 && buyQuantity.value > 0 && buyOrderType.value !== "market") {
        buyTotal.value = (buyQuantity.value * buyPrice.value).toFixed(8);
      }
    });

    watch(buyTotal, (value) => {
      let balance = value;
      let totalQuantity = 0;

      if (buyOrderType.value === "market") {
        for (let i = 0; i < sellBook.value.length; i += 1) {
          const { quantity, price } = sellBook.value[i];

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
      if (sellPrice.value > 0 && sellQuantity.value > 0 && sellOrderType.value !== "market") {
        sellTotal.value = (sellQuantity.value * sellPrice.value).toFixed(8);
      }
    });

    watch(sellQuantity, (value) => {
      if (sellPrice.value > 0 && sellQuantity.value > 0 && sellOrderType.value !== "market") {
        sellTotal.value = (sellQuantity.value * sellPrice.value).toFixed(8);
      } else {
        let totalQuantity = value;
        let total = 0;

        for (let i = 0; i < buyBook.value.length; i += 1) {
          const { quantity, price } = buyBook.value[i];

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
              up: "#01c075",
              down: "#d92f4d",
              unchanged: "#999",
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
        ...new Set(
          buyBook.value
            .filter((o) => buyOrderDataset.includes(o.volume))
            .map((o) => parseFloat(o.price))
        ),
      ];

      const sellOrderLabels = [
        ...new Set(
          sellBook.value
            .filter((o) => sellOrderDataset.includes(o.volume))
            .map((o) => parseFloat(o.price))
        ),
      ];

      buyOrderLabels.reverse();

      depthChartData.value = {
        labels: buyOrderLabels.concat(sellOrderLabels),
        datasets: [
          {
            label: "Buy",
            borderColor: "#02c076",
            backgroundColor: "#02c076",
            fill: "origin",
            pointRadius: 0,
            data: buyOrderDataset,
          },
          {
            label: "Sell",
            borderColor: "#d9304e",
            backgroundColor: "#d9304e",
            fill: "origin",
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
        labels: history.map((h) => format(new Date(h.timestamp * 1000), "Pp")),
        datasets: [
          {
            label: "SWAP.HIVE",
            backgroundColor: "#01c075",
            data: history.map((h) => Number(h.quoteVolume)),
          },
          {
            label: symbol,
            backgroundColor: "#d92f4d",
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
          requests.push(walletStore.fetchWallet(username.value, ["SWAP.HIVE", symbol.value]));
        }

        await Promise.all(requests);

        produceCandleChart();
        producevDepthChart();
        produceVolumeChart();
      } catch {
        //
      }
    };

    const resetForm = () => {
      buyOrderType.value = "limit";
      buyPrice.value = "";
      buyQuantity.value = "";
      buyTotal.value = "";

      sellOrderType.value = "limit";
      sellPrice.value = "";
      sellQuantity.value = "";
      sellTotal.value = "";

      selectedOrders.value = [];
    };

    const onBroadcastSuccess = async ({ id, ntrx }) => {
      loading.value = true;

      await store.validateTransaction(ntrx > 1 ? `${id}-0` : id);
    }

    const onTransactionValidated = async () => {
      resetForm();

      await fetchTokenMarket();

      loading.value = false;
    }

    let refreshTimeout = null;

    onBeforeMount(async () => {
      loading.value = true;

      await fetchTokenMarket();

      loading.value = false;
    });

    onMounted(() => {
      refreshTimeout = setInterval(fetchTokenMarket, 30 * 1000);

      event.on("broadcast-success", onBroadcastSuccess);

      event.on("transaction-validated", onTransactionValidated);
    })

    onBeforeUnmount(() => {
      clearInterval(refreshTimeout);

      event.off("broadcast-success", onBroadcastSuccess);
      event.off("transaction-validated", onTransactionValidated);
    });

    return {
      loading,
      symbol,
      tokens,
      vfm$,
      isLoggedIn,
      interval,

      marketStore,

      hiveBalance,
      symbolBalance,

      buyOrderType,
      sellOrderType,

      buyPrice,
      buyQuantity,
      buyTotal,

      sellPrice,
      sellQuantity,
      sellTotal,

      buyBookFields,
      buyBook,
      sellBookFields,
      sellBook,

      openOrders,
      openOrdersFields,

      tradesHistory,
      tradesHistoryFields,

      hivePrice,
      token,
      metrics,

      selectedOrders,

      disabledBuyButton,
      disabledSellButton,

      chartType,
      candleChartData,
      depthChartData,
      volumeChartData,

      toFixedWithoutRounding,
    };
  },
});
</script>
