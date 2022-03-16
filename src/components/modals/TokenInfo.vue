<template>
  <Modal v-model="show" name="tokenInfoModal">
    <template #title="{ params }">
      <div class="flex items-center">
        <img :src="params.icon" class="h-10 w-10 block mr-5" />
        {{ params.symbol }}
      </div>
    </template>

    <template #default="{ params }">
      <div class="font-bold">Token Name</div>
      <div>{{ params.name }}</div>

      <div class="mt-3 font-bold">Supply (Circulating / Total / Max)</div>
      <div>{{ params.circulatingSupply }} / {{ params.supply }} / {{ params.maxSupply }}</div>

      <div class="mt-3 font-bold">Issuer</div>
      <div>
        <a target="_blank" :href="`https://hive.blog/@${params.issuer}`">@{{ params.issuer }}</a>
      </div>

      <template
        v-if="params.metadata && params.metadata.url && params.metadata.url.startsWith('http')"
      >
        <div class="mt-5 font-bold">Website</div>
        <div>
          <a target="_blank" :href="`${params.metadata.url}`">{{ params.metadata.url }}</a>
        </div>
      </template>

      <template v-if="params.metadata && params.metadata.desc">
        <div class="mt-5 font-bold">Description</div>
        <div>{{ params.metadata.desc }}</div>
      </template>

      <div class="grid grid-cols-3">
        <div class="col-span-1 mt-3">
          <div class="font-bold">Precision</div>
          <div>{{ params.precision }}</div>
        </div>

        <div class="col-span-1 mt-3">
          <div class="font-bold">Staking</div>
          <div>{{ params.stakingEnabled ? "Yes" : "No" }}</div>
          <div v-if="params.stakingEnabled" class="text-sm">
            Cooldown: {{ params.unstakingCooldown }} days in
            {{ params.numberTransactions }} transction(s)
          </div>
        </div>

        <div class="col-span-1 mt-3">
          <div class="font-bold">Delegation</div>
          <div>{{ params.delegationEnabled ? "Yes" : "No" }}</div>
          <div
            v-if="params.delegationEnabled"
            class="text-sm"
          >Cooldown: {{ params.undelegationCooldown }} days</div>
        </div>
      </div>
    </template>
  </Modal>
</template>

<script>
import { defineComponent, ref } from "vue";
import Modal from "./Modal.vue";

export default defineComponent({
  name: "TokenInfo",

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
