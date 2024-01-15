<template>
  <Disclosure v-slot="{ open }" as="nav">
    <div class="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
      <div class="relative flex h-16 items-center justify-between">
        <div class="absolute inset-y-0 left-0 flex items-center lg:hidden">
          <DisclosureButton
            class="inline-flex items-center justify-center rounded-md p-2 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
          >
            <span class="sr-only">Open main menu</span>
            <Bars3Icon v-if="!open" class="block h-6 w-6" aria-hidden="true" />
            <XMarkIcon v-else class="block h-6 w-6" aria-hidden="true" />
          </DisclosureButton>
        </div>

        <div class="flex flex-1 items-center justify-center lg:items-stretch lg:justify-start">
          <div class="flex flex-shrink-0 items-center">
            <router-link :to="{ name: 'home' }">
              <img
                class="h-7 w-auto lg:h-8"
                :src="`/images/${isDark ? 'logo-large-dark.png' : 'logo-large.png'}`"
                alt="Hive-Engine Logo"
              />
            </router-link>

            <button class="ml-5 p-1" @click.prevent="toggleDark()">
              <sun-icon v-if="isDark" class="h-6 w-6" />
              <moon-icon v-else class="h-6 w-6" />
            </button>
          </div>

          <div class="hidden lg:ml-auto lg:block">
            <div class="flex lg:space-x-4">
              <!-- <a
                class="px-3 py-2 font-bold text-gray-700 rounded-md cursor-pointer hover:bg-gray-700 hover:text-white dark:text-gray-300"
                @click="openBuyCryptoModal"
                >Buy Crypto</a
              > -->

              <router-link
                :to="{ name: 'trade', params: { symbol: 'BEE' } }"
                class="rounded-md px-3 py-2 font-bold text-gray-700 hover:bg-gray-700 hover:text-white dark:text-gray-300"
                active-class="text-white bg-gray-700"
                >Market</router-link
              >
              <a
                v-if="isLoggedIn"
                class="cursor-pointer rounded-md px-3 py-2 font-bold text-gray-700 hover:bg-gray-700 hover:text-white dark:text-gray-300"
                @click="openSwapModal"
                >Swap</a
              >
              <!-- <router-link
                v-if="isLoggedIn"
                :to="{ name: 'sl-market' }"
                class="px-3 py-2 font-bold text-gray-700 rounded-md dark:text-gray-300 hover:bg-gray-700 hover:text-white"
                active-class="text-white bg-gray-700"
                >Rentals</router-link
              > -->
              <router-link
                :to="{ name: 'lease' }"
                class="rounded-md px-3 py-2 font-bold text-gray-700 hover:bg-gray-700 hover:text-white dark:text-gray-300"
                active-class="text-white bg-gray-700"
                >Lease</router-link
              >

              <Menu as="div" class="relative">
                <MenuButton
                  class="rounded-md px-3 py-2 font-bold text-gray-700 hover:bg-gray-700 hover:text-white dark:text-gray-300"
                  >More <ChevronDownIcon class="-mr-1 inline h-5 w-5" aria-hidden="true"
                /></MenuButton>

                <MenuItems
                  class="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                >
                  <MenuItem v-slot="{ active }">
                    <router-link
                      :to="{ name: 'tokens' }"
                      :class="[active ? 'bg-gray-100' : '', 'block px-4 py-2 text-gray-700']"
                      active-class="text-white bg-gray-700 hover:bg-gray-700"
                      >Tokens</router-link
                    >
                  </MenuItem>

                  <MenuItem v-slot="{ active }">
                    <router-link
                      :to="{ name: 'faq' }"
                      :class="[active ? 'bg-gray-100' : '', 'block px-4 py-2 text-gray-700']"
                      active-class="text-white bg-gray-700 hover:bg-gray-700"
                      >FAQ</router-link
                    >
                  </MenuItem>

                  <MenuItem v-slot="{ active }">
                    <a
                      href="https://he.dtools.dev"
                      target="_blank"
                      :class="[active ? 'bg-gray-100' : '', 'block px-4 py-2 text-gray-700']"
                      active-class="text-white bg-gray-700 hover:bg-gray-700"
                      >Explorer</a
                    >
                  </MenuItem>
                </MenuItems>
              </Menu>

              <router-link
                v-if="isLoggedIn"
                :to="{ name: 'wallet', params: { account: username } }"
                class="rounded-md px-3 py-2 font-bold text-gray-700 hover:bg-gray-700 hover:text-white dark:text-gray-300"
                active-class="text-white bg-gray-700"
                >Wallet</router-link
              >
            </div>
          </div>
        </div>

        <div class="absolute inset-y-0 right-0 flex items-center md:static md:inset-auto md:ml-1 lg:ml-4 lg:pr-0">
          <Menu v-if="isLoggedIn" as="div" class="relative">
            <MenuButton
              class="flex rounded-full border-2 border-gray-700 bg-gray-800 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
            >
              <img
                class="h-8 w-8 rounded-full border-2 bg-white"
                :src="`https://images.hive.blog/u/${username}/avatar`"
              />
            </MenuButton>

            <transition
              enter-active-class="transition duration-100 ease-out"
              enter-from-class="opacity-0 transform scale-95"
              enter-to-class="opacity-100 transform scale-100"
              leave-active-class="transition duration-75 ease-in"
              leave-from-class="opacity-100 transform scale-100"
              leave-to-class="opacity-0 transform scale-95"
            >
              <MenuItems
                class="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
              >
                <MenuItem>
                  <div class="block border-b px-4 py-2 font-bold text-gray-700">@{{ username }}</div>
                </MenuItem>

                <MenuItem v-slot="{ active }">
                  <a
                    href="#"
                    :class="[active ? 'bg-gray-100' : '', 'block px-4 py-2 text-gray-700']"
                    active-class="text-white bg-gray-700 hover:bg-gray-700"
                    @click="openAccountsModal"
                    >Switch Accounts</a
                  >
                </MenuItem>

                <MenuItem v-slot="{ active }">
                  <router-link
                    :to="{ name: 'rewards' }"
                    :class="[active ? 'bg-gray-100' : '', 'block px-4 py-2 text-gray-700']"
                    active-class="text-white bg-gray-700 hover:bg-gray-700"
                    >Rewards</router-link
                  >
                </MenuItem>

                <MenuItem v-slot="{ active }">
                  <router-link
                    :to="{ name: 'orders' }"
                    :class="[active ? 'bg-gray-100' : '', 'block px-4 py-2 text-gray-700']"
                    active-class="text-white bg-gray-700 hover:bg-gray-700"
                    >Open Orders</router-link
                  >
                </MenuItem>

                <MenuItem v-slot="{ active }">
                  <router-link
                    :to="{ name: 'swaps' }"
                    :class="[active ? 'bg-gray-100' : '', 'block px-4 py-2 text-gray-700']"
                    active-class="text-white bg-gray-700 hover:bg-gray-700"
                    >Swaps</router-link
                  >
                </MenuItem>

                <MenuItem v-slot="{ active }">
                  <router-link
                    :to="{ name: 'conversion-history' }"
                    :class="[active ? 'bg-gray-100' : '', 'block px-4 py-2 text-gray-700']"
                    active-class="text-white bg-gray-700 hover:bg-gray-700"
                    >Conversion History</router-link
                  >
                </MenuItem>

                <!-- <MenuItem v-slot="{ active }">
                  <router-link
                    :to="{ name: 'sl-cards', params: { account: userStore.username } }"
                    :class="[active ? 'bg-gray-100' : '', 'block px-4 py-2 text-gray-700']"
                    active-class="text-white bg-gray-700 hover:bg-gray-700"
                    >Splinterlands Cards</router-link
                  >
                </MenuItem>

                <MenuItem v-slot="{ active }">
                  <router-link
                    :to="{ name: 'sl-active-rentals', params: { account: userStore.username } }"
                    :class="[active ? 'bg-gray-100' : '', 'block px-4 py-2 text-gray-700']"
                    active-class="text-white bg-gray-700 hover:bg-gray-700"
                    >Active Rentals</router-link
                  >
                </MenuItem> -->

                <MenuItem v-slot="{ active }">
                  <router-link
                    :to="{ name: 'leasing-dashboard', params: { account: userStore.username } }"
                    :class="[active ? 'bg-gray-100' : '', 'block px-4 py-2 text-gray-700']"
                    active-class="text-white bg-gray-700 hover:bg-gray-700"
                    >Leasing Dashboard</router-link
                  >
                </MenuItem>

                <MenuItem v-slot="{ active }">
                  <a
                    href="#"
                    :class="[active ? 'bg-gray-100' : '', 'block px-4 py-2 text-gray-700']"
                    @click.prevent="userStore.requestLogout"
                    >Logout</a
                  >
                </MenuItem>
              </MenuItems>
            </transition>
          </Menu>

          <a
            v-else
            class="cursor-pointer rounded-md px-3 py-2 font-bold text-gray-700 hover:bg-gray-700 hover:text-white dark:text-gray-300"
            @click="vfm.open('loginModal')"
            >Login</a
          >
        </div>
      </div>
    </div>

    <DisclosurePanel class="lg:hidden">
      <div class="space-y-1 px-2 pb-3 pt-2">
        <!-- <DisclosureButton class="w-full text-left">
          <a
            class="block px-3 py-2 font-bold text-gray-700 rounded-md cursor-pointer dark:text-gray-300 hover:bg-gray-700 hover:text-white"
            @click="openBuyCryptoModal"
            >Buy Crypto</a
          >
        </DisclosureButton> -->

        <DisclosureButton class="w-full text-left">
          <router-link
            :to="{ name: 'tokens' }"
            class="block rounded-md px-3 py-2 font-bold text-gray-700 hover:bg-gray-700 hover:text-white dark:text-gray-300"
            active-class="text-white bg-gray-700"
            >Tokens</router-link
          >
        </DisclosureButton>

        <DisclosureButton class="w-full text-left">
          <router-link
            :to="{ name: 'trade', params: { symbol: 'BEE' } }"
            class="block rounded-md px-3 py-2 font-bold text-gray-700 hover:bg-gray-700 hover:text-white dark:text-gray-300"
            active-class="text-white bg-gray-700"
            >Market</router-link
          >
        </DisclosureButton>

        <DisclosureButton v-if="isLoggedIn" class="w-full text-left">
          <a
            class="block cursor-pointer rounded-md px-3 py-2 font-bold text-gray-700 hover:bg-gray-700 hover:text-white dark:text-gray-300"
            @click="vfm.open('swapModal')"
            >Swap</a
          >
        </DisclosureButton>

        <!-- <DisclosureButton class="w-full text-left">
          <router-link
            :to="{ name: 'sl-market' }"
            class="block px-3 py-2 font-bold text-gray-700 rounded-md dark:text-gray-300 hover:bg-gray-700 hover:text-white"
            active-class="text-white bg-gray-700"
            >Rentals</router-link
          >
        </DisclosureButton> -->

        <DisclosureButton class="w-full text-left">
          <router-link
            :to="{ name: 'lease' }"
            class="block rounded-md px-3 py-2 font-bold text-gray-700 hover:bg-gray-700 hover:text-white dark:text-gray-300"
            active-class="text-white bg-gray-700"
            >Lease</router-link
          >
        </DisclosureButton>

        <DisclosureButton class="w-full text-left">
          <router-link
            :to="{ name: 'faq' }"
            class="block rounded-md px-3 py-2 font-bold text-gray-700 hover:bg-gray-700 hover:text-white dark:text-gray-300"
            active-class="text-white bg-gray-700"
            >FAQ</router-link
          >
        </DisclosureButton>

        <DisclosureButton class="w-full text-left">
          <a
            href="https://he.dtools.dev"
            target="_blank"
            class="block rounded-md px-3 py-2 font-bold text-gray-700 hover:bg-gray-700 hover:text-white dark:text-gray-300"
            active-class="text-white bg-gray-700"
            >Explorer</a
          >
        </DisclosureButton>

        <DisclosureButton v-if="isLoggedIn" class="w-full text-left">
          <router-link
            :to="{ name: 'wallet', params: { account: username } }"
            class="block rounded-md px-3 py-2 font-bold text-gray-700 hover:bg-gray-700 hover:text-white dark:text-gray-300"
            active-class="text-white bg-gray-700"
            >Wallet</router-link
          >
        </DisclosureButton>
      </div>
    </DisclosurePanel>
  </Disclosure>

  <Loading v-if="store.loading" />

  <template v-else>
    <RouterView :key="route.fullPath" />

    <LoginModal />

    <Keychain />

    <notifications :duration="15000" />

    <button class="btn fixed bottom-16 right-3 !border-gray-300 px-1 py-1" @click="openHiveEngineRPCModal">
      <CogIcon class="h-8 w-8" />
    </button>
  </template>

  <ModalsContainer />
