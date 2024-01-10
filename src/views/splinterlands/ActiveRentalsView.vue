<template>
  <div class="page-header">
    <div class="mx-auto w-full max-w-7xl px-2 text-gray-200 sm:px-6 lg:px-8">
      <div class="grid min-h-[120px] items-center text-center md:grid-cols-4 md:text-left">
        <div class="col-span-full mt-3 md:col-span-2">
          <h1 class="text-4xl uppercase">@{{ $route.params.account }}'s Rentals</h1>
        </div>

        <div class="col-span-full mt-3 md:col-span-2">
          <div class="flex flex-wrap items-center justify-end gap-4">
            <button
              v-if="userStore.isLoggedIn && !cardStore.isLoggedIn"
              class="btn"
              @click="cardStore.logIntoSplinterlands"
            >
              Log Into Splinterlands
            </button>

            <button v-if="cardStore.isLoggedIn" class="btn self-stretch" @click="vfm.open('heslWalletModal')">
              Wallet
            </button>

            <button class="btn-sm relative self-stretch" @click="vfm.open('cartModal')">
              <div
                class="absolute -right-1 -top-2 rounded-full bg-white p-1 text-center text-lg leading-4 text-red-600"
              >
                {{ cardStore.cart.length }}
              </div>
              <ShoppingBagIcon class="h-7 w-7" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <Loading v-if="loading" />

  <div v-else class="page-content pt-3">
    <CustomTable :items="cardStore.active_rentals" :fields="tableFields">
      <template #cell(name)="{ item }">
        <div :class="{ 'text-yellow-500': item.gold }">{{ item.name }}</div>
        <div class="text-xs">{{ item.uid }}</div>

        <div class="mt-1 flex flex-wrap items-center gap-2">
          <Edition v-tooltip="getEdition(item.edition)" :edition="item.edition" class="h-7 w-7 cursor-pointer p-0.5" />

          <Element v-tooltip="getElement(item.color)" :color="item.color" class="h-7 w-7 cursor-pointer p-0.5" />

          <Rarity v-tooltip="getRarity(item.rarity)" :rarity="item.rarity" class="h-7 w-7 cursor-pointer p-0.5" />
        </div>
      </template>

      <template #cell(price)="{ item }">
        <div>{{ item.escrow_amount }} {{ item.currency }}</div>
        <div class="text-xs">{{ item.price }} {{ item.currency }}/day</div>
      </template>

      <template #cell(remaining)="{ item }">
        {{ item.remaining }}
      </template>

      <template #cell(actions)="{ item }">
        <AddToCart :card="item" />
      </template>
    </CustomTable>
  </div>

  <Wallet />
  <Cart />
</template>

<script setup>
import { ShoppingBagIcon } from '@heroicons/vue/24/outline';
import { useHead } from '@unhead/vue';
import { onBeforeMount, ref } from 'vue';
import { useVfm } from 'vue-final-modal';
import { useRoute } from 'vue-router';
import AddToCart from '@/components/sl/buttons/AddToCart.vue';
import Edition from '@/components/sl/Edition.vue';
import Element from '@/components/sl/Element.vue';
import Cart from '@/components/sl/modals/Cart.vue';
import Wallet from '@/components/sl/modals/Wallet.vue';
import Rarity from '@/components/sl/Rarity.vue';
import CustomTable from '@/components/utilities/CustomTable.vue';
import { useCardStore } from '@/stores/card';
import { useUserStore } from '@/stores/user';
import { getEdition, getElement, getRarity } from '@/utils';

useHead({
  title: 'Active Rentals',
});

const vfm = useVfm();

const loading = ref(true);
const route = useRoute();

const cardStore = useCardStore();
const userStore = useUserStore();

const tableFields = [
  { key: 'name', label: 'Card' },
  { key: 'level', label: 'Level', sortable: true },
  { key: 'bcx', label: 'BCX', sortable: true },
  { key: 'seller', label: 'Owner' },
  { key: 'price', label: 'Payment', sortable: true },
  { key: 'remaining', label: 'Remaining' },
  { key: 'actions', label: '' },
];

onBeforeMount(async () => {
  loading.value = true;

  await cardStore.attemptAutologin();

  await cardStore.fetchActiveRentals(route.params.account);

  loading.value = false;
});
</script>
