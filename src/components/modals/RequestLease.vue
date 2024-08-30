<template>
  <Modal v-model="show" modal-id="requestLeaseModal" @before-open="onBeforeOpen" @closed="onClosed">
    <template #title>Request a Lease</template>

    <LoadingOverlay :show="showOverlay">
      <template v-if="page === 1">
        <div class="mb-3">
          <label class="mb-3 block">What you want to lease?</label>
          <select v-model="asset" name="asset">
            <option v-for="symbol of supportedAssets" :key="symbol" :value="symbol">{{ symbol }}</option>
          </select>
        </div>

        <div class="mb-3">
          <label class="mb-3 block">Which account do you want to lease for?</label>
          <input
            v-model="beneficiary"
            type="text"
            :class="
              v$.beneficiary.$error
                ? '!dark:border-red-500 !focus:border-red-500 !focus:ring-red-500 !border-red-500'
                : ''
            "
          />
        </div>

        <div class="mb-3">
          <label class="mb-3 block">How much {{ asset }} do you want to lease?</label>
          <input
            v-model="amount"
            type="number"
            step="1"
            min="1"
            :class="
              v$.amount.$error ? '!dark:border-red-500 !focus:border-red-500 !focus:ring-red-500 !border-red-500' : ''
            "
          />
        </div>

        <div class="mb-3">
          <label class="mb-3 block">How much do you want to pay per week?</label>
          <div class="flex items-center">
            <input
              v-model="payment"
              type="number"
              min="0"
              class="!rounded-r-none"
              :class="
                v$.payment.$error
                  ? '!dark:border-red-500 !focus:border-red-500 !focus:ring-red-500 !border-red-500'
                  : ''
              "
            />

            <select v-model="currency" name="currency" class="w-auto rounded-l-none border-l-0">
              <option v-for="symbol of leaseStore.currencies" :key="symbol" :value="symbol">{{ symbol }}</option>
            </select>
          </div>
        </div>

        <div class="mb-3">
          <label class="mb-3 block">How long do you want to lease the {{ asset }} for?</label>

          <div class="flex items-center">
            <input
              v-model="duration"
              type="number"
              step="1"
              min="1"
              class="!rounded-r-none"
              :class="
                v$.duration.$error
                  ? '!dark:border-red-500 !focus:border-red-500 !focus:ring-red-500 !border-red-500'
                  : ''
              "
            />

            <div class="rounded-r-md border border-l-0 bg-gray-200 p-2 dark:border-gray-500 dark:bg-slate-600">
              Week(s)
            </div>
          </div>
        </div>

        <div class="mb-1">Total payment: {{ totalPayment }} {{ currency }}</div>
        <div class="mb-1">Estimated APR: {{ apr }}%</div>
        <div class="mb-3">Your balance: {{ currencyBalance }} {{ currency }}</div>

        <div v-if="totalPayment < leaseStore.minimumPayment.get(currency)" class="mb-3 text-red-400">
          Total payment should be {{ leaseStore.minimumPayment.get(currency) }} {{ currency }} or more.
        </div>

        <button
          class="btn"
          :disabled="totalPayment > currencyBalance || totalPayment < leaseStore.minimumPayment.get(currency)"
          @click="validate"
        >
          Next
        </button>
      </template>

      <template v-else>
        <div class="mb-3">
          <h3 class="font-bold">Beneficiary</h3>

          {{ beneficiary }}
        </div>

        <div class="mb-3 grid grid-cols-3 gap-4">
          <div>
            <h3 class="font-bold">Amount</h3>

            {{ amount }} {{ asset }}
          </div>

          <div>
            <h3 class="font-bold">Total Payment</h3>

            {{ totalPayment }} {{ currency }}
          </div>

          <div>
            <h3 class="font-bold">APR</h3>

            {{ apr }}%
          </div>
        </div>

        <div class="mt-10 flex items-center justify-between gap-4">
          <button @click="page = 1"><ArrowLeftIcon class="inline h-4 w-4" aria-hidden="true" /> Go Back</button>

          <button class="btn" :disabled="btnBusy || totalPayment <= 0" @click="requestPayment">
            <Spinner v-if="btnBusy" /> Pay {{ totalPayment }} {{ currency }}
          </button>
        </div>
      </template>
    </LoadingOverlay>
  </Modal>
