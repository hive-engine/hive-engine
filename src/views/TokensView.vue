<template>
  <div class="page-header">
    <div class="w-full max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 text-gray-200">
      <div class="grid md:grid-cols-4 text-center md:text-left min-h-[160px] items-center">
        <div class="col-span-full md:col-span-3 mt-3">
          <h1 class="text-4xl uppercase">Tokens</h1>
        </div>

        <div class="col-span-full md:col-span-1 mt-3">
          <input
            v-model="filter"
            type="text"
            placeholder="Search tokens"
            class="w-full dark:bg-slate-600 border-gray-400 dark:border-gray-500 dark:placeholder-slate-300 rounded-md focus:ring-0"
          />
        </div>
      </div>
    </div>
  </div>

  <Loading v-if="loading" />

  <div v-else class="page-content">
    <custom-table :fields="fields" :items="tokens" :per-page="100">
      <template #cell(icon)="{ item }">
        <img :src="item.icon" class="w-6" />
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
          <button class="btn-sm mr-1" @click="vfm$.show('tokenInfoModal', item)">
            <information-circle-icon class="h-5 w-5" />
          </button>

          <router-link :to="{ name: 'trade', params: { symbol: item.symbol } }" class="btn-sm">
            <switch-horizontal-icon class="h-5 w-5" />
          </router-link>
        </div>
      </template>
    </custom-table>
  </div>

  <PageFooter />

  <TokenInfo />
</template>

<script>
import { computed, defineComponent, inject, onBeforeMount, ref } from "vue";
import { useTokenStore } from "../stores/token";
import { SwitchHorizontalIcon, InformationCircleIcon } from "@heroicons/vue/outline";
import { useStore } from "../stores";
import { addCommas } from "../utils";
import CustomTable from "../components/utilities/CustomTable.vue";
import TokenInfo from "../components/modals/TokenInfo.vue";
import PageFooter from "../components/PageFooter.vue";

export default defineComponent({
  name: "Tokens",

  components: {
    CustomTable,
    SwitchHorizontalIcon,
    InformationCircleIcon,
    TokenInfo,
    PageFooter,
  },

  setup() {
    const loading = ref(true);
    const filter = ref("");
    const toFixedWithoutRounding = inject("toFixedWithoutRounding");
    const vfm$ = inject("$vfm");

    const store = useStore();
    const tokenStore = useTokenStore();

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
      }, new Map())
    );

    const tokens = computed(() => {
      const regExp = new RegExp(filter.value, "i");

      return tokenStore.tokens
        .filter((t) => {
          if (filter.value !== "") {
            return regExp.test(t.symbol);
          }

          return true;
        })
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

    onBeforeMount(async () => {
      loading.value = true;

      try {
        await Promise.all([tokenStore.fetchTokens(), tokenStore.fetchMetrics()]);
      } catch {
        //
      }

      loading.value = false;
    });

    const fields = [
      { key: "icon", label: "" },
      { key: "symbol", label: "Token", sortable: true },
      { key: "name", label: "Name" },
      { key: "marketCap", label: "Market Cap", sortable: true },
      { key: "price", label: "Price", sortable: true },
      { key: "change", label: "% Change", sortable: true },
      { key: "volume", label: "24h Volume", sortable: true },
      { key: "circulatingSupply", label: "Supply", sortable: true },
      { key: "actions", label: "" },
    ];

    return {
      vfm$,
      loading,
      filter,
      fields,
      tokens,

      addCommas,
    };
  },
});
</script>
