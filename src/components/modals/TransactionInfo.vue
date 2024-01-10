<template>
  <Modal v-model="show" modal-id="transactionInfoModal">
    <template #title>Transaction</template>

    <div class="font-bold">Operation</div>
    <div class="mb-3">{{ transaction.operation }}</div>

    <div class="font-bold">Date</div>
    <div class="mb-3">{{ transaction.date }}</div>

    <div class="font-bold">Transaction ID</div>
    <div class="mb-3">
      <a :href="`https://he.dtools.dev/tx/${transaction.transactionId}`" target="_blank">{{
        transaction.transactionId
      }}</a>
    </div>

    <div class="font-bold">Sidechain Block</div>
    <div class="mb-3">
      <a :href="`https://he.dtools.dev/b/${transaction.blockNumber}`" target="_blank">{{ transaction.blockNumber }}</a>
    </div>

    <template v-if="transaction.from && transaction.from !== 'N/A'">
      <div class="font-bold">From</div>
      <div class="mb-3">{{ transaction.from }}</div>
    </template>

    <template v-if="transaction.to && transaction.to !== 'N/A'">
      <div class="font-bold">To</div>
      <div class="mb-3">{{ transaction.to }}</div>
    </template>

    <template v-if="transaction.amount">
      <div class="font-bold">Amount</div>
      <div class="mb-3">{{ transaction.amount }} {{ transaction.symbol }}</div>
    </template>

    <template v-if="transaction.memo">
      <div class="font-bold">Memo</div>
      <div class="mb-3">{{ transaction.memo }}</div>
    </template>
  </Modal>
</template>

<script setup>
import { ref } from 'vue';
import Modal from '@/components/modals/Modal.vue';

const show = ref(false);

defineProps({
  transaction: { type: Object, required: true },
});
</script>
