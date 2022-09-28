<template>
  <div class="page-header">
    <div class="w-full max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 text-gray-200">
      <div class="grid md:grid-cols-4 text-center md:text-left min-h-[160px] items-center">
        <div class="col-span-full md:col-span-3">
          <h1 class="text-4xl uppercase">{{ disableActions ? `@${account}'s` : 'My' }} Token Wallet</h1>

          <div v-if="!loading" class="text-lg">Estimated value: ${{ estimatedValue.toLocaleString() }} USD</div>
        </div>

        <div class="col-span-full md:col-span-1">
          <button :disabled="disableActions" class="btn mr-3 mt-3" @click="vfm$.show('depositModal')">Deposit</button>

          <button :disabled="disableActions" class="btn mt-3" @click="vfm$.show('withdrawModal')">Withdraw</button>
        </div>
      </div>
    </div>
  </div>

  <Loading v-if="loading" />

  <div v-else class="page-content">
    <div class="flex flex-wrap items-center text-center sm:text-left justify-center sm:justify-between">
      <div class="mb-5">
        <input
          v-model="filter"
          type="text"
          placeholder="Search tokens"
          class="w-full dark:bg-slate-600 border-gray-400 dark:border-gray-500 dark:placeholder-slate-300 rounded-md focus:ring-0"
        />
      </div>

      <div>
        <label class="mb-1 block"> <input v-model="hiveZeroBalance" type="checkbox" /> Hide small balances </label>

        <label class="mb-3 block">
          <input v-model="includeAll" type="checkbox" /> Value includes stake and delegated
        </label>
      </div>
    </div>

    <CustomTable :fields="walletTableFields" :items="wallet" :per-page="50">
      <template #cell(icon)="{ item }">
        <img :src="item.icon" class="w-6" />
      </template>

      <template #cell(balance)="{ item }">{{ addCommas(item.balance) }}</template>

      <template #cell(usdValue)="{ item }">${{ addCommas(item.usdValue, true) }}</template>

      <template #cell(changePct)="{ item }">
        <span :class="{ 'text-red-500': item.changePct < 0, 'text-green-500': item.changePct > 0 }"
          >{{ item.changePct.toFixed(2) }}%</span
        >
      </template>

      <template #cell(stake)="{ item }">
        <span
          v-if="item.stakingEnabled"
          v-tooltip="{
            content: `Available: ${item.availableStake}<br>Locked: ${item.lockedStake}<br>Pending: ${item.pendingUnstake}`,
            html: true,
          }"
          >{{ addCommas(item.stake) }}</span
        >

        <span v-else>--</span>
      </template>

      <template #cell(delegation)="{ item }">
        <span
          v-if="item.delegationEnabled"
          v-tooltip="{
            content: `In: ${item.delegationsIn}<br>Out: ${item.delegationsOut}<br>Pending: ${item.pendingUndelegations}`,
            html: true,
          }"
          >{{ item.delegationsIn.plus(item.delegationsOut).plus(item.pendingUndelegations) }}</span
        >

        <span v-else>--</span>
      </template>

      <template v-if="!disableActions" #cell(actions)="{ item }">
        <button class="btn-sm mr-1 mt-1 mb-1" title="Transfer" @click="vfm$.show('tokenInfoModal', item.token)">
          <InformationCircleIcon class="h-5 w-5" />
        </button>

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
          <ArrowRightIcon class="h-5 w-5" />
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
          <LockClosedIcon class="h-5 w-5" />
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
          <LockOpenIcon class="h-5 w-5" />
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
          <ArrowTrendingUpIcon class="h-5 w-5" />
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
          <ArrowTrendingDownIcon class="h-5 w-5" />
        </button>

        <router-link
          v-if="item.symbol !== 'SWAP.HIVE'"
          :to="{ name: 'trade', params: { symbol: item.symbol } }"
          class="btn-sm mr-1 mt-1 mb-1"
          title="Trade"
        >
          <ArrowsRightLeftIcon class="h-5 w-5" />
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
          <BoltIcon class="h-5 w-5" />
        </button>

        <router-link
          :to="{ name: 'history', params: { symbol: item.symbol } }"
          class="btn-sm mr-1 mt-1 mb-1"
          title="History"
        >
          <Bars3CenterLeftIcon class="h-5 w-5" />
        </router-link>
      </template>
    </CustomTable>
  </div>

  <PageFooter />

  <WalletAction />
  <Deposit />
  <Withdraw />
  <TokenInfo />
</template>

