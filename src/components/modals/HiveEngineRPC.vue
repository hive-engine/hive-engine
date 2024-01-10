<template>
  <Modal modal-id="hiveEngineRpcModal" @before-open="onBeforeOpen">
    <template #title>Hive-Engine RPC</template>

    <div
      v-for="(rpc, idx) of rpcs"
      :key="`${idx}-${rpc.text}`"
      class="mb-3 flex items-center space-x-4 border-b pb-2 last-of-type:border-b-0 dark:border-gray-500"
    >
      <input
        :id="rpc.text"
        class="h-4 w-4 border border-gray-300 text-red-600 focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:bg-gray-300 dark:focus:ring-red-600"
        name="hive-engine-rpc"
        type="radio"
        :value="rpc.value"
        :checked="rpc.checked"
        :disabled="responseMaps.get(rpc.value) === 'Error'"
        @change="(event) => selectRPC(event.target.value)"
      />

      <label class="block grow" :for="rpc.text">
        <div>
          <span class="font-bold">{{ rpc.text }}</span>
          <span
            v-if="rpc.text === 'enginerpc.com' || rpc.text === 'ha.herpc.dtools.dev'"
            class="ml-3 text-xs font-bold text-green-600"
            >LB</span
          >
        </div>
        <div class="text-xs">{{ rpc.value }}</div>
      </label>

      <div v-if="responseMaps.get(rpc.value)" class="flex flex-wrap space-x-4 text-sm font-bold">
        <div v-if="responseMaps.get(rpc.value) === 'Error'" class="text-red-600">Error</div>

        <template v-else>
          <div>{{ responseMaps.get(rpc.value).block }}</div>

          <div class="text-green-600">
            {{ responseMaps.get(rpc.value).response_time }}
          </div>
        </template>
      </div>

      <button :disabled="rpc.checked" class="btn-sm disabled:text-red-300" @click="removeRPC(rpc.value)">
        <XMarkIcon class="h-4 w-4" />
      </button>
    </div>

    <div class="mb-5 flex items-center justify-between space-x-4">
      <button class="btn-outline-sm dark:btn-sm" @click="restoreDefaults">Restore Defaults</button>

      <button class="btn-outline-sm dark:btn-sm" @click="fetchResponseTimes">Refresh</button>
    </div>

    <div class="mb-3">
      <label for="rpc" class="mb-1 block">Add another RPC</label>
      <div class="flex items-center space-x-4">
        <input id="rpc" v-model.trim="newRPC" type="text" placeholder="https://" />
        <button class="btn" :disabled="btnBusy" @click="addRPC">Add</button>
      </div>
    </div>
  </Modal>
</template>

<script setup>
import { XMarkIcon } from '@heroicons/vue/24/outline';
import { notify } from '@kyvg/vue3-notification';
import axios from 'axios';
import { computed, ref } from 'vue';
import Modal from '@/components/modals/Modal.vue';
import { SIDECHAIN_RPC, SIDECHAIN_RPCS } from '@/config';
import { useStore } from '@/stores';

const store = useStore();

const newRPC = ref('');
const btnBusy = ref(false);
const responseMaps = ref(new Map());

const rpcs = computed(() =>
  store.hiveEngineRPCs.map((r) => ({
    value: r,
    text: r.replace('https://', ''),
    checked: store.hiveEngineRPC === r,
  })),
);

const selectRPC = (rpc) => {
  store.hiveEngineRPC = rpc;
};

const addRPC = async () => {
  btnBusy.value = true;

  if (newRPC.value.startsWith('https://') && !store.hiveEngineRPCs.includes(newRPC.value)) {
    try {
      const response = await getLatestBlock(newRPC.value);

      responseMaps.value.set(newRPC.value, {
        block: response.data.result.blockNumber,
        response_time: `${response.response_time}s`,
      });

      store.hiveEngineRPCs.push(newRPC.value);

      newRPC.value = '';
    } catch (error) {
      notify({ title: 'Error', text: 'Invalid Hive-Engine RPC', type: 'error' });
    }
  }

  btnBusy.value = false;
};

const removeRPC = (rpc) => {
  if (window.confirm('Are you sure?')) {
    store.hiveEngineRPCs = store.hiveEngineRPCs.filter((r) => r !== rpc);
  }
};

const restoreDefaults = async () => {
  store.hiveEngineRPC = SIDECHAIN_RPC;
  store.hiveEngineRPCs = SIDECHAIN_RPCS;

  await fetchResponseTimes();
};

const getLatestBlock = async (rpc) => {
  const instance = axios.create({ baseURL: `${rpc}` });

  instance.interceptors.request.use(
    (config) => {
      return { ...config, request_timestamp: Date.now() };
    },
    (error) => Promise.reject(error),
  );

  instance.interceptors.response.use(
    (response) => {
      const duration = Date.now() - response.config.request_timestamp;

      return { ...response, rpc, response_time: (duration / 1000).toFixed(1) };
    },
    (error) => Promise.reject({ ...error, rpc }),
  );

  return instance.post('blockchain', {
    jsonrpc: '2.0',
    id: Date.now(),
    method: 'getLatestBlockInfo',
  });
};

const fetchResponseTimes = async () => {
  const requests = store.hiveEngineRPCs.map((r) => getLatestBlock(r));

  let responses = await Promise.allSettled(requests);

  responses = responses.map((r) => {
    if (r.status === 'fulfilled') {
      return [r.value.rpc, { block: r.value.data.result.blockNumber, response_time: `${r.value.response_time}s` }];
    }

    return [r.reason.rpc, 'Error'];
  });

  responseMaps.value = new Map(responses);
};

const onBeforeOpen = async () => {
  await fetchResponseTimes();
};
</script>
