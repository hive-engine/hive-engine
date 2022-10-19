<template>
  <Modal v-model="show" name="renewLeaseModal" @before-open="onBeforeOpen" @closed="onClosed">
    <template #title>Renew Lease</template>

    <LoadingOverlay :show="showOverlay">
      <div class="mb-3">
        <label class="block mb-3">How long do you want to extend the lease for?</label>

        <div class="flex items-center">
          <input
            v-model="duration"
            type="number"
            step="1"
            min="1"
            class="!rounded-r-none"
            :class="
              v$.duration.$error ? '!border-red-500 !dark:border-red-500 !focus:border-red-500 !focus:ring-red-500' : ''
            "
          />

          <div class="bg-gray-200 dark:bg-slate-600 dark:border-gray-500 rounded-r-md p-2 border border-l-0">
            Week(s)
          </div>
        </div>
      </div>

      <template v-if="lease">
        <div class="mb-3">Total payment: {{ totalPayment }} {{ lease.currency }}</div>
        <div class="mb-3">Your balance: {{ currencyBalance }} {{ lease.currency }}</div>

        <button class="btn" :disabled="btnBusy || totalPayment <= 0" @click="requestPayment">
          <Spinner v-if="btnBusy" /> Pay {{ totalPayment }} {{ lease.currency }}
        </button>
      </template>
    </LoadingOverlay>
  </Modal>
</template>

<script setup>
import { useVuelidate } from '@vuelidate/core';
import { required, minValue } from '@vuelidate/validators';
import { computed, ref } from 'vue';
import LoadingOverlay from '@/components/utilities/LoadingOverlay.vue';
import { useLeaseStore } from '@/stores/lease';
import { useUserStore } from '@/stores/user';
import { useWalletStore } from '@/stores/wallet';
import { toFixedNoRounding } from '@/utils';
import Modal from './Modal.vue';

const show = ref(false);
const showOverlay = ref(false);
const btnBusy = ref(false);

const leaseStore = useLeaseStore();
const userStore = useUserStore();
const walletStore = useWalletStore();

const lease = ref(null);
const duration = ref(1);

const totalPayment = computed(() => {
  if (!lease.value) {
    return 0;
  }

  return Number(
    toFixedNoRounding(lease.value.daily_payment * duration.value * 7, leaseStore.precisions.get(lease.value.currency)),
  );
});

const currencyBalance = computed(() => {
  if (!lease.value) {
    return 0;
  }

  const bal = walletStore.wallet.find((c) => c.symbol === lease.value.currency);

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

  const memo = `renew ${lease.value.id}`;

  await walletStore.requestTransfer({
    symbol: lease.value.currency,
    to: leaseStore.settings.account,
    quantity: toFixedNoRounding(totalPayment.value, leaseStore.precisions.get(lease.value.currency)),
    memo,
    eventName: 'lease-renew-successful',
  });

  btnBusy.value = false;
};

const onBeforeOpen = async (e) => {
  showOverlay.value = true;

  lease.value = e.ref.params.value.lease;

  await walletStore.fetchWallet(userStore.username, [lease.value.currency]);

  showOverlay.value = false;
};

const onClosed = () => {
  duration.value = 1;
};
</script>
