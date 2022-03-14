<template>
  <div class="page-header">
    <div class="w-full max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 text-gray-200">
      <div class="grid md:grid-cols-4 text-center md:text-left min-h-[160px] items-center">
        <div class="col-span-full md:col-span-3">
          <h1 class="text-4xl uppercase">{{ disableActions ? `@${account}'s` : 'My' }} Token Wallet</h1>

          <div
            v-if="!loading"
            class="text-lg"
          >Estimated value: ${{ estimatedValue.toLocaleString() }} USD</div>
        </div>

        <div class="col-span-full md:col-span-1">
          <button
            :disabled="disableActions"
            class="btn mr-3 mt-3"
            @click="vfm$.show('depositModal')"
          >Deposit</button>

          <button
            :disabled="disableActions"
            class="btn mt-3"
            @click="vfm$.show('withdrawModal')"
          >Withdraw</button>
        </div>
      </div>
    </div>
  </div>

  <Loading v-if="loading" />

  <div v-else class="page-content">
    <div
      class="flex flex-wrap items-center text-center sm:text-left justify-center sm:justify-between"
    >
      <div class="mb-5">
        <input
          v-model="filter"
          type="text"
          placeholder="Search tokens"
          class="w-full dark:bg-slate-600 border-gray-400 dark:border-gray-500 dark:placeholder-slate-300 rounded-md focus:ring-0"
        />
      </div>

      <div>
        <label class="mb-1 block">
          <input type="checkbox" v-model="hiveZeroBalance" /> Hide small balances
        </label>

        <label class="mb-3 block">
          <input type="checkbox" v-model="includeAll" /> Value includes stake and delegated
        </label>
      </div>
    </div>

    <CustomTable :fields="walletTableFields" :items="wallet" :per-page="50">
      <template #cell(icon)="{ item }">
        <img :src="item.icon" class="w-6" />
      </template>

      <template #cell(usdValue)="{ item }">{{ item.usdValue.toLocaleString() }}</template>

      <template #cell(changePct)="{ item }">
        <span
          :class="{ 'text-red-500': item.changePct < 0, 'text-green-500': item.changePct > 0 }"
        >{{ item.changePct.toFixed(2) }}%</span>
      </template>

      <template #cell(stake)="{ item }">
        <span
          v-if="item.stakingEnabled"
          v-tooltip="{
            content: `Available: ${item.availableStake}<br>Locked: ${item.lockedStake}<br>Pending: ${item.pendingUnstake}`,
            html: true,
          }"
        >{{ item.stake }}</span>

        <span v-else>--</span>
      </template>

      <template #cell(delegation)="{ item }">
        <span
          v-if="item.delegationEnabled"
          v-tooltip="{
            content: `In: ${item.delegationsIn}<br>Out: ${item.delegationsOut}<br>Pending: ${item.pendingUndelegations}`,
            html: true,
          }"
        >{{ item.delegationsIn + item.delegationsOut + item.pendingUndelegations }}</span>

        <span v-else>--</span>
      </template>

      <template #cell(actions)="{ item }" v-if="!disableActions">
        <button
          class="btn-sm mr-1 mt-1 mb-1"
          title="Transfer"
          @click="
            vfm$.show('walletActionModal', {
              action: 'transfer',
              symbol: item.symbol,
              available: item.balance,
            })
          "
        >
          <arrow-right-icon class="h-5 w-5" />
        </button>

        <button
          v-if="item.stakingEnabled && item.balance > 0"
          class="btn-sm mr-1 mt-1 mb-1"
          title="Stake"
          @click="
            vfm$.show('walletActionModal', {
              action: 'stake',
              symbol: item.symbol,
              available: item.balance,
            })
          "
        >
          <lock-closed-icon class="h-5 w-5" />
        </button>

        <button
          v-if="item.availableStake > 0"
          class="btn-sm mr-1 mt-1 mb-1"
          title="Unstake"
          @click="
            vfm$.show('walletActionModal', {
              action: 'unstake',
              symbol: item.symbol,
              available: item.availableStake,
            })
          "
        >
          <lock-open-icon class="h-5 w-5" />
        </button>

        <button
          v-if="item.delegationEnabled && item.availableStake > 0"
          class="btn-sm mr-1 mt-1 mb-1"
          title="Delegate"
          @click="
            vfm$.show('walletActionModal', {
              action: 'delegate',
              symbol: item.symbol,
              available: item.availableStake,
            })
          "
        >
          <trending-up-icon class="h-5 w-5" />
        </button>

        <button
          v-if="item.delegationsOut > 0"
          class="btn-sm mr-1 mt-1 mb-1"
          title="Undelegate"
          @click="
            vfm$.show('walletActionModal', {
              action: 'undelegate',
              symbol: item.symbol,
              available: item.delegationsOut,
            })
          "
        >
          <trending-down-icon class="h-5 w-5" />
        </button>

        <router-link
          v-if="item.symbol !== 'SWAP.HIVE'"
          :to="{ name: 'trade', params: { symbol: item.symbol } }"
          class="btn-sm mr-1 mt-1 mb-1"
          title="Trade"
        >
          <switch-horizontal-icon class="h-5 w-5" />
        </router-link>

        <button
          v-if="item.pendingUnstake > 0"
          class="btn-sm mr-1 mt-1 mb-1"
          title="Pending Unstakes"
          @click="
            vfm$.show('walletActionModal', {
              action: 'pendingUnstakes',
              symbol: item.symbol,
              available: item.pendingUnstake,
            })
          "
        >
          <lightning-bolt-icon class="h-5 w-5" />
        </button>

        <router-link
          :to="{ name: 'history', params: { symbol: item.symbol } }"
          class="btn-sm mr-1 mt-1 mb-1"
          title="History"
        >
          <menu-alt1-icon class="h-5 w-5" />
        </router-link>
      </template>
    </CustomTable>
  </div>

  <PageFooter />

  <WalletAction />
  <Deposit />
  <Withdraw />
