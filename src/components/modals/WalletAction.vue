<template>
  <vue-final-modal
    v-slot="{ params, close }"
    v-model="show"
    classes="flex justify-center items-center overflow-y-auto"
    content-class="w-full max-w-xl relative flex flex-col max-h-full"
    name="walletActionModal"
    @before-open="beforeOpen"
    @closed="modalClose"
  >
    <div class="border dark:border-gray-800 rounded bg-white dark:bg-gray-600 dark:text-gray-300">
      <div class="flex items-center justify-between px-6 py-4">
        <div class="text-3xl font-bold leading-6 text-gray-900 dark:text-gray-300">
          {{ actionName }} {{ params.symbol }}
        </div>

        <button class="dark:text-gray-300" @click="close">
          <XMarkIcon class="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div class="p-6 flex-grow">
        <Loading v-if="modalBusy" small />

        <template v-else>
          <CustomTable
            v-if="params.action === 'pendingUnstakes'"
            :items="pendingUnstakes"
            :fields="pendingUnstakeFields"
          >
            <template #cell(quantity)="{ item }">{{ item.quantity }} {{ params.symbol }}</template>

            <template #cell(quantityLeft)="{ item }">
              {{ item.quantityLeft }} {{ params.symbol }}
              <small>({{ item.numberTransactionsLeft }} Transactions)</small>
            </template>

            <template #cell(nextTransactionTimestamp)="{ item }"
              >{{ item.quantityLeft / item.numberTransactionsLeft }} {{ params.symbol }} at
              {{ new Date(item.nextTransactionTimestamp).toLocaleString() }}</template
            >

            <template #cell(actions)="{ item }">
              <button
                class="btn-sm"
                @click.prevent="
                  walletStore.requestCancelUnstake({
                    symbol: params.symbol,
                    trxId: item.txID,
                  })
                "
              >
                <XMarkIcon class="h-5 w-5" />
              </button>
            </template>
          </CustomTable>

          <template v-else>
            <CustomTable
              v-if="params.action === 'undelegate'"
              :fields="delegationFields"
              :items="delegations"
              class="mb-5"
            >
              <template #cell(actions)="{ item }">
                <button
                  class="btn-sm"
                  @click.prevent="
                    quantity = item.quantity;
                    from = item.to;
                    requestAction(params);
                  "
                >
                  <XMarkIcon class="h-5 w-5" />
                </button>
              </template>
            </CustomTable>

            <div v-if="params.symbol && params.symbol.startsWith('SWAP.')" class="alert-warning font-bold">
              If you are trying to withdraw to an external chain, please use the Withdraw menu. This window is for
              transferring to another Hive account.
            </div>

            <div class="block mb-2 font-bold">Available</div>
            <div class="cursor-pointer mb-4" @click="quantity = params.available">
              {{ params.available }} {{ params.symbol }}
            </div>

            <div v-if="showTo" class="mb-3">
              <label for="to" class="block mb-2 font-bold">To</label>
              <input
                id="to"
                v-model="to"
                type="text"
                :class="[
                  v$.to.$error ? 'border-red-500 dark:border-red-500 focus:border-red-500 focus:ring-red-500' : '',
                  'rounded-md dark:bg-slate-600 w-full',
                ]"
                placeholder="Hive username"
                @input="(event) => (to = event.target.value.toLowerCase())"
              />
              <div v-if="v$.to.$error" class="text-sm text-red-500 mt-1">Please enter a valid hive username.</div>
              <div v-if="popularChoices.length" class="text-sm mt-1">
                Popular choice:
                <a v-for="(choice, i) of popularChoices" :key="i" class="cursor-pointer" @click="to = choice.value">{{
                  choice.text
                }}</a>
              </div>
            </div>

            <div v-if="showFrom" class="mb-3">
              <label for="from" class="block mb-2 font-bold">From</label>
              <input
                id="from"
                v-model="from"
                type="text"
                :class="[
                  v$.from.$error ? 'border-red-500 dark:border-red-500 focus:border-red-500 focus:ring-red-500' : '',
                  'rounded-md dark:bg-slate-600 w-full',
                ]"
                placeholder="Hive username"
                @input="(event) => (from = event.target.value.toLowerCase())"
              />
              <div v-if="v$.from.$error" class="text-sm text-red-500 mt-1">Please enter a valid hive username.</div>
            </div>

            <div class="mb-3">
              <label for="quantity" class="block mb-2 font-bold">Quantity</label>

              <div class="flex items-center w-full">
                <input
                  id="quantity"
                  v-model="quantity"
                  type="number"
                  :class="[
                    v$.quantity.$error
                      ? 'border-red-500 dark:border-red-500 focus:border-red-500 focus:ring-red-500'
                      : '',
                    'rounded-l-md dark:bg-slate-600 w-full',
                  ]"
                  placeholder="Amount"
                />
                <div class="bg-gray-200 dark:bg-slate-600 h-full p-2 border border-l-0 rounded-r-md border-gray-500">
                  {{ params.symbol }}
                </div>
              </div>
              <div v-if="v$.quantity.$error" class="text-sm text-red-500 mt-1">
                Please enter a quantity greater than zero.
              </div>
            </div>

            <div v-if="params.action === 'transfer'" class="mb-3">
              <label for="memo" class="block mb-2 font-bold">Memo</label>
              <input id="memo" v-model="memo" type="text" class="rounded-md dark:bg-slate-600 w-full" />
            </div>

            <button class="btn" :disabled="quantity > params.available" @click="requestAction(params)">
              <Spinner v-if="btnBusy" />
              {{ ' ' }} {{ actionName }}
            </button>
          </template>
        </template>
      </div>
    </div>
  </vue-final-modal>
</template>

