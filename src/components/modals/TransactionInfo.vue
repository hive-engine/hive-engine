<template>
  <Modal v-model="show" name="transactionInfo">
    <template #title>Transaction</template>

    <template #default="{ params }">
      <div class="font-bold">Operation</div>
      <div class="mb-3">{{ params.operation }}</div>

      <div class="font-bold">Date</div>
      <div class="mb-3">{{ params.date }}</div>

      <div class="font-bold">Transaction ID</div>
      <div class="mb-3">
        <a :href="`https://he.dtools.dev/tx/${params.transactionId}`" target="_blank">{{
          params.transactionId
        }}</a>
      </div>

      <div class="font-bold">Sidechain Block</div>
      <div class="mb-3">
        <a :href="`https://he.dtools.dev/tx/${params.blockNumber}`" target="_blank">{{
          params.blockNumber
        }}</a>
      </div>

      <template v-if="params.from && params.from !== 'N/A'">
        <div class="font-bold">From</div>
        <div class="mb-3">{{ params.from }}</div>
      </template>

      <template v-if="params.to && params.to !== 'N/A'">
        <div class="font-bold">To</div>
        <div class="mb-3">{{ params.to }}</div>
      </template>

      <template v-if="params.amount">
        <div class="font-bold">Amount</div>
        <div class="mb-3">{{ params.amount }} {{ params.symbol }}</div>
      </template>

      <template v-if="params.memo">
        <div class="font-bold">Memo</div>
        <div class="mb-3">{{ params.memo }}</div>
      </template>
    </template>
  </Modal>
</template>

<script>
import { defineComponent, ref } from "vue";
import Modal from "./Modal.vue";

export default defineComponent({
  name: "TransactionInfo",

  components: {
    Modal,
  },

  setup() {
    const show = ref(false);

    return {
      show,
    };
  },
});
</script>
