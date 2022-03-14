<template>
  <div class="page-header">
    <div class="w-full max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 text-gray-200">
      <div class="grid md:grid-cols-4 text-center md:text-left min-h-[160px] items-center">
        <div class="col-span-full md:col-span-3 mt-3">
          <h1 class="text-4xl uppercase">Rewards</h1>
        </div>
      </div>
    </div>
  </div>

  <Loading v-if="loading" />

  <div v-else class="page-content">
    <div class="alert-warning">You can only claim a token once a day, including manual and auto.</div>

    <CustomTable :fields="rewardsTableFields" :items="rewards">
      <template #cell(actions)="{ item }">
        <button class="btn-sm" @click.prevent="claimReward(item.symbol)">Claim</button>
      </template>
    </CustomTable>

    <div class="text-right mt-5">
      <button class="btn-sm" @click.prevent="claimAll">Claim All</button>
    </div>
  </div>

  <PageFooter />
</template>

<script>
import { defineComponent, inject, onBeforeMount, onBeforeUnmount, onMounted, ref } from "vue";
import { useWalletStore } from "../stores/wallet";
import { sleep } from "../utils";
import CustomTable from "../components/utilities/CustomTable.vue";
import PageFooter from "../components/PageFooter.vue";

export default defineComponent({
  name: "Rewards",

  components: {
    CustomTable,
    PageFooter,
  },

  setup() {
    const loading = ref(true);
    const event = inject("eventBus");

    const walletStore = useWalletStore();

    const rewards = ref([]);

    const rewardsTableFields = [
      { key: "symbol", label: "SYMBOL" },
      { key: "stake", label: "STAKE" },
      { key: "reward", label: "REWARD" },
      { key: "actions", label: "" },
    ];

    const fetchRewards = async () => {
      try {
        rewards.value = await walletStore.fetchScotRewards();
      } catch {
        //
      }
    };

    const claimAll = async () => {
      const symbols = rewards.value.map((r) => r.symbol);

      await walletStore.requestClaimScotRewards(symbols);
    };

    const onScotClaim = async () => {
      loading.value = true;

      await sleep(30 * 1000);

      await fetchRewards();

      loading.value = false;
    }

    onBeforeMount(async () => {
      loading.value = true;

      await fetchRewards();

      loading.value = false;
    });

    onMounted(() => {
      event.on("scot-claim-successful", onScotClaim);
    });

    onBeforeUnmount(() => {
      event.off("scot-claim-successful", onScotClaim);
    });

    return {
      loading,
      rewardsTableFields,
      rewards,

      claimReward: walletStore.requestClaimScotRewards,
      claimAll,
    };
  },
});
</script>