<script setup>
import {
  ArrowRightIcon,
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  ArrowsRightLeftIcon,
  Bars3CenterLeftIcon,
  BoltIcon,
  InformationCircleIcon,
  LockClosedIcon,
  LockOpenIcon,
} from '@heroicons/vue/24/outline';
import { useStorage } from '@vueuse/core';
import Big from 'big.js';
import { computed, inject, onBeforeMount, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import Deposit from '../components/modals/Deposit.vue';
import TokenInfo from '../components/modals/TokenInfo.vue';
import WalletAction from '../components/modals/WalletAction.vue';
import Withdraw from '../components/modals/Withdraw.vue';
import PageFooter from '../components/PageFooter.vue';
import CustomTable from '../components/utilities/CustomTable.vue';
import { useStore } from '../stores';
import { useTokenStore } from '../stores/token';
import { useUserStore } from '../stores/user';
import { useWalletStore } from '../stores/wallet';
import { addCommas, toFixedNoRounding, toFixedWithoutRounding } from '../utils';

const loading = ref(true);
const vfm$ = inject('$vfm');
const event = inject('eventBus');

const route = useRoute();

const { account } = route.params;

const filter = ref('');
const hiveZeroBalance = useStorage('hide-small-balances', false);
const includeAll = useStorage('value-includes-all', false);

let refreshTimeout = null;

const store = useStore();
const tokenStore = useTokenStore();
const userStore = useUserStore();
const walletStore = useWalletStore();

const disableActions = computed(() => !userStore.isLoggedIn || userStore.username !== account);

const mappedTokens = computed(() => new Map(tokenStore.tokens.map((t) => [t.symbol, t])));
const mappedMetrics = computed(() => new Map(tokenStore.metrics.map((t) => [t.symbol, t])));
const lockedStakes = computed(() => {
  return walletStore.pendingUnstakes
    .filter((p) => p.numberTransactionsLeft > 1)
    .reduce((acc, cur) => {
      const token = mappedTokens.value.get(cur.symbol);

      if (token) {
        if (!acc[cur.symbol]) {
          acc[cur.symbol] = Big(0);
        }

        acc[cur.symbol] = acc[cur.symbol].plus(
          cur.quantityLeft.minus(
            toFixedNoRounding(cur.quantity.div(token.numberTransactions).toString(), token.precision),
          ),
        );
      }

      return acc;
    }, {});
});

const hivePrice = computed(() => store.hivePrice);

const wallet = computed(() => {
  const regExp = new RegExp(filter.value, 'i');

  return walletStore.wallet
    .filter((t) => {
      if (filter.value !== '') {
        return regExp.test(t.symbol);
      }

      return true;
    })
    .map((b) => {
      const token = mappedTokens.value.get(b.symbol);
      const metrics = mappedMetrics.value.get(b.symbol);

      const lockedStake = lockedStakes.value[b.symbol]
        ? lockedStakes.value[b.symbol].toFixed(token.precision, Big.roundHalfUp)
        : 0;
      const availableStake = b.stake.minus(lockedStake).toFixed(token.precision);
      const changePct = metrics ? parseFloat(metrics.priceChangePercent) : 0;

      const balance = b.balance;

      const stakesAndDelegated = b.delegationsOut.plus(b.stake).plus(b.pendingUnstake.minus(lockedStake));

      const valueHive = metrics
        ? balance.plus(includeAll.value ? stakesAndDelegated : 0).times(metrics.lastPrice)
        : balance.plus(includeAll.value ? stakesAndDelegated : 0);

      const valueUSD = toFixedWithoutRounding(valueHive * hivePrice.value);

      return {
        ...b,
        token,
        icon: token.icon,
        symbol: b.symbol,
        name: token.name,
        balance,
        pendingUndelegations: Number(b.pendingUndelegations),
        lockedStake,
        availableStake,
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
  { key: 'icon', label: '' },
  { key: 'symbol', label: 'Symbol', sortable: true },
  { key: 'balance', label: 'Balance', sortable: true },
  { key: 'usdValue', label: 'USD Value', sortable: true },
  { key: 'changePct', label: '% Change', sortable: true },
  { key: 'stake', label: 'Stake' },
  { key: 'delegation', label: 'Delegation' },
  { key: 'actions', label: '' },
];

const fetchWallet = async () => {
  try {
    await Promise.all([
      walletStore.fetchWallet(account),
      walletStore.fetchPendingUnstakes(),
      tokenStore.fetchTokens(),
      tokenStore.fetchMetrics(),
    ]);
  } catch {
    //
  }
};

const onBoardcastSuccess = async ({ id, ntrx }) => {
  loading.value = true;

  await vfm$.hideAll();

  await store.validateTransaction(ntrx > 1 ? `${id}-0` : id);
};

const onTransactionValidated = async () => {
  await fetchWallet();

  loading.value = false;
};

onBeforeMount(async () => {
  loading.value = true;

  await fetchWallet();

  loading.value = false;
});

onMounted(async () => {
  refreshTimeout = setInterval(fetchWallet, 3 * 60 * 1000);

  event.on('broadcast-success', onBoardcastSuccess);
  event.on('transaction-validated', onTransactionValidated);
});

onBeforeUnmount(() => {
  clearInterval(refreshTimeout);

  event.off('broadcast-success', onBoardcastSuccess);
  event.off('transaction-validated', onTransactionValidated);
});
</script>
