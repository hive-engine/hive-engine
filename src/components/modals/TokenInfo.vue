<template>
  <Modal v-model="show" modal-id="tokenInfoModal">
    <template #title>
      <div class="flex items-center">
        <img :src="token.icon" class="mr-5 block h-10 w-10" />
        {{ token.symbol }}
      </div>
    </template>

    <div class="font-bold">Token Name</div>
    <div>{{ token.name }}</div>

    <div class="mt-3 font-bold">Supply (Circulating / Total / Max)</div>
    <div>{{ token.circulatingSupply }} / {{ token.supply }} / {{ token.maxSupply }}</div>

    <div class="mt-3 font-bold">Issuer</div>
    <div>
      <a target="_blank" :href="`https://hive.blog/@${token.issuer}`">@{{ token.issuer }}</a>
    </div>

    <template v-if="token.metadata && token.metadata.url && token.metadata.url.startsWith('http')">
      <div class="mt-5 font-bold">Website</div>
      <div>
        <a target="_blank" :href="`${token.metadata.url}`">{{ token.metadata.url }}</a>
      </div>
    </template>

    <template v-if="token.metadata && token.metadata.desc">
      <div class="mt-5 font-bold">Description</div>
      <div>{{ token.metadata.desc }}</div>
    </template>

    <div class="grid grid-cols-3">
      <div class="col-span-1 mt-3">
        <div class="font-bold">Precision</div>
        <div>{{ token.precision }}</div>
      </div>

      <div class="col-span-1 mt-3">
        <div class="font-bold">Staking</div>
        <div>{{ token.stakingEnabled ? 'Yes' : 'No' }}</div>
        <div v-if="token.stakingEnabled" class="text-sm">
          Cooldown: {{ token.unstakingCooldown }} days in {{ token.numberTransactions }} transction(s)
        </div>
      </div>

      <div class="col-span-1 mt-3">
        <div class="font-bold">Delegation</div>
        <div>{{ token.delegationEnabled ? 'Yes' : 'No' }}</div>
        <div v-if="token.delegationEnabled" class="text-sm">Cooldown: {{ token.undelegationCooldown }} days</div>
      </div>
    </div>
  </Modal>
</template>

<script setup>
import { ref } from 'vue';
import Modal from '@/components/modals/Modal.vue';

const show = ref(false);

defineProps({
  token: { type: Object, required: true },
});
</script>
