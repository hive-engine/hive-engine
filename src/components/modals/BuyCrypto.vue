<template>
  <Modal v-model="show" modal-id="buyCryptoModal" @before-open="onBeforeOpen" @closed="onClosed">
    <template #title>Buy Cryptocurrency</template>

    <Loading v-if="modalBusy" small />

    <template v-else>
      <div v-if="!userStore.isLoggedIn" class="pb-5 pt-5 text-center">
        <p class="mb-3">Please login in to buy cryptocurrency using fiat currency.</p>

        <button class="btn" @click="vfm.open('loginModal')">Login</button>
      </div>

      <template v-else>
        <LoadingOverlay :show="formBusy">
          <div class="mb-3">
            <label>You Pay</label>
            <div class="flex items-center gap-3">
              <input
                v-model="sourceAmount"
                :class="[
                  v$.sourceAmount.$error
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-500'
                    : '',
                  'w-full rounded-md dark:border-gray-500 dark:bg-slate-600',
                ]"
                type="number"
              />

              <SearchSelect v-model="source" classes="rounded-md" menu-class="rounded-md" :options="fiats" />
            </div>
            <div class="mt-1 text-sm">
              Orders for your selected payment type must be between {{ min }} and {{ max }}
            </div>
          </div>

          <div class="mb-3">
            <label>You Receive</label>
            <div class="flex items-center gap-3">
              <input
                v-model="targetAmount"
                class="w-full rounded-md dark:border-gray-500 dark:bg-slate-600"
                type="number"
                readonly
              />

              <SearchSelect v-model="target" classes="rounded-md" menu-class="rounded-md" :options="coins" />
            </div>
          </div>

          <div class="mb-3">
            <label>Blockchain</label>
            <SearchSelect
              v-model="blockchain"
              classes="rounded-md"
              menu-class="rounded-md"
              :options="blockchains"
              :disabled="blockchains.length <= 1"
            />
          </div>

          <div class="mb-3">
            <label>Your Wallet</label>
            <input
              v-model="address"
              :class="[
                v$.address.$error ? 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-500' : '',
                'w-full rounded-md dark:border-gray-500 dark:bg-slate-600',
              ]"
              type="text"
            />
          </div>

          <div v-if="['BNB', 'XRP'].includes(target)" class="mb-3">
            <label>Memo / Tag</label>
            <input v-model="tag" class="w-full rounded-md dark:border-gray-500 dark:bg-slate-600" type="text" />
          </div>

          <div class="mb-3 grid grid-cols-2 gap-3">
            <div
              v-for="pm of paymentMethods"
              :key="pm.id"
              :class="[
                'cursor-pointer border border-gray-700 px-1.5 py-2 transition hover:border-gray-500 hover:bg-[rgba(0,0,0,.2)]',
                method === pm.id ? 'border-gray-500 bg-[rgba(0,0,0,.2)]' : '',
              ]"
              @click.prevent="method = pm.id"
            >
              <div class="flex h-full items-center">
                <div
                  class="rounded-full bg-white bg-center bg-no-repeat"
                  :style="`height:50px; width:50px; background-size:75%; background-image: url('${pm.logo_url}')`"
                />

                <div class="pl-3">
                  <div>{{ pm.name }}</div>
                  <div class="text-sm">Gateway fee: {{ pm.fee }} {{ pm.fee_type === 'percentage' ? '%' : source }}</div>
                </div>
              </div>
            </div>
          </div>

          <button class="btn" @click="createOrder"><Spinner v-if="btnBusy" /> Create Order</button>
        </LoadingOverlay>
      </template>
    </template>
  </Modal>
</template>

<script setup>
import { useVuelidate } from '@vuelidate/core';
import { maxValue, minValue, required } from '@vuelidate/validators';
import { watchDebounced } from '@vueuse/core';
import axios from 'axios';
import { computed, ref, watch } from 'vue';
import { useVfm } from 'vue-final-modal';
import Modal from '@/components/modals/Modal.vue';
import LoadingOverlay from '@/components/utilities/LoadingOverlay.vue';
import SearchSelect from '@/components/utilities/SearchSelect.vue';
import { BANXA_API } from '@/config';
import { useUserStore } from '@/stores/user';

const vfm = useVfm();

const banxaApi = axios.create({ baseURL: BANXA_API });

const show = ref(false);

const userStore = useUserStore();

const coins = ref([]);
const fiats = ref([]);
const coinsRaw = ref([]);

const source = ref('USD');
const sourceAmount = ref('');
const target = ref('BTC');
const targetAmount = ref('');

