<template>
  <Modal modal-id="withdrawModal" @before-open="beforeOpen" @closed="modalClose">
    <template #title>Withdraw Tokens</template>

    <div class="flex-grow">
      <Loading v-if="modalBusy" small />

      <template v-else>
        <div class="alert-warning mb-5 font-bold">
          There is a 0.75% fee on withdrawals. For Ethereum, ERC-20, BNB, BEP-20, Polygon (POL), Polygon ERC-20 and
          Solana the withdrawal fee is 1% and you will also pay for the Ethereum / BSC / Polygon / Solana network gas
          fee.
        </div>

        <div v-if="pendingWithdrawals >= 15" class="alert-warning mb-5 text-center font-bold">
          There are <strong>{{ pendingWithdrawals }}</strong> pending withdrawals waiting to be processed. So, your
          withdrawal might be delayed.
        </div>

        <SearchSelect v-model="selectedToken" classes="rounded-md mb-3" menu-class="rounded-md" :options="tokens" />

        <template v-if="selectedToken">
          <template v-if="isWithdrawalDisabled.disabled">
            <div class="alert-warning">{{ isWithdrawalDisabled.reason }}</div>
          </template>

          <template v-else>
            <template v-if="isEvmToken">
              <SearchSelect
                v-model="evmToken"
                classes="rounded-md mb-3"
                menu-class="rounded-md"
                :options="evmTokenOptions"
              />
            </template>

            <div class="mb-3">
              <label class="mb-2 block font-bold">Available Balance</label>
              <div class="cursor-pointer" @click="withdrawAmount = tokenBalance">
                {{ tokenBalance }} {{ isEvmToken ? evmToken : selectedToken }}
              </div>
            </div>

            <div class="mb-3">
              <label for="withdrawAmount" class="mb-2 block font-bold">Withdraw Amount</label>

              <div class="flex items-center">
                <input
                  id="withdrawAmount"
                  v-model="withdrawAmount"
                  type="number"
                  step="any"
                  :class="[
                    v$.withdrawAmount.$error
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-500'
                      : '',
                    '!rounded-r-none',
                  ]"
                />
                <div
                  class="rounded-r-md border border-l-0 border-gray-500 bg-gray-200 p-2 dark:border-gray-500 dark:bg-slate-600"
                >
                  {{ isEvmToken && evmToken ? evmToken : selectedToken }}
                </div>
              </div>
              <div v-if="v$.withdrawAmount.$error" class="mt-1 text-sm text-red-500">
                Please enter a valid amount to withdraw.
              </div>
            </div>

            <div class="mb-3">
              <label for="withdrawAddress" class="mb-2 block font-bold">Withdraw Address</label>
              <input
                id="withdrawAddress"
                v-model="withdrawAddress"
                type="text"
                :class="[
                  v$.withdrawAddress.$error
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-500'
                    : '',
                  '',
                ]"
                :disabled="selectedToken === 'SWAP.HIVE'"
              />
              <div v-if="v$.withdrawAddress.$error" class="mt-1 text-sm text-red-500">
                Please enter a valid receiving address.
              </div>
            </div>

            <div v-if="showMemoField" class="mb-3">
              <label for="withdrawMemo" class="mb-2 block font-bold">Withdraw Memo</label>
              <input id="withdrawMemo" v-model="withdrawMemo" type="text" class="" />
            </div>

            <template v-if="isEvmToken && evmToken">
              <div class="flex items-center justify-between">
                <div class="mb-3">
                  <div class="mb-2 font-bold">Required Gas Fee</div>
                  <div>{{ evmGasFee }} {{ evmFeeSymbol }}</div>
                  <a
                    class="cursor-pointer text-sm font-bold text-red-500"
                    @click.prevent="walletStore.fetchGasFee(network, evmToken)"
                    >Refresh</a
                  >
                </div>

                <div class="mb-3">
                  <div class="mb-2 font-bold">Fee Balance</div>
                  <div>{{ gasFeeBalance }} {{ evmFeeSymbol }}</div>
                  <a
                    class="mr-5 cursor-pointer text-sm font-bold text-red-500"
                    @click.prevent="walletStore.fetchFeeBalance(network)"
                    >Refresh</a
                  >
                  <a class="cursor-pointer text-sm font-bold text-red-500" @click.prevent="openDepositGasFeeModal"
                    >Deposit</a
                  >
                </div>
              </div>
            </template>

            <div v-if="minimumWithdrawAmount > 0" class="mb-3">
              Minimum withdrawal amount: {{ minimumWithdrawAmount }} {{ selectedToken }}
            </div>

            <div class="mb-3">You will receive (estimated): {{ receiveAmount }} {{ receiveSymbol }}</div>

            <div v-if="selectedToken === 'SWAP.BLURT'" class="mb-3 text-sm">
              SWAP.BLURT withdrawal has 0.100 SWAP.BLURT transaction fee of the Blurt Blockchain on top of the 0.75%
              withdrawal fee of Hive-Engine.
            </div>

            <button
              class="btn"
              :disabled="
                minimumWithdrawAmount > tokenBalance ||
                minimumWithdrawAmount > withdrawAmount
                withdrawAmount <= 0 ||
                withdrawAmount > tokenBalance ||
                (isEvmToken && evmGasFee > gasFeeBalance)
              "
              @click.prevent="withdrawToken"
            >
              <Spinner v-if="btnBusy" />
              {{ ' ' }} Withdraw
              {{ isEvmToken ? evmToken : selectedToken }}
            </button>
          </template>
        </template>
      </template>
    </div>
  </Modal>