</template>

<script setup>
import { Disclosure, DisclosureButton, DisclosurePanel, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue';
import { Bars3Icon, MoonIcon, SunIcon, XMarkIcon, ChevronDownIcon, CogIcon } from '@heroicons/vue/24/outline';
import { useHead } from '@unhead/vue';
import { useDark, useToggle } from '@vueuse/core';
import { computed, defineAsyncComponent, onMounted } from 'vue';
import { useVfm, ModalsContainer, useModal } from 'vue-final-modal';
import { RouterLink, RouterView, useRoute } from 'vue-router';
import Keychain from '@/components/modals/Keychain.vue';
import LoginModal from '@/components/modals/Login.vue';
import Loading from '@/components/utilities/Loading.vue';
import { useStore } from '@/stores';
import { useUserStore } from '@/stores/user';

const HiveEngineRPCModal = defineAsyncComponent(() => import('@/components/modals/HiveEngineRPC.vue'));
const SwapModal = defineAsyncComponent(() => import('@/components/modals/Swap.vue'));
const AccountsModal = defineAsyncComponent(() => import('@/components/modals/Accounts.vue'));
// const BuyCryptoModal = defineAsyncComponent(() => import('@/components/modals/BuyCrypto.vue'));

useHead({
  titleTemplate: (title) => (title ? `${title} - Hive-Engine` : 'Hive-Engine - Smart Contracts on the Hive Blockchain'),
});

const route = useRoute();

const vfm = useVfm();

const isDark = useDark();
const toggleDark = useToggle(isDark);

const store = useStore();
const userStore = useUserStore();

const username = computed(() => userStore.username);
const isLoggedIn = computed(() => userStore.isLoggedIn);

const fetchHivePrice = async () => {
  await store.fetchHivePrice();

  setTimeout(fetchHivePrice, 10 * 60 * 1000);
};

const openHiveEngineRPCModal = async () => {
  const { open } = useModal({ component: HiveEngineRPCModal });

  await open();
};

const openSwapModal = async () => {
  const { open } = useModal({ component: SwapModal });

  await open();
};

const openAccountsModal = async () => {
  const { open } = useModal({ component: AccountsModal });

  await open();
};

// const openBuyCryptoModal = async () => {
//   const { open } = useModal({ component: BuyCryptoModal });

//   await open();
// };

onMounted(async () => {
  await fetchHivePrice();
});
</script>
