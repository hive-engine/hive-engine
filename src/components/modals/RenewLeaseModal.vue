<template>
  <Modal v-model="show" modal-id="renewLeaseModal" @before-open="onBeforeOpen" @closed="onClosed">
    <template #title>Renew Lease</template>

    <LoadingOverlay :show="showOverlay">
      <div class="mb-3">
        <label class="mb-3 block">How long do you want to extend the lease for?</label>

        <div class="flex items-center">
          <input
            v-model="duration"
            type="number"
            step="1"
            min="1"
            class="!rounded-r-none"
            :class="
              v$.duration.$error ? '!dark:border-red-500 !focus:border-red-500 !focus:ring-red-500 !border-red-500' : ''
            "
          />

          <div class="rounded-r-md border border-l-0 bg-gray-200 p-2 dark:border-gray-500 dark:bg-slate-600">
            Week(s)
          </div>
        </div>
      </div>

      <template v-if="lease">
        <div class="mb-3">Total payment: {{ totalPayment }} {{ lease.currency }}</div>
        <div class="mb-3">Your balance: {{ currencyBalance }} {{ lease.currency }}</div>

        <button
          class="btn"
          :disabled="btnBusy || totalPayment <= 0 || totalPayment > currencyBalance"
          @click="requestPayment"
        >
          <Spinner v-if="btnBusy" /> Pay {{ totalPayment }} {{ lease.currency }}
        </button>
      </template>
    </LoadingOverlay>
  </Modal>
</template>

<script setup>
import { useVuelidate } from '@vuelidate/core';
import { required, minValue } from '@vuelidate/validators';
import Big from 'big.js';
import { computed, ref } from 'vue';
import Modal from '@/components/modals/Modal.vue';
import LoadingOverlay from '@/components/utilities/LoadingOverlay.vue';
import { useLeaseStore } from '@/stores/lease';
import { useUserStore } from '@/stores/user';
import { useWalletStore } from '@/stores/wallet';
import { toFixedNoRounding } from '@/utils';

const show = ref(false);
const showOverlay = ref(false);
const btnBusy = ref(false);

const leaseStore = useLeaseStore();
const userStore = useUserStore();
const walletStore = useWalletStore();

const props = defineProps({
  lease: { type: Object, required: true },
});

const duration = ref(1);

const totalPayment = computed(() => {
  if (!props.lease) {
    return 0;
  }

  const payment = new Big(props.lease.daily_payment)
    .mul(duration.value)
    .mul(7)
    .toFixed(leaseStore.precisions.get(props.lease.currency));

  return Number(payment);
});

const currencyBalance = computed(() => {
  if (!props.lease) {
    return 0;
  }

  const bal = walletStore.wallet.find((c) => c.symbol === props.lease.currency);

  return bal ? bal.balance : 0;
});

const rules = {
  duration: {
    required,
    minValue: minValue(1),
  },
};

const v$ = useVuelidate(rules, { duration });

const requestPayment = async () => {
  v$.value.$touch();

  if (v$.value.$invalid) {
    return;
  }

  btnBusy.value = true;

  const memo = `renew ${props.lease.id}`;

  await walletStore.requestTransfer({
    symbol: props.lease.currency,
    to: leaseStore.settings.account,
    quantity: toFixedNoRounding(totalPayment.value, leaseStore.precisions.get(props.lease.currency)),
    memo,
    eventName: 'lease-renew-successful',
  });

  btnBusy.value = false;
};

const onBeforeOpen = async () => {
  showOverlay.value = true;

  await walletStore.fetchWallet(userStore.username, [props.lease.currency]);

  showOverlay.value = false;
};

const onClosed = () => {
  duration.value = 1;
};
</script>
