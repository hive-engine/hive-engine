<template>
  <div class="page-header">
    <div class="mx-auto w-full max-w-7xl px-2 text-gray-200 sm:px-6 lg:px-8">
      <div class="grid min-h-[160px] items-center text-center md:grid-cols-4 md:text-left">
        <div class="col-span-full md:col-span-3">
          <h1 class="text-4xl uppercase">{{ disableActions ? `@${account}'s` : 'My' }} Token Wallet</h1>

          <div v-if="!loading" class="text-lg">Estimated value: ${{ estimatedValue.toLocaleString() }} USD</div>
        </div>

        <div class="col-span-full md:col-span-1">
          <button :disabled="disableActions" class="btn mr-3 mt-3" @click="openDepositModal">Deposit</button>

          <button :disabled="disableActions" class="btn mt-3" @click="openWithdrawModal">Withdraw</button>
        </div>
      </div>
    </div>
  </div>

  <Loading v-if="loading" />

  <div v-else class="page-content">
    <div v-if="haveDelistedTokens.length > 0" class="alert-warning">
      <p class="mb-2">
        You have the following token(s) that are going to be delisted or is delisted. Click the token(s) to read more.
      </p>
      <a
        v-for="delisted of haveDelistedTokens"
        :key="delisted.id"
        class="block"
        href="#"
        @click.prevent="openAnnouncementModal(delisted.symbol)"
        >{{ delisted.symbol }}</a
      >
    </div>

    <div class="flex flex-wrap items-center justify-center text-center sm:justify-between sm:text-left">
      <div class="mb-5">
        <input
          v-model="filter"
          type="text"
          placeholder="Search tokens"
          @input="(event) => (filter = event.target.value.toUpperCase())"
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
        <button class="btn-sm mb-1 mr-1 mt-1" title="Transfer" @click="openTokenInfoModal(item.token)">
          <InformationCircleIcon class="h-5 w-5" />
        </button>

        <button
          class="btn-sm mb-1 mr-1 mt-1"
          title="Transfer"
          @click="
            openWalletActionModal({
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
          class="btn-sm mb-1 mr-1 mt-1"
          title="Stake"
          @click="
            openWalletActionModal({
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
          class="btn-sm mb-1 mr-1 mt-1"
          title="Unstake"
          @click="
            openWalletActionModal({
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
          class="btn-sm mb-1 mr-1 mt-1"
          title="Delegate"
          @click="
            openWalletActionModal({
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
          class="btn-sm mb-1 mr-1 mt-1"
          title="Undelegate"
          @click="
            openWalletActionModal({
              action: 'undelegate',
              symbol: item.symbol,
              available: item.delegationsOut,
            })
          "
        >
          <ArrowTrendingDownIcon class="h-5 w-5" />
        </button>

        <router-link
          v-if="item.symbol !== 'SWAP.HIVE' && !store.settings.deprecated_tokens.includes(item.symbol)"
          :to="{ name: 'trade', params: { symbol: item.symbol } }"
          class="btn-sm mb-1 mr-1 mt-1"
          title="Trade"
        >
          <ArrowsRightLeftIcon class="h-5 w-5" />
        </router-link>

        <button
          v-if="item.pendingUnstake > 0"
          class="btn-sm mb-1 mr-1 mt-1"
          title="Pending Unstakes"
          @click="
            openWalletActionModal({
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
          class="btn-sm mb-1 mr-1 mt-1"
          title="History"
        >
          <Bars3CenterLeftIcon class="h-5 w-5" />
        </router-link>
      </template>
    </CustomTable>
  </div>

  <PageFooter />
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
import { useHead } from '@unhead/vue';
import { useDocumentVisibility, useStorage } from '@vueuse/core';
import Big from 'big.js';
import { computed, defineAsyncComponent, inject, onBeforeMount, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useModal, useVfm } from 'vue-final-modal';
import { useRoute, useRouter } from 'vue-router';
import PageFooter from '@/components/PageFooter.vue';
import CustomTable from '@/components/utilities/CustomTable.vue';
import { useStore } from '@/stores';
import { useTokenStore } from '@/stores/token';
import { useUserStore } from '@/stores/user';
import { useWalletStore } from '@/stores/wallet';
import { addCommas, toFixedNoRounding, toFixedWithoutRounding } from '@/utils';

const WalletActionModal = defineAsyncComponent(() => import('@/components/modals/WalletAction.vue'));
const DepositModal = defineAsyncComponent(() => import('@/components/modals/Deposit.vue'));
const WithdrawModal = defineAsyncComponent(() => import('@/components/modals/Withdraw.vue'));
const TokenInfoModal = defineAsyncComponent(() => import('@/components/modals/TokenInfo.vue'));
const AnnouncementsModal = defineAsyncComponent(() => import('@/components/modals/Announcements.vue'));

useHead({
  title: 'Wallet',
});

const loading = ref(true);
const vfm = useVfm();

const event = inject('eventBus');

const route = useRoute();
const router = useRouter();

const { account } = route.params;

const filter = ref('');
const refresh = ref(true);
const hiveZeroBalance = useStorage('hide-small-balances', false);
const includeAll = useStorage('value-includes-all', false);

let refreshTimeout = null;

const store = useStore();
const tokenStore = useTokenStore();
const userStore = useUserStore();
const walletStore = useWalletStore();
const visibility = useDocumentVisibility();

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

const delistedTokensMap = computed(() => {
  return new Map(store.settings?.delisted_tokens?.map((d) => [d.symbol, d]));
});

const haveDelistedTokens = computed(() => {
  const delistedTokens = Array.from(delistedTokensMap.value.keys());

  return walletStore.wallet.filter((w) => delistedTokens.includes(w.symbol) && w.balance.gt(0));
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

const refreshWallet = async () => {
  if (refresh.value) {
    await fetchWallet();
  }
};

const onBoardcastSuccess = async ({ id, ntrx }) => {
  loading.value = true;

  await vfm.closeAll();

  await store.validateTransaction(ntrx > 1 ? `${id}-0` : id);
};

const onTransactionValidated = async () => {
  await fetchWallet();

  loading.value = false;
};

const openDepositModal = async () => {
  const { open } = useModal({ component: DepositModal });

  await open();
};

const openWithdrawModal = async () => {
  const { open } = useModal({ component: WithdrawModal });

  await open();
};

const openWalletActionModal = async (attrs) => {
  const { open } = useModal({ component: WalletActionModal, attrs });

  await open();
};

const openTokenInfoModal = async (token) => {
  const { open } = useModal({ component: TokenInfoModal, attrs: { token } });

  await open();
};

const openAnnouncementModal = async (symbol) => {
  const announcement = store.settings.announcements.find(
    (ann) => ann.id === delistedTokensMap.value.get(symbol)?.announcementId,
  );

  if (announcement) {
    const { open } = useModal({ component: AnnouncementsModal, attrs: announcement });

    await open();
  }
};

watch(visibility, (current) => {
  if (current === 'visible') {
    refresh.value = true;
  } else {
    refresh.value = false;
  }
});

watch(
  () => userStore.username,
  async () => {
    if (userStore.username !== '') {
      await router.push({ name: route.name, params: { account: userStore.username } });
    }
  },
);

onBeforeMount(async () => {
  loading.value = true;

  await fetchWallet();

  loading.value = false;
});

onMounted(async () => {
  refreshTimeout = setInterval(refreshWallet, 3 * 60 * 1000);

  event.on('broadcast-success', onBoardcastSuccess);
  event.on('transaction-validated', onTransactionValidated);
});

onBeforeUnmount(() => {
  clearInterval(refreshTimeout);

  event.off('broadcast-success', onBoardcastSuccess);
  event.off('transaction-validated', onTransactionValidated);
});
</script>
