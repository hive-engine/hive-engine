<template>
  <Modal
    v-model="show"
    size="xl"
    name="collectionModal"
    body-class="px-6 py-3"
    @before-open="onBeforeOpen"
    @closed="onClosed"
  >
    <template #title="{ params }">{{ params.name }}</template>

    <template #default="{ params }">
      <LoadingOverlay :show="showOverlay">
        <div class="mb-5 flex flex-wrap items-center justify-between">
          <div v-if="card.edition && card.color" class="flex flex-wrap gap-2 font-bold">
            <div class="flex items-center justify-center gap-2">
              <Edition class="h-6 w-6" :edition="card.edition" /> {{ getEdition(card.edition) }}
            </div>

            <div class="flex items-center justify-center gap-2">
              <Element class="h-6 w-6" :color="card.color" /> {{ getElement(card.color) }}
            </div>

            <div class="flex items-center justify-center gap-2">
              <Rarity class="h-6 w-6" :rarity="card.rarity" /> {{ getRarity(card.rarity) }}
            </div>

            <div class="flex items-center justify-center gap-2">
              <Foil class="h-6 w-6" :gold="card.gold" /> {{ card.gold ? 'Gold' : 'Regular' }}
            </div>
          </div>

          <button
            v-if="userStore.isLoggedIn && !cardStore.isLoggedIn"
            class="btn"
            @click="cardStore.logIntoSplinterlands"
          >
            Log Into Splinterlands
          </button>

          <div v-else-if="cardStore.authorized" class="flex flex-wrap items-center justify-end gap-2">
            <button
              v-tooltip="'List for rent'"
              :disabled="cardStore.player !== userStore.username || cardStore.listable.length <= 0"
              class="btn-sm"
              @click="vfm.open('listCards')"
            >
              <BuildingStorefrontIcon class="h-5 w-5" />
            </button>

            <button
              v-tooltip="'Cancel listing'"
              :disabled="cardStore.player !== userStore.username || cardStore.cancellable.length <= 0"
              class="btn-sm"
              @click="cardStore.requestCancelListing"
            >
              <XCircleIcon class="h-5 w-5" />
            </button>

            <button
              v-tooltip="'Change Price'"
              :disabled="
                cardStore.player !== userStore.username ||
                cardStore.cancellable.length <= 0 ||
                !cardStore.changeable.every((c, i, arr) => c.currency === arr[0].currency)
              "
              class="btn-sm"
              @click="vfm.open('changePriceModal')"
            >
              <CurrencyDollarIcon class="h-5 w-5" />
            </button>

            <button
              v-tooltip="'Undelegate'"
              :disabled="cardStore.player !== userStore.username || cardStore.undelegatable.length <= 0"
              class="btn-sm"
              @click="cardStore.requestUndelegateCards"
            >
              <ArrowUturnDownIcon class="h-5 w-5" />
            </button>
          </div>

          <button
            v-else-if="cardStore.isLoggedIn && !cardStore.authorized"
            class="btn"
            @click="cardStore.requestAddAuthority"
          >
            Add Authority
          </button>
        </div>

        <CustomTable :key="key" :items="cards" :fields="fields" :per-page="12">
          <template #cell(checkbox)="{ item }">
            <input
              v-model="selectedUids"
              :name="item.uid"
              type="checkbox"
              :value="item.uid"
              @click="onChecked($event, { name: params.name, ...item })"
            />
          </template>

          <template #cell(uid)="{ item }">
            {{ item.uid }}
            <ClockIcon
              v-if="item.cooldown"
              v-tooltip="item.cooldown"
              class="inline h-5 w-5 align-text-top text-orange-500"
            />
          </template>

          <template #cell(last_used_date)="{ item }">
            {{ new Date(item.last_used_date).toLocaleString() }}
          </template>

          <template #cell(buy_price)="{ item }">
            <template v-if="item.market_listing_type === 'SELL' || item.market_listing_type === 'RENT'">
              {{ item.market_listing_type === 'RENT' ? `${item.buy_price} DEC/Day` : `$${item.buy_price}` }}
            </template>

            <template v-else-if="item.market_listing_type === 'HE_RENT'">
              {{ item.buy_price }} {{ item.currency }}/Day
            </template>

            <template v-else>N/A</template>
          </template>

          <template #cell(delegated)="{ item }">
            <template v-if="item.delegated_to">{{ item.delegated_to }}</template>

            <template v-else>N/A</template>
          </template>
        </CustomTable>
      </LoadingOverlay>
    </template>
  </Modal>
</template>

