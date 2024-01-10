<template>
  <Modal modal-id="depositGasFeeModal" @before-open="beforeOpen" @close="onClose">
    <template #title>Deposit Gas Fee</template>

    <Loading v-if="modalBusy" small />

    <div class="mb-3">
      In order to withdraw <strong>{{ selectedToken }}</strong> tokens, you must provide enough
      <strong>{{ evmFeeSymbol }}</strong> to cover the network gas fee. This reserved fee balance is non-refundable.
    </div>

    <div class="mb-3 font-bold">Fee deposits can take up to 5 minutes to reflect in balance.</div>

    <div class="mb-3">
      <label class="mb-2 block font-bold">Available Balance</label>
      <div class="cursor-pointer" @click="feeDepositAmount = evmFeeSymbolBalance">
        {{ evmFeeSymbolBalance }} {{ evmFeeSymbol }}
      </div>
    </div>

    <div class="mb-3">
      <label for="depositAmount" class="mb-2 block font-bold">Deposit Amount</label>

      <div class="flex items-center">
        <input id="depositAmount" v-model="feeDepositAmount" type="number" step="any" class="!rounded-r-none" />
        <div class="rounded-r-md border border-l-0 bg-gray-200 p-2 dark:border-gray-500 dark:bg-slate-600">
          {{ evmFeeSymbol }}
        </div>
      </div>
    </div>

    <button
      class="btn"
      :disabled="feeDepositAmount <= 0 || feeDepositAmount > evmFeeSymbolBalance"
      @click.prevent="depositGasFee"
    >
      Deposit Fee
    </button>
  </Modal>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useVfm } from 'vue-final-modal';
import Modal from '@/components/modals/Modal.vue';
import { emitter } from '@/plugins/mitt';
import { sidechain } from '@/plugins/sidechain';
import { useUserStore } from '@/stores/user';
import { useWalletStore } from '@/stores/wallet';
import { toFixedWithoutRounding } from '@/utils';

const props = defineProps({
  selectedToken: { type: String, required: true },
  network: { type: String, required: true },
  evmFeeSymbol: { type: String, required: true },
});

const vfm = useVfm();

const userStore = useUserStore();
const walletStore = useWalletStore();

const modalBusy = ref(false);

const evmFeeSymbolBalance = ref('');
const feeDepositAmount = ref('');

const beforeOpen = async () => {
  modalBusy.value = true;

  const balance = await sidechain.getBalance(userStore.username, props.evmFeeSymbol);

  evmFeeSymbolBalance.value = balance ? Number(balance.balance) : 0;

  modalBusy.value = false;
};

const onClose = () => {
  feeDepositAmount.value = '';
  evmFeeSymbolBalance.value = 0;
};

const depositGasFee = async () => {
  await walletStore.requestDepositGasFee({
    amount: toFixedWithoutRounding(feeDepositAmount.value, 8),
    symbol: props.evmFeeSymbol,
    network: props.network,
  });
};

onMounted(() => {
  emitter.on('fee-deposit-successful', async () => {
    await vfm.close('depositGasFeeModal');
  });
});

onBeforeUnmount(() => {
  emitter.off('fee-deposit-successful');
});
</script>
