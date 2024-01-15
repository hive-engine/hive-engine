<template>
  <Modal modal-id="accountsModal">
    <template #title>Switch Account</template>

    <div class="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
      <div
        v-for="account in userStore.accounts"
        :key="account"
        class="group flex cursor-pointer items-center space-x-2 rounded-md border p-2 transition hover:bg-red-600 hover:text-white dark:border-gray-500"
        :class="{ '!cursor-not-allowed bg-red-600 text-white': userStore.username === account }"
        @click.stop="switchAccount(account)"
      >
        <img
          class="block h-8 w-8 rounded-full border-2 bg-white"
          :src="`https://images.hive.blog/u/${account}/avatar`"
        />
        <div class="flex grow items-center justify-between space-x-1 text-sm font-bold">
          <div>{{ account }}</div>
          <CheckCircleIcon v-if="userStore.username === account" class="h-5 w-5" />
          <XMarkIcon
            v-else
            class="h-5 w-5 rounded-full text-red-600 group-hover:bg-white"
            @click.stop="removeAccount(account)"
          />
        </div>
      </div>
    </div>

    <div class="mt-5">
      <label for="rpc" class="mb-1 block">Add Account</label>
      <div class="flex items-center space-x-4">
        <input
          id="rpc"
          v-model.trim="username"
          type="text"
          placeholder="Hive username"
          @input="(event) => (username = event.target.value.toLowerCase())"
          @keyup.enter="addAccount"
        />
        <button class="btn" :disabled="btnBusy" @click="addAccount">Add</button>
      </div>
    </div>
  </Modal>
</template>

<script setup>
import { CheckCircleIcon, XMarkIcon } from '@heroicons/vue/24/outline';
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useVfm } from 'vue-final-modal';
import Modal from '@/components/modals/Modal.vue';
import { emitter } from '@/plugins/mitt';
import { useUserStore } from '@/stores/user';

const vfm = useVfm();

const userStore = useUserStore();

const username = ref('');
const btnBusy = ref(false);

const addAccount = async () => {
  await userStore.addAccount(username.value);
};

const switchAccount = async (account) => {
  userStore.username = account;

  await vfm.close('accountsModal');
};

const removeAccount = (account) => {
  userStore.accounts = userStore.accounts.filter((a) => a !== account);
};

onMounted(() => {
  emitter.on('add-account-awaiting', () => {
    btnBusy.value = true;
  });

  emitter.on('add-account-done', () => {
    btnBusy.value = false;
    username.value = '';
  });
});

onBeforeUnmount(() => {
  emitter.off('add-account-awaiting');
  emitter.off('add-account-done');
});
</script>
