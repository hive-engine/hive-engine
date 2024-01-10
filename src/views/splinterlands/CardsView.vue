<template>
  <div class="page-header">
    <div class="mx-auto w-full max-w-7xl px-2 text-gray-200 sm:px-6 lg:px-8">
      <div class="grid min-h-[120px] items-center text-center md:grid-cols-4 md:text-left">
        <div class="col-span-full mt-3 md:col-span-2">
          <h1 class="text-4xl uppercase">@{{ route.params.account }}'s Collection</h1>
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

            <button
              v-if="cardStore.isLoggedIn && !cardStore.authorized"
              class="btn"
              @click="cardStore.requestAddAuthority"
            >
              Add Authority
            </button>

            <select v-model="filter" name="filter" class="max-w-[180px] border-gray-500 bg-slate-600">
              <option v-for="opt of filterOptions" :key="opt.key" :value="opt.key">
                {{ opt.label }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap justify-between gap-4 pb-5">
        <div class="text-center">
          <h2 class="mb-2 font-bold uppercase">Edition</h2>

          <div class="flex items-center gap-1 xl:gap-2">
            <label
              v-for="edition of [0, 1, 2, 3, 4, 5, 7, 8]"
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
          <h2 class="mb-2 font-bold uppercase">Foil</h2>

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
          <h2 class="mb-2 font-bold uppercase">Role</h2>

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
          <h2 class="mb-2 font-bold uppercase">Rarity</h2>

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
          <h2 class="mb-2 font-bold uppercase">Element</h2>

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
    <div v-if="groupedCollection.length > 0" class="mt-5 grid gap-6 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
      <div
        v-for="(card, idx) of groupedCollection"
        :key="idx"
        class="relative mx-auto max-w-[250px] cursor-pointer lg:min-h-[300px]"
        @click="vfm.open('collectionModal', card)"
      >
        <div v-if="card.cards > 1" class="absolute right-2 font-bold">
          <img src="https://d36mxiodymuqjm.cloudfront.net/website/qty-banner.png" class="w-[60px]" />
          <div class="absolute top-3 z-10 w-full text-center text-xl text-white">
            {{ card.cards }}
          </div>
        </div>
        <img v-lazy="getThumbByLevel(card)" :alt="card.name" class="w-full" height="300px" width="250px" />
      </div>
    </div>

    <div v-else class="mt-10 bg-black bg-opacity-10 px-6 py-10 text-center text-xl">
      No cards matches your selected filters!
    </div>
  </div>

  <Collection />
  <List />
  <ChangePrice />
</template>

<script setup>
import { useHead } from '@unhead/vue';
import { computed, onBeforeMount, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useVfm } from 'vue-final-modal';
import { useRoute } from 'vue-router';
import Edition from '@/components/sl/Edition.vue';
import Element from '@/components/sl/Element.vue';
import Foil from '@/components/sl/Foil.vue';
import ChangePrice from '@/components/sl/modals/ChangePrice.vue';
import Collection from '@/components/sl/modals/Collection.vue';
import List from '@/components/sl/modals/List.vue';
import Rarity from '@/components/sl/Rarity.vue';
import Role from '@/components/sl/Role.vue';
import { emitter } from '@/plugins/mitt';
import { useCardStore } from '@/stores/card';
import { useUserStore } from '@/stores/user';
import { getEdition, getElement, getThumbByLevel, sleep } from '@/utils';

useHead({
  title: 'Cards',
});

const vfm = useVfm();

const loading = ref(true);
const route = useRoute();

const cardStore = useCardStore();
const userStore = useUserStore();

const elementOrder = { Red: 1, Blue: 2, Green: 3, White: 4, Black: 5, Gold: 6, Gray: 7 };
const editions = ref([]);
const foils = ref([]);
const roles = ref([]);
const rarities = ref([]);
const elements = ref([]);

const filter = ref('rentable');
const filterOptions = [
  { key: 'all', label: 'All' },
  { key: 'rentable', label: 'Rentable' },
  { key: 'for_rent_he', label: 'For Rent (HE)' },
  { key: 'for_rent_sl', label: 'For Rent (SL)' },
  { key: 'for_sell_sl', label: 'For Sell (SL)' },
  { key: 'rented_out_he', label: 'Rented Out (HE)' },
  { key: 'rented_to_me_he', label: 'Rented To Me (HE)' },
];

const groupedCollection = computed(() => {
  const group = cardStore.cards
    .filter((c) => {
      if (filter.value === 'rentable') {
        return !c.cooldown && !c.delegated_to && !c.market_id;
      } else if (filter.value === 'for_rent_he') {
        return c.market_id && c.market_listing_type === 'HE_RENT';
      } else if (filter.value === 'for_rent_sl') {
        return c.market_id && c.market_listing_type === 'RENT';
      } else if (filter.value === 'for_sell_sl') {
        return c.market_id && c.market_listing_type === 'SELL';
      } else if (filter.value === 'rented_out_he') {
        return c.market_listing_type === 'HE_RENT' && c.player === cardStore.player && c.delegated_to;
      } else if (filter.value === 'rented_to_me_he') {
        return c.market_listing_type === 'HE_RENT' && c.delegated_to === cardStore.player;
      }

      return true;
    })
    .reduce((acc, cur) => {
      const { card_detail_id: id, edition, gold } = cur;

      const key = `${id}_${edition}_${gold}`;

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
          cards: 0,
          tier,
          type,
        };
      }

      acc[key].cards += 1;

      if (cur.level > acc[key].level) {
        acc[key].level = cur.level;
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

const onAddAuthority = async () => {
  loading.value = true;

  cardStore.authorized = true;

  await sleep(20 * 1000);

  await cardStore.fetchAuthorities();

  loading.value = false;
};

watch(
  () => cardStore.isLoggedIn,
  async (loggedIn) => {
    if (loggedIn) {
      await cardStore.fetchCollection(route.params.account);
    }
  },
);

onBeforeMount(async () => {
  loading.value = true;

  await cardStore.attemptAutologin();

  await cardStore.fetchCollection(route.params.account);

  loading.value = false;
});

onMounted(() => {
  emitter.on('add-authority-successful', onAddAuthority);
});

onBeforeUnmount(() => {
  emitter.off('add-authority-successful', onAddAuthority);
});
</script>
