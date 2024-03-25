<template>
  <Modal v-model="show" size="lg" name="balanceHistoryModal" @before-open="onBeforeOpen" @closed="onClosed">
    <template #title="{ params }">Balance History: {{ params.currency }}</template>

    <LoadingOverlay :show="showOverlay">
      <table class="mb-5 w-full table-auto">
        <thead>
          <tr>
            <th class="px-4 py-2 text-left last-of-type:text-right">Username</th>
            <th class="px-4 py-2 text-left last-of-type:text-right">Amount</th>
            <th class="px-4 py-2 text-left last-of-type:text-right">Balance</th>
            <th class="px-4 py-2 text-left last-of-type:text-right">Type</th>
            <th class="px-4 py-2 text-left last-of-type:text-right">Date</th>
          </tr>
        </thead>
        <tbody>
          <template v-if="history.length > 0">
            <tr v-for="(h, i) of history" :key="i">
              <td class="px-4 py-2 first-of-type:text-left last-of-type:text-right">{{ h.username }}</td>
              <td class="px-4 py-2 first-of-type:text-left last-of-type:text-right">{{ h.amount }}</td>
              <td class="px-4 py-2 first-of-type:text-left last-of-type:text-right">{{ h.balance_end }}</td>
              <td class="px-4 py-2 first-of-type:text-left last-of-type:text-right">{{ h.type }}</td>
              <td class="px-4 py-2 first-of-type:text-left last-of-type:text-right">
                {{ new Date(h.timestamp).toLocaleString() }}
              </td>
            </tr>
          </template>

          <tr v-else>
            <td colspan="6" class="px-4 py-2 text-center">You do have any history.</td>
          </tr>
        </tbody>
      </table>
    </LoadingOverlay>
  </Modal>
</template>

<script setup>
import { ref } from 'vue';
import Modal from '@/components/modals/Modal.vue';
import LoadingOverlay from '@/components/utilities/LoadingOverlay.vue';
import { useCardStore } from '@/stores/card';

const show = ref(false);
const showOverlay = ref(false);
const cardStore = useCardStore();

const history = ref([]);
const currency = ref('');
const page = ref(1);

const fetchHistory = async () => {
  showOverlay.value = true;

  const data = await cardStore.fetchBalanceHistory({ page: page.value, currency: currency.value });

  history.value.push(...data);

  showOverlay.value = false;
};

const onBeforeOpen = async (e) => {
  const { currency: symbol } = e.ref.params.value;

  currency.value = symbol;

  await fetchHistory();
};

const onClosed = () => {
  history.value = [];
};
</script>
