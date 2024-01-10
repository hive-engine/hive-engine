<template>
  <Modal v-model="show" name="heslWalletModal" @before-open="onBeforeOpen" @closed="onClosed">
    <template #title>Wallet</template>

    <LoadingOverlay :show="showOverlay">
      <h3 class="mb-3 text-center text-lg font-bold">Your Balances</h3>
      <table class="mb-5 w-full table-auto">
        <tbody>
          <template v-if="cardStore.balances.size > 0">
            <tr v-for="bal of cardStore.balances" :key="bal">
              <td class="px-4 py-2 first-of-type:text-left last-of-type:text-right">{{ bal[0] }}</td>
              <td class="px-4 py-2 first-of-type:text-left last-of-type:text-right">{{ bal[1] }}</td>
              <td class="px-4 py-2 first-of-type:text-left last-of-type:text-right">
                <button @click="vfm.open('balanceHistoryModal', { currency: bal[0] })">History</button>
              </td>
            </tr>
          </template>

          <tr v-else>
            <td class="px-4 py-2 text-center">You do have any balances.</td>
          </tr>
        </tbody>
      </table>

      <div class="mb-3 grid grid-cols-2 gap-3">
        <input v-model="quantity" type="number" min="1" />
        <select v-model="symbol">
          <option v-for="currency of cardStore.settings.currencies" :key="currency" :value="currency">
            {{ currency }}
          </option>
        </select>
      </div>

      <div class="mb-3 grid grid-cols-2 gap-3">
        <button class="btn" :disabled="quantity <= 0 || symbolBalance < quantity" @click="requestAction('deposit')">
          Deposit
        </button>
        <button
          class="btn"
          :disabled="
            quantity <= 0 ||
            symbolBalance < 0.001 ||
            !cardStore.balances.has(symbol) ||
            cardStore.balances.get(symbol) < quantity
          "
          @click="requestAction('withdraw')"
        >
          Withdraw
        </button>
      </div>

      <div class="text-sm">You have {{ symbolBalance }} {{ symbol }} in you Hive-Engine wallet.</div>
    </LoadingOverlay>
  </Modal>

  <BalanceHistory />
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useVfm } from 'vue-final-modal';
import Modal from '@/components/modals/Modal.vue';
import BalanceHistory from '@/components/sl/modals/BalanceHistory.vue';
import LoadingOverlay from '@/components/utilities/LoadingOverlay.vue';
import { emitter } from '@/plugins/mitt';
import { useCardStore } from '@/stores/card';
import { useWalletStore } from '@/stores/wallet';
import { sleep, toFixedNoRounding } from '@/utils';

const vfm = useVfm();

const cardStore = useCardStore();
const walletStore = useWalletStore();

const show = ref(false);
const showOverlay = ref(true);

const quantity = ref('');
const symbol = ref(cardStore.settings.currencies[0]);
const precisions = new Map(cardStore.settings.precisions);

const symbolBalance = computed(() => {
  const balance = walletStore.wallet.find((w) => w.symbol === symbol.value);

  return balance ? balance.balance.toNumber() : 0;
});

const requestAction = async (action) => {
  const qty = toFixedNoRounding(quantity.value, precisions.get(symbol.value));
  const memo = action === 'deposit' ? action : `withdraw ${qty}`;

  await walletStore.requestTransfer({
    to: cardStore.settings.account,
    quantity: action === 'deposit' ? qty : '0.001',
    symbol: symbol.value,
    memo,
    eventName: 'hesl-wallet-action-successful',
  });
};

const onBeforeOpen = async () => {
  showOverlay.value = true;

  await Promise.all([cardStore.fetchBalances(), walletStore.fetchWallet()]);

  showOverlay.value = false;
};

const onClosed = () => {
  quantity.value = '';
};

const onWalletAction = async () => {
  showOverlay.value = true;

  onClosed();

  await sleep(20 * 1000);

  await onBeforeOpen();
};

onMounted(() => {
  emitter.on('hesl-wallet-action-successful', onWalletAction);
});

onBeforeUnmount(() => {
  emitter.off('hesl-wallet-action-successful', onWalletAction);
});
</script>