<script setup>
import { XMarkIcon } from '@heroicons/vue/24/outline';
import { useVuelidate } from '@vuelidate/core';
import { maxLength, minLength, required } from '@vuelidate/validators';
import { computed, inject, onBeforeUnmount, onMounted, ref } from 'vue';
import { sidechain } from '../../plugins/sidechain';
import { useUserStore } from '../../stores/user';
import { useWalletStore } from '../../stores/wallet';
import CustomTable from '../utilities/CustomTable.vue';

const eventBus = inject('eventBus');
const show = ref(false);

const userStore = useUserStore();
const walletStore = useWalletStore();

const modalAction = ref('transfer');
const modalBusy = ref(true);
const btnBusy = ref(false);

const to = ref('');
const from = ref('');
const quantity = ref('');
const memo = ref('');

const tokenSymbol = ref('');

const delegations = ref([]);
const delegationFields = [
  { key: 'to', label: 'From' },
  { key: 'quantity', label: 'Amount' },
  { key: 'actions', label: '' },
];

const pendingUnstakes = ref([]);
const pendingUnstakeFields = [
  { key: 'quantity', label: 'Quantity' },
  { key: 'quantityLeft', label: 'Remaining' },
  { key: 'nextTransactionTimestamp', label: 'Next Withdrawal' },
  { key: 'actions', label: '' },
];

const username = computed(() => userStore.username);

const rules = {
  to: {
    required,
    minLength: minLength(3),
    maxLength: maxLength(16),
    validUsername: (value) => {
      if (value === '') {
        return true;
      }

      return /^([a-z])[a-z0-9-.]*$/.test(value);
    },
  },

  from: {
    required,
    minLength: minLength(3),
    maxLength: maxLength(16),
    validUsername: (value) => {
      if (value === '') {
        return true;
      }

      return /^([a-z])[a-z0-9-.]*$/.test(value);
    },
  },

  quantity: {
    required,
    greaterThanZero: (v) => {
      if (v === '') {
        return true;
      }

      return v > 0;
    },
  },
};

const computedRules = computed(() => {
  const obj = {
    transfer: { to, quantity },
    delegate: { to, quantity },
    undelegate: { from, quantity },
    stake: { to, quantity },
    unstake: { quantity },
    pendingUnstakes: {},
  };

  return Object.keys(obj[modalAction.value]).reduce((a, c) => {
    a[c] = rules[c];
    return a;
  }, {});
});

const v$ = useVuelidate(computedRules, { to, from, quantity });

const actionName = computed(() => {
  const obj = {
    transfer: 'Transfer',
    delegate: 'Delegate',
    undelegate: 'Undelegate',
    stake: 'Stake',
    unstake: 'Unstake',
    pendingUnstakes: 'Pending Unstakes',
  };

  return obj[modalAction.value] || '';
});

const requestAction = async (params) => {
  v$.value.$touch();

  if (!v$.value.$invalid) {
    const actions = {
      transfer: walletStore.requestTransfer,
      delegate: walletStore.requestDelegate,
      undelegate: walletStore.requestUndelegate,
      stake: walletStore.requestStake,
      unstake: walletStore.requestUnstake,
    };

    await actions[modalAction.value]({
      symbol: params.symbol,
      to: to.value.trim(),
      from: from.value.trim(),
      quantity: quantity.value.toString(),
      memo: memo.value.trim(),
    });
  }
};

const popularChoices = computed(() => {
  if (
    [
      'ORB',
      'ALPHA',
      'BETA',
      'UNTAMED',
      'DEC',
      'SLDICE',
      'PLOT',
      'ZONE',
      'SECTOR',
      'TRACT',
      'REGION',
      'RAFFLE',
      'TOTEMC',
      'TOTEMR',
      'TOTEME',
      'TOTEML',
      'SPS',
      'CHAOS',
      'VOUCHER',
    ].includes(tokenSymbol.value)
  ) {
    return [{ text: 'Splinterlands', value: 'steemmonsters' }];
  }

  return [];
});

const showTo = computed(() => ['transfer', 'stake', 'delegate'].includes(modalAction.value));
const showFrom = computed(() => ['undelegate'].includes(modalAction.value));

const beforeOpen = async (e) => {
  modalBusy.value = true;

  const { action, symbol } = e.ref.params.value;
  modalAction.value = action;
  tokenSymbol.value = symbol;

  if (modalAction.value === 'stake') {
    to.value = username.value;
  } else if (modalAction.value === 'undelegate') {
    const result = await sidechain.contract({
      method: 'find',
      params: {
        contract: 'tokens',
        table: 'delegations',
        query: { symbol, from: username.value },
      },
    });

    delegations.value = result.map((d) => ({
      ...d,
      quantity: Number(d.quantity),
    }));
  } else if (modalAction.value === 'pendingUnstakes') {
    const result = await sidechain.getPendingUnstakes(username.value, symbol);

    pendingUnstakes.value = result.map((p) => ({
      ...p,
      quantity: Number(p.quantity),
      quantityLeft: Number(p.quantityLeft),
    }));
  }

  modalBusy.value = false;
};

const modalClose = () => {
  v$.value.$reset();

  modalAction.value = 'transfer';

  to.value = '';
  from.value = '';
  quantity.value = '';
  memo.value = '';

  delegations.value = [];
  pendingUnstakes.value = [];
};

onMounted(() => {
  eventBus.on('broadcast-awaiting', () => {
    btnBusy.value = true;
  });

  eventBus.on('broadcast-done', () => {
    btnBusy.value = false;
  });

  eventBus.on('broadcast-success', () => {
    show.value = false;
  });
});

onBeforeUnmount(() => {
  eventBus.off('broadcast-awaiting');
  eventBus.off('broadcast-done');
  eventBus.off('broadcast-success');
});
</script>
