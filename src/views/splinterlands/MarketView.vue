<template>
  <div class="page-header">
    <div class="w-full max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 text-gray-200">
      <div class="grid md:grid-cols-4 text-center md:text-left min-h-[120px] items-center">
        <div class="col-span-full md:col-span-1 mt-3">
          <h1 class="text-4xl uppercase">Rental Market</h1>
        </div>

        <div class="col-span-full md:col-span-3 mt-3">
          <div class="flex flex-wrap items-center justify-end gap-4">
            <select v-model="currency" name="currency" class="max-w-[200px]">
              <option v-for="symbol of cardStore.settings?.currencies" :key="symbol" :value="symbol">
                {{ symbol }}
              </option>
            </select>

            <button
              v-if="userStore.isLoggedIn && !cardStore.isLoggedIn"
              class="btn"
              @click="cardStore.logIntoSplinterlands"
            >
              Log Into Splinterlands
            </button>

            <button class="btn-sm relative" @click="$vfm.show('cartModal')">
              <div
                class="absolute text-lg text-center leading-4 -top-2 -right-1 bg-white text-red-600 rounded-full p-1"
              >
                {{ cardStore.cart.length }}
              </div>
              <ShoppingBagIcon class="h-7 w-7" />
            </button>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap justify-between gap-4 pb-5">
        <div class="text-center">
          <h2 class="mb-2 uppercase font-bold">Edition</h2>

          <div class="flex items-center gap-1 xl:gap-2">
            <label
              v-for="edition of [0, 1, 2, 3, 4, 5, 7]"
              :key="edition"
              v-tooltip="getEdition(edition)"
              class="cursor-pointer"
            >
              <input v-model="editions" class="peer hidden" type="checkbox" :value="edition" />
              <Edition
                class="h-8 w-8 peer-checked:border-orange-200 peer-checked:bg-orange-800 peer-checked:text-white"
                :edition="edition"
              />
            </label>
          </div>
        </div>

        <div class="text-center">
          <h2 class="mb-2 uppercase font-bold">Foil</h2>

          <div class="flex items-center gap-1 xl:gap-2">
            <label v-tooltip="'Regular'" class="cursor-pointer">
              <input v-model="foils" class="peer hidden" type="checkbox" :value="false" />
              <Foil
                class="h-8 w-8 peer-checked:border-sky-200 peer-checked:bg-sky-900 peer-checked:text-white"
                :gold="false"
              />
            </label>

            <label v-tooltip="'Gold'" class="cursor-pointer">
              <input v-model="foils" class="peer hidden" type="checkbox" :value="true" />
              <Foil
                class="h-8 w-8 peer-checked:border-yellow-200 peer-checked:bg-yellow-900 peer-checked:text-white"
                :gold="true"
              />
            </label>
          </div>
        </div>

        <div class="text-center">
          <h2 class="mb-2 uppercase font-bold">Role</h2>

          <div class="flex items-center gap-1 xl:gap-2">
            <label v-tooltip="'Monster'" class="cursor-pointer">
              <input v-model="roles" class="peer hidden" type="checkbox" value="Monster" />
              <Role class="h-8 w-8 peer-checked:border-yellow-200 peer-checked:bg-yellow-900 peer-checked:text-white" />
            </label>

            <label v-tooltip="'Summoner'" class="cursor-pointer">
              <input v-model="roles" class="peer hidden" type="checkbox" value="Summoner" />
              <Role
                class="h-8 w-8 peer-checked:border-yellow-200 peer-checked:bg-yellow-900 peer-checked:text-white"
                type="Summoner"
              />
            </label>
          </div>
        </div>

        <div class="text-center">
          <h2 class="mb-2 uppercase font-bold">Rarity</h2>

          <div class="flex items-center gap-1 xl:gap-2">
            <label v-tooltip="'Common'" class="cursor-pointer">
              <input v-model="rarities" class="peer hidden" type="checkbox" :value="1" />
              <Rarity
                class="h-8 w-8 peer-checked:border-yellow-200 peer-checked:bg-yellow-900 peer-checked:text-white"
                :rarity="1"
              />
            </label>

            <label v-tooltip="'Rare'" class="cursor-pointer">
              <input v-model="rarities" class="peer hidden" type="checkbox" :value="2" />
              <Rarity
                class="h-8 w-8 peer-checked:border-yellow-200 peer-checked:bg-yellow-900 peer-checked:text-white"
                :rarity="2"
              />
            </label>

            <label v-tooltip="'Epic'" class="cursor-pointer">
              <input v-model="rarities" class="peer hidden" type="checkbox" :value="3" />
              <Rarity
                class="h-8 w-8 peer-checked:border-yellow-200 peer-checked:bg-yellow-900 peer-checked:text-white"
                :rarity="3"
              />
            </label>

            <label v-tooltip="'Legendary'" class="cursor-pointer">
              <input v-model="rarities" class="peer hidden" type="checkbox" :value="4" />
              <Rarity
                class="h-8 w-8 peer-checked:border-yellow-200 peer-checked:bg-yellow-900 peer-checked:text-white"
                :rarity="4"
              />
            </label>
          </div>
        </div>

        <div class="text-center">
          <h2 class="mb-2 uppercase font-bold">Element</h2>

          <div class="flex items-center gap-1 xl:gap-2">
            <label
              v-for="color of Object.keys(elementOrder)"
              :key="color"
              v-tooltip="getElement(color)"
              class="cursor-pointer"
            >
              <input v-model="elements" class="peer hidden" type="checkbox" :value="color" />
              <Element
                class="h-8 w-8 peer-checked:border-amber-200 peer-checked:bg-amber-900 peer-checked:text-white"
                :color="color"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>

  <Loading v-if="loading" />

  <div v-else class="page-content pt-3">
    <div class="grid sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6 mt-5">
      <div
        v-for="(card, idx) of groupedCollection"
        :key="idx"
        class="cursor-pointer relative mx-auto max-w-[250px] lg:min-h-[300px]"
        @click="$vfm.show('rentalModal', { ...card, currency })"
      >
        <div v-if="card.cards > 1" class="absolute right-2 font-bold">
          <img src="https://d36mxiodymuqjm.cloudfront.net/website/qty-banner.png" class="w-[60px]" />
          <div class="z-10 absolute top-3 text-center w-full text-xl text-white">
            {{ card.cards }}
          </div>
        </div>
        <img :src="getThumbByLevel(card)" :alt="card.name" class="w-full" height="300px" width="250px" />
      </div>
    </div>
  </div>

  <Rent />
  <Cart />
