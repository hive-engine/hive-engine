<template>
  <Modal v-model="show" modal-id="loginModal" @before-open="beforeOpen" @close="onClose">
    <template #title>Login</template>

    <div class="text-center">
      <label for="username" class="sr-only">Hive username</label>

      <input
        id="username"
        v-model="username"
        type="text"
        name="username"
        placeholder="Hive username"
        :class="[
          v$.username.$error ? 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-500' : '',
          'mx-auto w-3/4 max-w-sm px-3 py-3 text-center text-xl placeholder-gray-300',
        ]"
        required
        @blur="v$.username.$touch()"
        @input="(event) => (username = event.target.value.toLowerCase())"
        @keyup.enter="requestLogin"
      />

      <button type="submit" class="btn mt-10 py-3" :disabled="v$.username.$invalid || btnBusy" @click="requestLogin">
        <Spinner v-if="btnBusy" />
        {{ ' ' }} Login using Keychain
      </button>

      <div class="mt-3 text-center text-sm">
        <a href="https://hive-keychain.com" target="_blank">Download Hive Keychain</a>
      </div>
    </div>
  </Modal>
</template>

<script setup>
import { useVuelidate } from '@vuelidate/core';
import { maxLength, minLength, required } from '@vuelidate/validators';
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useVfm } from 'vue-final-modal';
import { useRoute, useRouter } from 'vue-router';
import Modal from '@/components/modals/Modal.vue';
import { emitter } from '@/plugins/mitt';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();

const vfm = useVfm();

const username = ref('');
const show = ref(false);
const btnBusy = ref(false);

const route = useRoute();
const router = useRouter();

const rules = {
  username: {
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
};

const v$ = useVuelidate(rules, { username });

let loggedInUser = localStorage.getItem('username');

if (loggedInUser && loggedInUser !== '') {
  loggedInUser = loggedInUser.toLowerCase();

  username.value = loggedInUser;

  v$.value.$touch();
}

if (!v$.value.$invalid) {
  userStore.username = loggedInUser;

  let { redirect } = route.query;

  if (redirect) {
    redirect = atob(redirect);

    const resolved = router.resolve(redirect);

    if (resolved.name) {
      router.push(redirect);
    }
  }
}

const requestLogin = () => userStore.requestLogin(username.value);

const beforeOpen = () => {
  username.value = '';
};

const onClose = () => {
  username.value = '';

  v$.value.$reset();
};

onMounted(() => {
  emitter.on('login-awaiting', () => {
    btnBusy.value = true;
  });

  emitter.on('login-done', () => {
    btnBusy.value = false;

    vfm.close('loginModal');
  });
});

onBeforeUnmount(() => {
  emitter.off('login-awaiting');
  emitter.off('login-done');
});
</script>
