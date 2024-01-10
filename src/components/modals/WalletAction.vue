<template>
  <Modal modal-id="walletActionModal" @before-open="beforeOpen" @closed="modalClose">
    <template #title>{{ actionName }} {{ symbol }}</template>

    <Loading v-if="modalBusy" small />

    <template v-else>
      <CustomTable v-if="action === 'pendingUnstakes'" :items="pendingUnstakes" :fields="pendingUnstakeFields">
        <template #cell(quantity)="{ item }">{{ item.quantity }} {{ symbol }}</template>

        <template #cell(quantityLeft)="{ item }">
          {{ item.quantityLeft }} {{ symbol }}
          <small>({{ item.numberTransactionsLeft }} Transactions)</small>
        </template>

        <template #cell(nextTransactionTimestamp)="{ item }"
          >{{ item.quantityLeft / item.numberTransactionsLeft }} {{ symbol }} at
          {{ new Date(item.nextTransactionTimestamp).toLocaleString() }}</template
        >

        <template #cell(actions)="{ item }">
          <button
            class="btn-sm"
            @click.prevent="
              walletStore.requestCancelUnstake({
                symbol: symbol,
                trxId: item.txID,
              })
            "
          >
            <XMarkIcon class="h-5 w-5" />
          </button>
        </template>
      </CustomTable>

      <template v-else>
        <CustomTable v-if="action === 'undelegate'" :fields="delegationFields" :items="delegations" class="mb-5">
          <template #cell(actions)="{ item }">
            <button
              class="btn-sm"
              @click.prevent="
                quantity = item.quantity;
                from = item.to;
                requestAction();
              "
            >
              <XMarkIcon class="h-5 w-5" />
            </button>
          </template>
        </CustomTable>

        <div v-if="symbol && symbol.startsWith('SWAP.')" class="alert-warning font-bold">
          If you are trying to withdraw to an external chain, please use the Withdraw menu. This window is for
          transferring to another Hive account.
        </div>

        <div class="mb-2 block font-bold">Available</div>
        <div class="mb-4 cursor-pointer" @click="quantity = available">{{ available }} {{ symbol }}</div>

        <div v-if="showTo" class="mb-3">
          <label for="to" class="mb-2 block font-bold">To</label>
          <input
            id="to"
            v-model="to"
            type="text"
            :class="[
              v$.to.$error ? 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-500' : '',
              '',
            ]"
            placeholder="Hive username"
            @input="(event) => (to = event.target.value.toLowerCase())"
          />
          <div v-if="v$.to.$error" class="mt-1 text-sm text-red-500">Please enter a valid hive username.</div>
          <div v-if="popularChoices.length" class="mt-1 text-sm">
            Popular choice:
            <a v-for="(choice, i) of popularChoices" :key="i" class="cursor-pointer" @click="to = choice.value">{{
              choice.text
            }}</a>
          </div>
        </div>

        <div v-if="showFrom" class="mb-3">
          <label for="from" class="mb-2 block font-bold">From</label>
          <input
            id="from"
            v-model="from"
            type="text"
            :class="[
              v$.from.$error ? 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-500' : '',
              '',
            ]"
            placeholder="Hive username"
            @input="(event) => (from = event.target.value.toLowerCase())"
          />
          <div v-if="v$.from.$error" class="mt-1 text-sm text-red-500">Please enter a valid hive username.</div>
        </div>

        <div class="mb-3">
          <label for="quantity" class="mb-2 block font-bold">Quantity</label>

          <div class="flex w-full items-center">
            <input
              id="quantity"
              v-model="quantity"
              type="number"
              :class="[
                v$.quantity.$error ? 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-500' : '',
                '!rounded-r-none',
              ]"
              placeholder="Amount"
            />
            <div class="h-full rounded-r-md border border-l-0 border-gray-500 bg-gray-200 p-2 dark:bg-slate-600">
              {{ symbol }}
            </div>
          </div>
          <div v-if="v$.quantity.$error" class="mt-1 text-sm text-red-500">
            Please enter a quantity greater than zero.
          </div>
        </div>

        <div v-if="action === 'transfer'" class="mb-3">
          <label for="memo" class="mb-2 block font-bold">Memo</label>
          <input id="memo" v-model="memo" type="text" />
        </div>

        <button class="btn" :disabled="quantity > available || btnBusy" @click="requestAction">
          <Spinner v-if="btnBusy" />
          {{ ' ' }} {{ actionName }}
        </button>
      </template>
    </template>
  </Modal>