</template>

<script>
import {
  computed,
  defineComponent,
  inject,
  onBeforeMount,
  ref,
  onMounted,
  onBeforeUnmount,
} from "vue";
import {
  LightningBoltIcon,
  LockClosedIcon,
  LockOpenIcon,
  ArrowRightIcon,
  MenuAlt1Icon,
  TrendingUpIcon,
  TrendingDownIcon,
  SwitchHorizontalIcon,
} from "@heroicons/vue/outline";
import { useStorage } from '@vueuse/core'
import { useStore } from "../stores";
import { useTokenStore } from "../stores/token";
import { useWalletStore } from "../stores/wallet";
import { useUserStore } from "../stores/user";
import { toFixedWithoutRounding } from "../utils";
import CustomTable from "../components/utilities/CustomTable.vue";
import WalletAction from "../components/modals/WalletAction.vue";
import Deposit from "../components/modals/Deposit.vue";
import Withdraw from "../components/modals/Withdraw.vue";
import PageFooter from "../components/PageFooter.vue";
import { useRoute } from "vue-router";

export default defineComponent({
  name: "Wallet",

  components: {
    CustomTable,
    LightningBoltIcon,
    LockOpenIcon,
    LockClosedIcon,
    ArrowRightIcon,
    MenuAlt1Icon,
    TrendingUpIcon,
    TrendingDownIcon,
    SwitchHorizontalIcon,
    WalletAction,
    Deposit,
    Withdraw,
    PageFooter,
  },

  setup() {
    const loading = ref(true);
    const vfm$ = inject("$vfm");
    const event = inject("eventBus");

    const route = useRoute()

    const { account } = route.params

    const filter = ref("");
    const hiveZeroBalance = useStorage('hide-small-balances', false);
    const includeAll = useStorage('value-includes-all', false);

    let refreshTimeout = null;

    const store = useStore();
    const tokenStore = useTokenStore();
    const userStore = useUserStore();
    const walletStore = useWalletStore();

    const disableActions = computed(() => !userStore.isLoggedIn || userStore.username !== account)

    const mappedTokens = computed(() => new Map(tokenStore.tokens.map((t) => [t.symbol, t])));
    const mappedMetrics = computed(() => new Map(tokenStore.metrics.map((t) => [t.symbol, t])));
    const lockedStakes = computed(() => {
      return walletStore.pendingUnstakes
        .filter((p) => p.numberTransactionsLeft > 1)
        .reduce((acc, cur) => {
          const token = mappedTokens.value.get(cur.symbol);

          if (token) {
            if (!acc[cur.symbol]) {
              acc[cur.symbol] = 0;
            }

            acc[cur.symbol] += toFixedWithoutRounding(
              Number(cur.quantityLeft) - Number(Number(cur.quantity) / token.numberTransactions),
              token.precision
            );
          }

          return acc;
        }, {});
    });

    const hivePrice = computed(() => store.hivePrice);

    const wallet = computed(() => {
      const regExp = new RegExp(filter.value, "i");

      return walletStore.wallet
        .filter((t) => {
          if (filter.value !== "") {
            return regExp.test(t.symbol);
          }

          return true;
        })
        .map((b) => {
          const token = mappedTokens.value.get(b.symbol);
          const metrics = mappedMetrics.value.get(b.symbol);

          const delegationsIn =
            b.delegationsIn && Number(b.delegationsIn) > 0 ? Number(b.delegationsIn) : 0;

          const delegationsOut =
            b.delegationsOut && Number(b.delegationsOut) > 0 ? Number(b.delegationsOut) : 0;

          const stake = b.stake && Number(b.stake) > 0 ? Number(b.stake) : 0;
          const pendingUnstake = Number(b.pendingUnstake);
          const lockedStake = lockedStakes.value[b.symbol] || 0;
          const availableStake = toFixedWithoutRounding(Math.max(0, stake - lockedStake), token.precision);
          const changePct = metrics ? parseFloat(metrics.priceChangePercent) : 0;

          const balance = b.balance;

          const stakesAndDelegated = delegationsOut + stake + (pendingUnstake - lockedStake)

          const valueHive = metrics
            ? (balance + (includeAll.value ? stakesAndDelegated : 0)) * metrics.lastPrice
            : balance + (includeAll.value ? stakesAndDelegated : 0);

          const valueUSD = toFixedWithoutRounding(valueHive * hivePrice.value);

          return {
            icon: token.icon,
            symbol: b.symbol,
            name: token.name,
            balance,
            delegationsIn,
            delegationsOut,
            pendingUndelegations: Number(b.pendingUndelegations),
            stake,
            lockedStake,
            availableStake,
            pendingUnstake,
            stakingEnabled: token.stakingEnabled,
            delegationEnabled: token.delegationEnabled,
            usdValue: valueUSD,
            changePct,
          };
        })
        .filter((b) => {
          if (hiveZeroBalance.value) {
            return b.usdValue > 0;
          }

          return true;
        })
        .sort((a, b) => b.usdValue - a.usdValue);
    });

    const estimatedValue = computed(() => {
      return toFixedWithoutRounding(wallet.value.reduce((acc, cur) => acc + cur.usdValue, 0));
    });

    const walletTableFields = [
      { key: "icon", label: "" },
      { key: "symbol", label: "Symbol", sortable: true },
      { key: "balance", label: "Balance", sortable: true },
      { key: "usdValue", label: "USD Value", sortable: true },
      { key: "changePct", label: "% Change", sortable: true },
      { key: "stake", label: "Stake" },
      { key: "delegation", label: "Delegation" },
      { key: "actions", label: "" },
    ];

    const fetchWallet = async () => {
      await Promise.all([
        walletStore.fetchWallet(account),
        walletStore.fetchPendingUnstakes(),
        tokenStore.fetchTokens(),
        tokenStore.fetchMetrics(),
      ]);
    };

    onBeforeMount(async () => {
      loading.value = true;

      await fetchWallet();

      loading.value = false;
    });

    onMounted(async () => {
      refreshTimeout = setInterval(fetchWallet, 60 * 1000);

      event.on("broadcast-success", async ({ id, ntrx }) => {
        loading.value = true;

        await vfm$.hideAll();

        await store.validateTransaction(ntrx > 1 ? `${id}-0` : id);
      });

      event.on("transaction-validated", async () => {
        await fetchWallet();

        loading.value = false;
      });
    });

    onBeforeUnmount(() => {
      clearInterval(refreshTimeout);

      event.off("broadcast-success");
      event.off("transaction-validated");
    });

    return {
      loading,
      vfm$,
      account,
      disableActions,

      filter,
      hiveZeroBalance,
      includeAll,

      walletTableFields,
      wallet,
      estimatedValue,
    };
  },
});
</script>
