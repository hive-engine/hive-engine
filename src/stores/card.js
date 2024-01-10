import axios from 'axios';
import { addDays, formatDistance, parseISO } from 'date-fns';
import { acceptHMRUpdate, defineStore } from 'pinia';
import { HESL_API, SL_API } from '@/config';
import { useUserStore } from '@/stores/user';
import { getCardBcx, getCardCooldown, getCardLevel, getCardPower, groupBy, toFixedNoRounding } from '@/utils';
import { useStore } from '.';

export const slApi = axios.create({
  baseURL: SL_API,
});

export const heslApi = axios.create({
  baseURL: HESL_API,
});

export const useCardStore = defineStore({
  id: 'card',

  state: () => ({
    player: null,
    authorized: false,
    settings: null,
    cart: [],
    sl_settings: null,
    details: new Map(),
    cards: [],
    rentals: [],
    selectedCards: [],
    for_rent: [],
    token: null,
    balances: new Map(),
    active_rentals: [],
  }),

  getters: {
    isLoggedIn: (state) => Boolean(state.player),

    listable(state) {
      return state.selectedCards.filter((c) => !c.cooldown && !c.delegated_to && !c.market_id);
    },

    undelegatable(state) {
      return state.selectedCards.filter((c) => c.player === this.player && c.delegated_to);
    },

    cancellable(state) {
      return state.selectedCards.filter((c) => c.market_id && !c.delegated_to);
    },

    changeable(state) {
      return state.selectedCards.filter((c) => c.market_id && !c.delegated_to && c.market_listing_type === 'HE_RENT');
    },
  },

  actions: {
    async toggleCart(card) {
      const index = this.cart.findIndex((c) => c.uid === card.uid);

      if (index === -1) {
        this.cart.push(card);
      } else {
        this.cart.splice(index, 1);
      }
    },

    async fetchSettings() {
      if (this.settings) return;

      try {
        const { data } = await heslApi.get('settings');

        this.settings = data;
      } catch (error) {
        console.log(error.message);
      }
    },

    async fetchSLSettings() {
      if (this.sl_settings) return;

      try {
        const params = { token: this.token, username: this.player };

        const { data } = await slApi.get('settings', { params });

        this.sl_settings = data;
      } catch (error) {
        console.log(error.message);
      }
    },

    async fetchBalances() {
      if (!this.isLoggedIn) {
        return;
      }

      const { data } = await heslApi.get('players/balances', { params: { username: this.player } });

      data.forEach((b) => {
        this.balances.set(b.currency, Number(b.balance));
      });
    },

    async fetchBalanceHistory({ currency, page = 1, limit = 30 }) {
      const { data } = await heslApi.get('players/balance_history', {
        params: { username: this.player, currency, page, limit },
      });

      return data;
    },

    async fetchCardDetails() {
      if (this.details.size > 0) return;

      try {
        const params = { token: this.token, username: this.player };

        let { data } = await slApi.get('cards/get_details', { params });

        const details = data.map((d) => {
          const { id, name, color, type, rarity, tier, editions, stats } = d;

          return [id, { id, name, color, type, rarity, tier, editions, stats }];
        });

        this.details = new Map(details);
      } catch (error) {
        console.log(error.message);
      }
    },

    async fetchCollection(account) {
      try {
        const params = { token: this.token, username: this.player };

        const [{ data: collection }, { data: forRent }, { data: activeRentals }] = await Promise.all([
          slApi.get(`/cards/collection/${account}`, { params }),
          heslApi.get(`market/for_rent_by_user`, { params: { username: account } }),
          heslApi.get(`market/active_rentals`, { params: { username: account } }),
        ]);

        const rentals = new Map(forRent.map((c) => [c.uid, c]));
        const rented = new Map(activeRentals.map((c) => [c.uid, c]));

        this.cards = collection.cards
          .filter((c) => c.edition !== 6)
          .map((c) => {
            const bcx = getCardBcx(c);
            const cooldown = getCardCooldown(c);
            const power = getCardPower(c);

            let marketId = c.market_id;
            let buyPrice = Number(c.buy_price);
            let currency = c.currency;
            let marketListingType = c.market_listing_type;

            const rental = rentals.get(c.uid) || rented.get(c.uid);

            if (rental) {
              marketId = rental.market_id;
              buyPrice = Number(rental.price);
              currency = rental.currency;
              marketListingType = 'HE_RENT';
            }

            return {
              ...c,
              market_id: marketId,
              market_listing_type: marketListingType,
              buy_price: buyPrice,
              currency,
              bcx,
              cooldown,
              power,
            };
          });
      } catch (error) {
        console.error(error.message);
      }
    },

    async fetchActiveRentals(renter) {
      try {
        const { data } = await heslApi.get('market/active_rentals', { params: { renter, limit: 1000000 } });

        this.active_rentals = data.map((c) => {
          const { name, color, rarity } = this.details.get(c.card_detail_id);
          const bcx = getCardBcx(c);
          const level = getCardLevel(c);
          const price = Number(c.price);
          const remaining = formatDistance(addDays(parseISO(c.rented_at), c.days), Date.now(), {
            includeSeconds: true,
          });

          return {
            ...c,
            name,
            color,
            rarity,
            price,
            bcx,
            level,
            remaining,
          };
        });
      } catch (error) {
        console.error(error);
      }
    },

    async fetchForRentGrouped(currency = null) {
      try {
        const params = {};

        if (currency) {
          params.currency = currency;
        }

        const { data } = await heslApi.get(`market/for_rent_grouped`, { params });

        this.rentals = data;
      } catch (error) {
        console.error(error.message);
      }
    },

    async fetchForRentByCard({ id, edition, gold = false, currency = null }) {
      try {
        const params = {
          card_detail_id: id,
        };

        if (edition !== undefined) {
          params.edition = edition;
        }

        if (gold !== undefined) {
          params.gold = gold;
        }

        if (currency) {
          params.currency = currency;
        }

        const { data } = await heslApi.get(`market/for_rent_by_card`, { params });

        const { name } = this.details.get(id);

        this.for_rent = data.map((c) => {
          const bcx = getCardBcx(c);
          const power = getCardPower(c);
          const level = getCardLevel(c);

          return {
            ...c,
            name,
            bcx,
            power,
            level,
          };
        });
      } catch (error) {
        console.error(error.message);
      }
    },

    async fetchForRentByUser({ username, id, edition, gold }) {
      try {
        const params = { username };

        if (id) {
          params.card_detail_id = id;
        }

        if (edition !== undefined) {
          params.edition = edition;
        }

        if (gold !== undefined) {
          params.gold = gold;
        }

        const { data } = await heslApi.get(`market/for_rent_by_user`, { params });

        data.forEach((c) => {
          const index = this.cards.findIndex((c) => c.uid === c.uid);

          if (index !== -1) {
            this.cards[index].market_id = c.market_id;
            this.cards[index].buy_price = Number(c.price);
            this.cards[index].currency = c.currency;
            this.cards[index].market_listing_type = 'HE_RENT';
          }
        });
      } catch (error) {
        console.error(error.message);
      }
    },

    async fetchAuthorities(username) {
      let { data: auths } = await slApi.get('players/authorities', { params: { players: username || this.player } });

      if (Array.isArray(auths) && auths.length > 0) {
        auths = auths[0].authorities ? auths[0].authorities : {};

        if (auths.delegation && auths.delegation.includes(this.settings.account)) {
          this.authorized = true;
        } else {
          this.authorized = false;
        }
      }

      return auths;
    },

    async requestListCards({ price, currency }) {
      const store = useStore();

      const precisions = new Map(this.settings.precisions);

      const cards = this.listable.map((c) => [c.uid, toFixedNoRounding(price, precisions.get(currency))]);

      await store.requestBroadcastJson({
        id: `${this.settings.prefix}_market_list`,
        key: 'Active',
        message: 'List Cards for Rent',
        json: {
          cards,
          type: 'rent',
          currency,
        },
        eventName: 'list-cards-successful',
        eventData: cards.map((c) => c[0]),
      });
    },

    async requestChangePrice({ price, currency }) {
      const store = useStore();

      const precisions = new Map(this.settings.precisions);

      const items = this.changeable.map((c) => [c.market_id, toFixedNoRounding(price, precisions.get(currency))]);

      await store.requestBroadcastJson({
        id: `${this.settings.prefix}_update_rental_price`,
        key: 'Active',
        message: 'Update Rental Price',
        json: {
          items,
        },
        eventName: 'change-price-successful',
        eventData: items.map((c) => c[0]),
      });
    },

    async requestCancelListing() {
      const store = useStore();

      const grouped = groupBy(this.cancellable, 'market_listing_type');

      const ids = {
        HE_RENT: `${this.settings.prefix}_market_cancel_rental`,
        RENT: 'sm_market_cancel_rental',
        SELL: 'sm_cancel_sell',
      };

      for (const group of Object.keys(grouped)) {
        const items = grouped[group].map((c) => c.market_id);
        const json = group === 'SELL' ? { trx_ids: items } : { items };

        await store.requestBroadcastJson({
          id: ids[group],
          key: 'Active',
          message: 'Unlist Cards',
          json,
          eventName: 'cancel-cards-successful',
          eventData: items,
        });
      }
    },

    async requestUndelegateCards() {
      const store = useStore();

      const cards = this.undelegatable.map((c) => c.uid);

      await store.requestBroadcastJson({
        id: 'sm_undelegate_cards',
        key: 'Active',
        message: 'Cancel Rental',
        json: { cards },
        eventName: 'undelegate-cards-successful',
        eventData: cards,
      });
    },

    async requestPayment({ currency, days = 2 }) {
      const store = useStore();

      const items = this.cart.filter((c) => c.currency === currency);

      const rentables = items.filter((c) => c.market_id);

      if (rentables.length > 0) {
        await store.requestBroadcastJson({
          id: `${this.settings.prefix}_market_rent`,
          key: 'Active',
          message: `Rent Cards (${currency})`,
          json: {
            items: rentables.map((c) => c.market_id),
            days,
            currency,
          },
          eventName: 'rent-cards-successful',
          eventData: rentables.map((c) => c.uid),
        });
      }

      const renewables = items.filter((c) => c.sell_trx_id);

      if (renewables.length > 0) {
        await store.requestBroadcastJson({
          id: `${this.settings.prefix}_market_renew_rental`,
          key: 'Active',
          message: `Renew Cards (${currency})`,
          json: {
            items: renewables.map((c) => c.sell_trx_id),
            days,
            currency,
          },
          eventName: 'rent-cards-successful',
          eventData: renewables.map((c) => c.uid),
        });
      }
    },

    async requestAddAuthority() {
      const store = useStore();

      const auths = await this.fetchAuthorities();

      const json = auths;

      if (json.delegation) {
        json.delegation.push(this.settings.account);
      } else {
        json.delegation = [this.settings.account];
      }

      await store.requestBroadcastJson({
        id: `sm_set_authority`,
        key: 'Active',
        message: `Set Authority`,
        json,
        eventName: 'add-authority-successful',
      });
    },

    async logIntoSplinterlands() {
      const store = useStore();
      const userStore = useUserStore();

      if (!userStore.isLoggedIn) {
        return;
      }

      const timestamp = Date.now();

      const { success, result } = await store.requestKeychain(
        'requestSignBuffer',
        userStore.username,
        `${userStore.username}${timestamp}`,
        'Posting',
      );

      if (success) {
        const { data } = await heslApi.get('players/login', {
          params: { name: userStore.username, ts: timestamp, sig: result },
        });

        if (!data.error) {
          this.player = data.name;
          this.token = data.token;

          localStorage.setItem('sl_token', data.jwt_token);
          localStorage.setItem('sl_expiration', data.jwt_expiration_dt);

          await this.fetchAuthorities();
        }
      }
    },

    async attemptAutologin() {
      const userStore = useUserStore();

      if (this.isLoggedIn || !userStore.isLoggedIn) {
        return;
      }

      const now = Date.now();

      const username = localStorage.getItem('username');
      const jwtToken = localStorage.getItem('sl_token');
      let jwtExpiration = localStorage.getItem('sl_expiration');

      if (jwtExpiration) {
        jwtExpiration = new Date(jwtExpiration).getTime();
      }

      if (username && jwtExpiration > now && jwtToken) {
        const { data } = await heslApi.get('players/update', {
          params: { name: username, ts: now },
          headers: {
            Authorization: `Bearer: ${jwtToken}`,
          },
        });

        this.player = userStore.username;
        this.token = data.token;

        localStorage.setItem('sl_token', data.jwt_token);
        localStorage.setItem('sl_expiration', data.jwt_expiration_dt);

        await this.fetchAuthorities();
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCardStore, import.meta.hot));
}