</template>

<script setup>
import { ArrowLeftIcon } from '@heroicons/vue/24/solid';
import { useVuelidate } from '@vuelidate/core';
import { required, minLength, maxLength, numeric, minValue } from '@vuelidate/validators';
import { computed, ref } from 'vue';
import Modal from '@/components/modals/Modal.vue';
import LoadingOverlay from '@/components/utilities/LoadingOverlay.vue';
import Spinner from '@/components/utilities/Spinner.vue';
import { useStore } from '@/stores';
import { useLeaseStore } from '@/stores/lease';
import { useUserStore } from '@/stores/user';
import { useWalletStore } from '@/stores/wallet';
import { toFixedNoRounding } from '@/utils';

const store = useStore();
const leaseStore = useLeaseStore();
const userStore = useUserStore();
const walletStore = useWalletStore();

const show = ref(false);
const showOverlay = ref(false);
const btnBusy = ref(false);
const page = ref(1);

const asset = ref(null);
const beneficiary = ref('');
const amount = ref(500);
const payment = ref('');
const currency = ref('');
const duration = ref(1);

const supportedAssets = computed(() => Array.from(leaseStore.assets.keys()));

const totalPayment = computed(() =>
  Number(toFixedNoRounding(payment.value * duration.value, leaseStore.precisions.get(currency.value))),
);

const amountUSD = computed(() => {
  const priceInHive = leaseStore.metrics.get(asset.value);

  return priceInHive * store.hivePrice * amount.value;
});

const totalPaymentUSD = computed(() => {
  const priceInHive = currency.value === 'SWAP.HIVE' ? 1 : leaseStore.metrics.get(currency.value);

  return priceInHive * store.hivePrice * totalPayment.value;
});

const apr = computed(() => {
  if (!duration.value || !totalPaymentUSD.value || !amount.value) {
    return 0;
  }

  const apr =
    (((365 / (duration.value * 7 + leaseStore.assets.get(asset.value).cooldown)) * 0.9 * totalPaymentUSD.value) /
      amountUSD.value) *
    100;

  return toFixedNoRounding(apr, 2);
});

const currencyBalance = computed(() => {
  const bal = walletStore.wallet.find((c) => c.symbol === currency.value);

  return bal ? bal.balance : 0;
});

const rules = {
  asset: {
    required,
  },
  beneficiary: {
    required,
    minLength: minLength(3),
    maxLength: maxLength(16),
  },
  amount: {
    required,
    numeric,
    minValue: minValue(1),
  },
  payment: {
    required,
    greatetThanZero: (v) => v > 0,
  },
  duration: {
    required,
    minValue: minValue(1),
  },
};

const v$ = useVuelidate(rules, { asset, beneficiary, amount, payment, duration });

const validate = () => {
  v$.value.$touch();

  if (v$.value.$invalid) {
    return;
  }

  page.value = 2;
};

const requestPayment = async () => {
  btnBusy.value = true;

  const memo = `${duration.value} ${beneficiary.value} ${amount.value} ${asset.value}`;

  await walletStore.requestTransfer({
    symbol: currency.value,
    to: leaseStore.settings.account,
    quantity: toFixedNoRounding(totalPayment.value, leaseStore.precisions.get(currency.value)),
    memo,
    eventName: 'lease-request-successful',
  });

  btnBusy.value = false;
};

const onBeforeOpen = async () => {
  showOverlay.value = true;

  if (userStore.isLoggedIn) {
    beneficiary.value = userStore.username;

    await walletStore.fetchWallet(userStore.username, leaseStore.currencies);
  }

  if (supportedAssets.value.length > 0) {
    asset.value = supportedAssets.value[0];
  }

  if (leaseStore.currencies.length > 0) {
    currency.value = leaseStore.currencies[0];
  }

  showOverlay.value = false;
};

const onClosed = () => {
  v$.value.$reset();

  page.value = 1;

  beneficiary.value = '';
  amount.value = 500;
  payment.value = '';
  duration.value = 1;

  btnBusy.value = false;
};
</script>