</template>

<script setup>
import { useVuelidate } from '@vuelidate/core';
import { required, requiredIf } from '@vuelidate/validators';
import { isAddress } from 'ethers';
import { computed, defineAsyncComponent, ref, watch } from 'vue';
import { useModal } from 'vue-final-modal';
import Modal from '@/components/modals/Modal.vue';
import SearchSelect from '@/components/utilities/SearchSelect.vue';
import { sidechain } from '@/plugins/sidechain';
import { useStore } from '@/stores';
import { useTokenStore } from '@/stores/token';
import { useUserStore } from '@/stores/user';
import { useWalletStore } from '@/stores/wallet';
import { toFixedWithoutRounding } from '@/utils';

const DepositGasFeeModal = defineAsyncComponent(() => import('@/components/modals/DepositGasFee.vue'));

const modalBusy = ref(true);
const btnBusy = ref(false);

const store = useStore();
const userStore = useUserStore();
const tokenStore = useTokenStore();
const walletStore = useWalletStore();

const selectedToken = ref(null);
const withdrawAmount = ref('');
const withdrawAddress = ref('');
const withdrawMemo = ref('');
const tokenBalance = ref(0);

const settings = computed(() => store.settings);
const username = computed(() => userStore.username);
const peggedTokens = computed(() => tokenStore.peggedTokens);
const evmTokens = computed(() => tokenStore.evmTokens);
const evmGasFee = computed(() => walletStore.evmGasFee);
const gasFeeBalance = computed(() => walletStore.gasFeeBalance);

const isEvmToken = ref(false);
const evmToken = ref(null);

const pendingWithdrawals = ref(0);

const tokens = computed(() => {
  let tokens = [
    ...peggedTokens.value,
    settings.value.eth_bridge.ethereum,
    settings.value.bsc_bridge.bnb,
    settings.value.polygon_bridge.pol,
    settings.value.solana_bridge.solana,
  ];

  if (settings.value.eth_bridge.erc_20.enabled) {
    tokens.push({ name: 'Ethereum Tokens', symbol: 'ERC20', pegged_token_symbol: 'ERC20' });
  }

  if (settings.value.bsc_bridge.bep_20.enabled) {
    tokens.push({
      name: 'Binance Smart Chain Tokens',
      symbol: 'BEP20',
      pegged_token_symbol: 'BEP20',
    });
  }

  if (settings.value.polygon_bridge.erc_20.enabled) {
    tokens.push({
      name: 'Polygon Tokens',
      symbol: 'POLY-ERC20',
      pegged_token_symbol: 'POLY-ERC20',
    });
  }

  tokens = tokens
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((t) => ({
      value: t.pegged_token_symbol,
      text: `${t.name} (${t.symbol})`,
      symbol: t.symbol,
    }));

  return [{ value: null, text: 'Please select a token' }, ...tokens];
});