const paymentMethods = ref([]);
const method = ref(null);

const blockchain = ref('BTC');

const address = ref('');
const tag = ref('');

const min = ref(100);
const max = ref(1000);

const formBusy = ref(false);
const btnBusy = ref(false);
const modalBusy = ref(true);

const rules = {
  sourceAmount: {
    required,
    minValue: minValue(min.value),
    maxValue: maxValue(max.value),
  },

  address: {
    required,
  },
};

const blockchains = computed(() => {
  const coin = coinsRaw.value.find((c) => c.coin_code === target.value);

  return coin ? coin.blockchains.map((b) => ({ value: b.code, text: b.description })) : [];
});

const v$ = useVuelidate(rules, { sourceAmount, address });

const fetchPaymentMethods = async () => {
  formBusy.value = true;

  const { data: methods } = await banxaApi.get('payment-methods', {
    params: { source: source.value, target: target.value },
  });

  paymentMethods.value = methods.map((p) => {
    let fee = p.transaction_fees[0].fees[0].amount;

    if (p.transaction_fees[0].fees[0].type === 'percentage') {
      fee *= 100;
    }

    return {
      id: p.id,
      name: p.name,
      logo_url: p.logo_url,
      fee: fee.toFixed(2),
      fee_type: p.transaction_fees[0].fees[0].type,
      min: p.transaction_limits[0].min,
      max: p.transaction_limits[0].max,
    };
  });

  method.value = paymentMethods.value[0].id;

  formBusy.value = false;
};

const fetchPrices = async () => {
  if (sourceAmount.value > 0) {
    formBusy.value = true;

    const { data: prices } = await banxaApi.get(`prices`, {
      params: {
        source: source.value,
        target: target.value,
        amount: sourceAmount.value,
        method: method.value,
        blockchain: blockchain.value,
      },
    });

    if (prices.length) {
      targetAmount.value = prices[0].coin_amount;
    }

    formBusy.value = false;
  }
};

const onBeforeOpen = async () => {
  modalBusy.value = true;

  if (coins.value.length <= 0 && fiats.value.length <= 0) {
    const [{ data: coinsData }, { data: fiatsData }] = await Promise.all([
      banxaApi.get('coins'),
      banxaApi.get('fiats'),
    ]);

    coinsRaw.value = coinsData;

    coins.value = coinsData.map((c) => ({
      value: c.coin_code,
      text: `${c.coin_name} (${c.coin_code})`,
    }));
    fiats.value = fiatsData.map((f) => ({
      value: f.fiat_code,
      text: `${f.fiat_name} (${f.fiat_code})`,
    }));
  }

  await fetchPaymentMethods();

  modalBusy.value = false;
};

const onClosed = () => {
  v$.value.$reset();

  source.value = 'USD';
  sourceAmount.value = '';

  target.value = 'BTC';
  targetAmount.value = '';

  address.value = '';
  tag.value = '';
};

const createOrder = () => {
  v$.value.$touch();

  if (v$.value.$invalid) {
    return;
  }

  const payload = {
    account: userStore.username,
    source: source.value,
    target: target.value,
    address: address.value,
    tag: tag.value,
    amount: sourceAmount.value,
    method: method.value,
    ts: Date.now(),
    blockchain: blockchain.value,
    return_url: 'https://hive-engine.com',
  };

  if (!window.hive_keychain) {
    return alert('Please install Hive Keychain!');
  }

  btnBusy.value = true;

  window.hive_keychain.requestSignBuffer(payload.account, `${payload.account}${payload.ts}`, 'Posting', async (r) => {
    if (r.success) {
      payload.sig = r.result;

      try {
        const { data: result } = await banxaApi.post(`order`, payload);

        if (result.checkout_url) {
          const link = document.createElement('a');
          link.href = result.checkout_url;
          link.click();

          show.value = false;
        }
      } catch (e) {
        console.log(e);
      }
    }

    btnBusy.value = false;
  });
};

watch(source, async () => {
  await fetchPaymentMethods();
});

watch(target, async () => {
  blockchain.value = blockchains.value.length ? blockchains.value[0].value : null;

  await fetchPrices();
});

watch(method, async () => {
  const pm = paymentMethods.value.find((pm) => pm.id === method.value);

  min.value = pm.min;
  max.value = pm.max;

  await fetchPrices();
});

watchDebounced(
  sourceAmount,
  async () => {
    await fetchPrices();
  },
  { debounce: 200 },
);
</script>