</template>

<script setup>
import { XMarkIcon } from '@heroicons/vue/24/outline';
import { useVuelidate } from '@vuelidate/core';
import { maxLength, minLength, required } from '@vuelidate/validators';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import Modal from '@/components/modals/Modal.vue';
import CustomTable from '@/components/utilities/CustomTable.vue';
import { hiveClient } from '@/plugins/hive';
import { emitter } from '@/plugins/mitt';
import { sidechain } from '@/plugins/sidechain';
import { useUserStore } from '@/stores/user';
import { useWalletStore } from '@/stores/wallet';

const props = defineProps({
  action: { type: String, default: 'transfer', required: true },
  symbol: { type: String, required: true },
  available: { type: [Object, String, Number], required: true },
});

const userStore = useUserStore();
const walletStore = useWalletStore();

const modalBusy = ref(true);
const btnBusy = ref(false);

const to = ref('');
const from = ref('');
const quantity = ref('');
const memo = ref('');

const externalResults = ref({});

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

  return Object.keys(obj[props.action]).reduce((a, c) => {
    a[c] = rules[c];
    return a;
  }, {});
});

const v$ = useVuelidate(computedRules, { to, from, quantity }, { $externalResults: externalResults });

const actionName = computed(() => {
  const obj = {
    transfer: 'Transfer',
    delegate: 'Delegate',
    undelegate: 'Undelegate',
    stake: 'Stake',
    unstake: 'Unstake',
    pendingUnstakes: 'Pending Unstakes',
  };

  return obj[props.action] || '';
});

const popularChoices = computed(() => {
  return walletStore.popularChoices(props.symbol);
});

const showTo = computed(() => ['transfer', 'stake', 'delegate'].includes(props.action));
const showFrom = computed(() => ['undelegate'].includes(props.action));

const validate = async () => {
  v$.value.$clearExternalResults();

  if (!(await v$.value.$validate())) return;

  if (v$.value.to || v$.value.from) {
    const account = v$.value.to ? to.value : from.value;
    const key = v$.value.to ? 'to' : 'from';

    try {
      const [data] = await hiveClient.getAccounts([account]);

      if (!data || !data.name) {
        externalResults.value = {
          [key]: ['Invalid hive username'],
        };
      }
    } catch (e) {
      console.log(e);
    }
  }
};

const requestAction = async () => {
  await validate();

  if (!v$.value.$invalid) {
    const actions = {
      transfer: walletStore.requestTransfer,
      delegate: walletStore.requestDelegate,
      undelegate: walletStore.requestUndelegate,
      stake: walletStore.requestStake,
      unstake: walletStore.requestUnstake,
    };

    await actions[props.action]({
      symbol: props.symbol,
      to: to.value.trim(),
      from: from.value.trim(),
      quantity: quantity.value.toString(),
      memo: memo.value.trim(),
    });
  }
};

const beforeOpen = async () => {
  modalBusy.value = true;

  if (props.action === 'stake') {
    to.value = username.value;
  } else if (props.action === 'undelegate') {
    const result = await sidechain.contract({
      method: 'find',
      params: {
        contract: 'tokens',
        table: 'delegations',
        query: { symbol: props.symbol, from: username.value },
      },
    });

    delegations.value = result.map((d) => ({
      ...d,
      quantity: Number(d.quantity),
    }));
  } else if (props.action === 'pendingUnstakes') {
    const result = await sidechain.getPendingUnstakes(username.value, props.symbol);

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

  to.value = '';
  from.value = '';
  quantity.value = '';
  memo.value = '';

  delegations.value = [];
  pendingUnstakes.value = [];
};

onMounted(() => {
  emitter.on('broadcast-awaiting', () => {
    btnBusy.value = true;
  });

  emitter.on('broadcast-done', () => {
    btnBusy.value = false;
  });
});

onBeforeUnmount(() => {
  emitter.off('broadcast-awaiting');
  emitter.off('broadcast-done');
});
</script>