const evmTokenOptions = computed(() => {
  const allEvmTokens = evmTokens.value.map((t) => ({
    value: t.pegged_token_symbol,
    text: `${t.name} (${t.symbol})`,
  }));

  return [{ value: null, text: 'Please select a token' }, ...allEvmTokens];
});

const isWithdrawalDisabled = computed(() => {
  const token = settings.value.disabled_withdrawals.find((t) => t.symbol === selectedToken.value);

  return {
    disabled: !!token,
    ...token,
  };
});

const evmAssets = computed(() => {
  const {
    eth_bridge: {
      ethereum: { pegged_token_symbol: peggedEth },
    },
    bsc_bridge: {
      bnb: { pegged_token_symbol: peggedBnb },
    },
    polygon_bridge: {
      pol: { pegged_token_symbol: peggedMatic },
    },
  } = settings.value;

  return [peggedEth, peggedBnb, peggedMatic];
});

const evmFeeSymbol = computed(() => {
  const {
    eth_bridge: {
      ethereum: { pegged_token_symbol: peggedEth },
    },
    bsc_bridge: {
      bnb: { pegged_token_symbol: peggedBnb },
    },
    polygon_bridge: {
      pol: { pegged_token_symbol: peggedMatic },
    },
  } = settings.value;

  const feeSymbols = {
    ETH: peggedEth,
    ERC20: peggedEth,
    BNB: peggedBnb,
    BEP20: peggedBnb,
    POL: peggedMatic,
    'POLY-ERC20': peggedMatic,
  };

  return feeSymbols[selectedToken.value];
});

const network = computed(() => {
  const networks = {
    ['SWAP.ETH']: 'eth',
    ERC20: 'eth',
    ['SWAP.BNB']: 'bsc',
    BEP20: 'bsc',
    ['SWAP.MATIC']: 'polygon',
    'POLY-ERC20': 'polygon',
  };

  return networks[selectedToken.value];
});

const receiveAmount = computed(() => {
  let receiveAmount = 0;

  if (withdrawAmount.value > 0) {
    receiveAmount = toFixedWithoutRounding(withdrawAmount.value * 0.9925, 8);

    if (
      [
        ...evmAssets.value,
        'ERC20',
        'BEP20',
        'POLY-ERC20',
        store.settings?.solana_bridge.solana.pegged_token_symbol,
      ].includes(selectedToken.value)
    ) {
      receiveAmount = toFixedWithoutRounding(withdrawAmount.value * 0.99 - evmGasFee.value, 8);
    } else if (selectedToken.value === 'SWAP.BLURT') {
      receiveAmount = toFixedWithoutRounding(receiveAmount - 0.1, 3);
    } else if (selectedToken.value === 'SWAP.HIVE') {
      receiveAmount = toFixedWithoutRounding(receiveAmount, 3);
    }
  }

  return receiveAmount;
});

const receiveSymbol = computed(() => {
  if (isEvmToken.value && evmToken.value) {
    const { symbol } = evmTokens.value.find((t) => t.pegged_token_symbol === evmToken.value);

    return symbol;
  } else if (selectedToken.value) {
    const { symbol } = tokens.value.find((t) => t.value === selectedToken.value);

    return symbol;
  }

  return undefined;
});

const minimumWithdrawAmount = computed(() => {
  let min = 0;
  const minWithdrawals = new Map(settings.value.minimum_withdrawals);

  if (selectedToken.value) {
    min = minWithdrawals.get(selectedToken.value) || 0;
  }

  return min;
});