<script setup>
import {
  ArrowUturnDownIcon,
  BuildingStorefrontIcon,
  ClockIcon,
  XCircleIcon,
  CurrencyDollarIcon,
} from '@heroicons/vue/24/outline';
import { inject, onBeforeUnmount, onMounted, ref } from 'vue';
import { useVfm } from 'vue-final-modal';
import Modal from '@/components/modals/Modal.vue';
import Edition from '@/components/sl/Edition.vue';
import Element from '@/components/sl/Element.vue';
import Foil from '@/components/sl/Foil.vue';
import Rarity from '@/components/sl/Rarity.vue';
import CustomTable from '@/components/utilities/CustomTable.vue';
import LoadingOverlay from '@/components/utilities/LoadingOverlay.vue';
import { useCardStore } from '@/stores/card';
import { useUserStore } from '@/stores/user';
import { getEdition, getElement, getRarity } from '@/utils';

const vfm = useVfm();

const cardStore = useCardStore();
const userStore = useUserStore();

const show = ref(false);
const showOverlay = ref(true);
const event = inject('eventBus');

const cards = ref([]);
const selectedCards = ref(new Map());
const selectedUids = ref([]);

const fields = [
  { key: 'checkbox', label: '' },
  { key: 'uid', label: 'Card' },
  { key: 'level', label: 'Level', sortable: true },
  { key: 'bcx', label: 'BCX', sortable: true },
  { key: 'last_used_date', label: 'Last Played' },
  { key: 'power', label: 'Collection Power' },
  { key: 'player', label: 'Owner' },
  { key: 'delegated', label: 'Delegated To' },
  { key: 'buy_price', label: 'Price', sortable: true },
];

const key = ref('');
const card = ref({
  edition: null,
  color: null,
  rarity: null,
  gold: null,
});

const onBeforeOpen = (e) => {
  showOverlay.value = true;

  const { card_detail_id: id, edition, gold } = e.ref.params.value;

  key.value = `${id}_${edition}_${gold}`;

  const { color, rarity } = cardStore.details.get(id);

  card.value = {
    edition,
    color,
    rarity,
    gold,
  };

  cards.value = cardStore.cards.filter((c) => c.card_detail_id === id && c.edition === edition && c.gold === gold);

  showOverlay.value = false;
};

const onClosed = () => {
  cards.value = [];
  selectedCards.value.clear();
};

const onChecked = async (event, value) => {
  if (!selectedCards.value.has(value.uid)) {
    if (event.shiftKey && selectedCards.value.size > 0) {
      const lastItem = Array.from(selectedCards.value.values()).pop();

      const lastIndex = cards.value.findIndex((c) => c.uid === lastItem.uid);

      const currentIndex = cards.value.findIndex((c) => c.uid === value.uid);

      const start = lastIndex > currentIndex ? currentIndex : lastIndex + 1;
      const end = lastIndex > currentIndex ? lastIndex : currentIndex + 1;

      cards.value.slice(start, end).forEach((v) => {
        selectedCards.value.set(v.uid, v);
      });
    } else {
      selectedCards.value.set(value.uid, value);
    }
  } else {
    if (event.shiftKey && selectedCards.value.size > 0) {
      const lastItem = Array.from(selectedCards.value.values()).pop();

      const lastIndex = cards.value.findIndex((c) => c.uid === lastItem.uid);
      const currentIndex = cards.value.findIndex((c) => c.uid === value.uid);

      const start = lastIndex > currentIndex ? currentIndex : lastIndex + 1;
      const end = lastIndex > currentIndex ? lastIndex + 1 : currentIndex + 1;

      cards.value.slice(start, end).forEach((v) => {
        selectedCards.value.delete(v.uid);
      });
    } else {
      selectedCards.value.delete(value.uid);
    }
  }

  selectedUids.value = Array.from(selectedCards.value.keys());
  cardStore.selectedCards = Array.from(selectedCards.value.values());
};

const onUpdateCards = () => {
  selectedCards.value.clear();
};

const onUnlistSuccessful = ({ eventData }) => {
  eventData.forEach((id) => {
    const index = cardStore.cards.findIndex((c) => c.market_id === id);

    cardStore.cards[index].market_id = null;
    cardStore.cards[index].market_listing_type = null;
  });

  event.emit('update-cards-successful');
};

const onUndelegationSuccessful = ({ eventData }) => {
  eventData.forEach((uid) => {
    const index = cardStore.cards.findIndex((c) => c.uid === uid);

    cardStore.cards[index].delegated_to = null;
  });
};

onMounted(() => {
  event.on('update-cards-successful', onUpdateCards);
  event.on('cancel-cards-successful', onUnlistSuccessful);
  event.on('undelegate-cards-successful', onUndelegationSuccessful);
});

onBeforeUnmount(() => {
  event.off('update-cards-successful', onUpdateCards);
  event.off('cancel-cards-successful', onUnlistSuccessful);
  event.off('undelegate-cards-successful', onUndelegationSuccessful);
});
</script>
