<template>
  <div class="page-header">
    <div class="w-full max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 text-gray-200">
      <div class="grid md:grid-cols-4 text-center md:text-left min-h-[160px] items-center">
        <div class="col-span-full md:col-span-3 mt-3">
          <h1 class="text-4xl uppercase">Conversion History</h1>
        </div>
      </div>
    </div>
  </div>

  <Loading v-if="loading" />

  <div v-else class="page-content">
    <CustomTable :fields="historyTableFields" :items="history">
      <template #cell(type)="{ item }">
        <span
          :class="{
            'text-red-500': item.type === 'Deposit',
            'text-green-500': item.type === 'Withdraw',
          }"
          >{{ item.type }}</span
        >
      </template>

      <template #cell(trx_id)="{ item }">
        <a :href="getExplorerLink(item.symbol, item.trx_id)" target="_blank"
          >{{ item.trx_id.substr(0, 5) }}...{{ item.trx_id.substr(-5, 5) }}</a
        >
      </template>
    </CustomTable>
  </div>

  <PageFooter />
</template>

<script>
import { defineComponent, onBeforeMount, ref } from "vue";
import { useWalletStore } from "../stores/wallet";
import CustomTable from "../components/utilities/CustomTable.vue";
import PageFooter from "../components/PageFooter.vue";

export default defineComponent({
  name: "ConversionHistory",

  components: {
    PageFooter,
    CustomTable,
  },

  setup() {
    const loading = ref(true);

    const walletStore = useWalletStore();

    const history = ref([]);

    const historyTableFields = [
      { key: "date", label: "Date" },
      { key: "type", label: "TYPE" },
      { key: "address", label: "ADDRESS" },
      { key: "amount", label: "AMOUNT" },
      { key: "symbol", label: "TOKEN" },
      { key: "fee", label: "FEE" },
      { key: "trx_id", label: "TX ID" },
    ];

    const explorers = {
      HBD: "https://hiveblocks.com/tx/{trxId}",
      HIVE: "https://hiveblocks.com/tx/{trxId}",
      STEEM: "https://steemd.com/tx/{trxId}",
      SBD: "https://steemd.com/tx/{trxId}",
      BTC: "https://blockchair.com/bitcoin/transaction/{trxId}",
      LTC: "https://blockchair.com/litecoin/transaction/{trxId}",
      DOGE: "https://blockchair.com/dogecoin/transaction/{trxId}",
      BCH: "https://blockchair.com/bitcoin-cash/transaction/{trxId}",
      EOS: "https://bloks.io/transaction/{trxId}",
      BLURT: "https://blocks.blurtwallet.com/#/tx/{trxId}",
      WAX: "https://wax.bloks.io/transaction/{trxId}",
      GOLOS: "https://explorer.golos.id/#tx/{trxId}",
      BTS: "https://cryptofresh.com/tx/{trxId}",
      SAVVA: "https://explorer.cyberway.io/trx/{trxId}",
      TLOS: "https://telos.eosx.io/tx/{trxId}",
    };

    const getExplorerLink = (symbol, trxId) => {
      const explorer =
        (symbol.includes("SWAP.") ? "https://he.dtools.dev/tx/{trxId}" : explorers[symbol]) ||
        "https://hive-engine.com";

      return explorer.replace("{trxId}", trxId);
    };

    onBeforeMount(async () => {
      loading.value = true;

      history.value = await walletStore.fetchConversionHistory();

      loading.value = false;
    });

    return {
      loading,

      historyTableFields,
      history,

      getExplorerLink,
    };
  },
});
</script>