</template>

<script setup>
import { computed, onBeforeMount, ref, watch } from 'vue';
import { ShoppingBagIcon } from '@heroicons/vue/24/outline';
import { useCardStore } from '@/stores/card';
import { useUserStore } from '@/stores/user';
import { getEdition, getElement, getThumbByLevel } from '@/utils';
import Edition from '@/components/sl/Edition.vue';
import Element from '@/components/sl/Element.vue';
import Foil from '@/components/sl/Foil.vue';
import Rarity from '@/components/sl/Rarity.vue';
import Role from '@/components/sl/Role.vue';
import Rent from '@/components/sl/modals/Rent.vue';
import Cart from '@/components/sl/modals/Cart.vue';

const loading = ref(false);

const cardStore = useCardStore();
const userStore = useUserStore();

const elementOrder = { Red: 1, Blue: 2, Green: 3, White: 4, Black: 5, Gold: 6, Gray: 7 };
const editions = ref([]);
const foils = ref([]);
const roles = ref([]);
const rarities = ref([]);
const elements = ref([]);
const currency = ref('SWAP.HIVE');

const groupedCollection = computed(() => {
  const group = cardStore.rentals.reduce((acc, cur) => {
    const { card_detail_id: id, edition, gold, currency, qty } = cur;

    const key = `${id}_${edition}_${gold}_${currency}`;

    if (!acc[key]) {
      const { name, type, color, rarity, tier } = cardStore.details.get(cur.card_detail_id);

      acc[key] = {
        name,
        color,
        rarity,
        card_detail_id: id,
        edition,
        gold,
        level: 1,
        cards: qty,
        tier,
        type,
      };
    }

    return acc;
  }, {});

  let cards = Object.values(group);

  if (elements.value.length > 0) {
    cards = cards.filter((c) => elements.value.includes(c.color));
  }

  if (rarities.value.length > 0) {
    cards = cards.filter((c) => rarities.value.includes(c.rarity));
  }

  if (foils.value.length > 0) {
    cards = cards.filter((c) => foils.value.includes(c.gold));
  } else {
    cards = cards.filter((c) => !c.gold);
  }

  if (roles.value.length > 0) {
    cards = cards.filter((c) => roles.value.includes(c.type));
  }

  if (editions.value.length > 0) {
    cards = cards.filter((c) => editions.value.includes(Number(c.edition)));
  }

  return cards
    .sort((a, b) => a.edition - b.edition || a.card_detail_id - b.card_detail_id || Number(a.gold) - Number(b.gold))
    .sort((a, b) => elementOrder[a.color] - elementOrder[b.color]);
});

onBeforeMount(async () => {
  loading.value = true;

  await cardStore.attemptAutologin();

  await cardStore.fetchForRentGrouped(currency.value);

  loading.value = false;
});

watch(currency, async () => {
  await cardStore.fetchForRentGrouped(currency.value);
});
</script>