const showMemoField = computed(() => {
  const supportsMemo = ['SWAP.EOS', 'SWAP.BTS'];

  return supportsMemo.includes(selectedToken.value);
});

const rules = {
  withdrawAmount: {
    required,
    minValue(value) {
      if (minimumWithdrawAmount.value > 0) {
        return value >= minimumWithdrawAmount.value;
      }

      return value > 0;
    },
  },

  withdrawAddress: {
    requiredIf: requiredIf(() => {
      return selectedToken.value !== 'SWAP.HIVE';
    }),
    validAddress: (value) => {
      if (evmAssets.value.includes(selectedToken.value) || isEvmToken.value) {
        return isAddress(value);
      } else if (selectedToken.value === store.settings?.solana_bridge.solana.pegged_token_symbol) {
        return /[1-9A-HJ-NP-Za-km-z]{32,44}/.test(value);
      }

      return true;
    },
  },
};

const v$ = useVuelidate(rules, { withdrawAmount, withdrawAddress });

const withdrawToken = async () => {
  v$.value.$touch();

  const symbol = ['ERC20', 'BEP20', 'POLY-ERC20'].includes(selectedToken.value) ? evmToken.value : selectedToken.value;

  let amount = withdrawAmount.value;

  if (symbol === 'SWAP.BLURT') {
    amount = toFixedWithoutRounding(amount, 3);
  }
  if (!v$.value.$invalid) {
    btnBusy.value = true;

    await walletStore.requestTokenWithdrawal({
      amount: amount.toString(),
      symbol,
      address: withdrawAddress.value.trim(),
      memo: withdrawMemo.value.trim(),
      network: network.value,
    });

    btnBusy.value = false;
  }
};

const beforeOpen = async () => {
  modalBusy.value = true;

  if (!settings.value) {
    await store.fetchSettings();
  }

  const [pending] = await Promise.all([sidechain.getPendingWithdrawals(), tokenStore.fetchPeggedTokens()]);

  pendingWithdrawals.value = pending.length;

  modalBusy.value = false;
};

const modalClose = () => {
  selectedToken.value = null;
  withdrawAmount.value = '';
  withdrawAddress.value = '';
  withdrawMemo.value = '';
  tokenBalance.value = 0;
};

const openDepositGasFeeModal = async () => {
  const { open } = useModal({
    component: DepositGasFeeModal,
    attrs: { selectedToken: selectedToken.value, network: network.value, evmFeeSymbol: evmFeeSymbol.value },
  });

  await open();
};

watch(selectedToken, async (value) => {
  modalBusy.value = true;

  v$.value.$reset();

  isEvmToken.value = false;
  tokenBalance.value = 0;

  withdrawAddress.value = '';

  if (value === 'SWAP.HIVE') {
    withdrawAddress.value = username.value;
  } else if (evmAssets.value.includes(value)) {
    await walletStore.fetchGasFee(network.value, value);
  } else if (['ERC20', 'BEP20', 'POLY-ERC20'].includes(value)) {
    isEvmToken.value = true;

    await Promise.all([
      tokenStore.fetchSupportedEvmTokens({ network: network.value, withdrawal: true }),
      walletStore.fetchFeeBalance(network.value),
    ]);
  }

  withdrawMemo.value = '';
  withdrawAmount.value = '';

  if (!['ERC20', 'BEP20', 'POLY-ERC20'].includes(value)) {
    const balance = await sidechain.getBalance(username.value, value);

    tokenBalance.value = balance ? Number(balance.balance) : 0;
  }

  modalBusy.value = false;
});

watch(evmToken, async (value) => {
  v$.value.$reset();

  const [balance] = await Promise.all([
    sidechain.getBalance(username.value, value),
    walletStore.fetchGasFee(network.value, value),
    walletStore.fetchFeeBalance(network.value),
  ]);

  tokenBalance.value = balance ? Number(balance.balance) : 0;
});
</script>
