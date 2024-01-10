import axios from 'axios';
import Big from 'big.js';
import { format } from 'date-fns';
import { acceptHMRUpdate, defineStore } from 'pinia';
import { sidechain } from '@/plugins/sidechain';
import { useStore } from '.';

const processOrderBook = (orderBook) => {
  let volume = Big(0);
  let hiveVolume = Big(0);

  return orderBook
    .map((o) => {
      const price = Big(o.price);
      const quantity = Big(o.quantity);
      const total = price.times(quantity);

      return {
        price,
        quantity,
        total,
      };
    })
    .reduce((acc, cur) => {
      const exists = acc.find((o) => o.price.eq(cur.price));

      volume = volume.plus(cur.quantity);
      hiveVolume = hiveVolume.plus(cur.total);

      if (exists) {
        exists.quantity = exists.quantity.plus(cur.quantity);
        exists.total = exists.total.plus(cur.price.times(cur.quantity));
        exists.volume = volume;
        exists.hive_volume = hiveVolume;
      } else {
        acc.push({
          ...cur,
          volume,
          hive_volume: hiveVolume,
        });
      }

      return acc;
    }, [])
    .map((o) => {
      return {
        ...o,
        total: o.total.toFixed(6),
        volume: o.volume.toFixed(8),
        hive_volume: o.hive_volume.toFixed(5),
      };
    });
};

export const useMarketStore = defineStore({
  id: 'market',

  state: () => ({
    buyBook: [],
    sellBook: [],
    buyOrders: [],
    sellOrders: [],
    tradesHistory: [],
    marketHistory: [],
    token: null,
    metrics: null,
  }),

  getters: {
    buyBookFormatted(state) {
      return processOrderBook(state.buyBook);
    },

    sellBookFormatted(state) {
      return processOrderBook(state.sellBook);
    },

    openOrdersFormatted(state) {
      return [...state.buyOrders, ...state.sellOrders]
        .sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
        .map((o) => ({
          ...o,
          type: o.tokensLocked ? 'BUY' : 'SELL',
          total: Big(o.quantity).times(o.price),
          timestamp: format(new Date(o.timestamp * 1000), 'Pp'),
        }));
    },

    tradesHistoryFormatted(state) {
      return state.tradesHistory.map((o) => ({
        timestamp: format(new Date(o.timestamp * 1000), 'Pp'),
        type: o.type.toUpperCase(),
        buyer: o.buyer,
        seller: o.seller,
        quantity: o.quantity,
        price: o.price,
        total: Big(o.quantity).times(o.price).toFixed(8),
      }));
    },
  },

  actions: {
    async fetchOrders(symbol) {
      try {
        const query = { symbol };

        const [buyBook, sellBook] = await Promise.all([
          sidechain.getOrders(query, 'buy', 1000, true),
          sidechain.getOrders(query, 'sell', 1000, false),
        ]);

        this.buyBook = buyBook;
        this.sellBook = sellBook;
      } catch {
        //
      }
    },

    async fetchUserOrders(symbol = null, account) {
      try {
        const query = { account };

        if (symbol) {
          query.symbol = symbol;
        }

        const [buyOrders, sellOrders] = await Promise.all([
          sidechain.getOrders(query, 'buy', 1000, true),
          sidechain.getOrders(query, 'sell', 1000, false),
        ]);

        this.buyOrders = buyOrders;
        this.sellOrders = sellOrders;
      } catch {
        //
      }
    },

    async fetchTradeHistory(symbol) {
      try {
        const tradesHistory = await sidechain.getTradesHistory(symbol, null, 30);

        this.tradesHistory = tradesHistory;
      } catch {
        //
      }
    },

    async fetchToken(symbol) {
      try {
        const [token] = await sidechain.getTokens({ symbol });

        let metadata = {};
        let icon = 'https://cdn.tribaldex.com/tribaldex/token-icons/UNKNOWN.png';

        try {
          metadata = JSON.parse(token.metadata);

          if (metadata.icon && metadata.icon.startsWith('http')) {
            if (symbol === 'BEE') {
              icon = 'https://hive-engine.com/images/logo-small.png';
            } else {
              icon = metadata.icon.endsWith('.svg') ? metadata.icon : `https://images.hive.blog/0x0/${metadata.icon}`;
            }
          }
        } catch {
          //
        }

        this.token = { ...token, icon, metadata };
      } catch {
        //
      }
    },

    async fetchTokenMetrics(symbol) {
      try {
        const metrics = await sidechain.getMetrics(symbol);

        if (metrics && metrics.volumeExpiration * 1000 < Date.now()) {
          metrics.volume = 0;
        }

        this.metrics = metrics;
      } catch {
        //
      }
    },

    async fetchMarketHistory(symbol, interval = 'daily') {
      try {
        const { data: history } = await axios.get('https://info-api.tribaldex.com/market/ohlcv', {
          params: { symbol, interval },
        });

        this.marketHistory = history;
      } catch (e) {
        console.log(e.message);
      }
    },

    async requestPlaceOrder({ action = 'buy', type = 'limit', symbol, price, quantity, total }) {
      const orderQuantity = action === 'buy' && type === 'market' ? total : quantity;

      const json = {
        contractName: 'market',
        contractAction: action,
        contractPayload: {
          symbol,
          quantity: orderQuantity.toString(),
          price: price.toString(),
        },
      };

      if (type === 'market') {
        delete json.contractPayload.price;

        if (action === 'buy') {
          json.contractAction = 'marketBuy';
        } else {
          json.contractAction = 'marketSell';
        }
      }

      const message = `${type === 'limit' ? 'Limit' : 'Market'} ${action === 'buy' ? 'Buy' : 'Sell'} (${symbol})`;

      const store = useStore();

      await store.requestBroadcastJson({ message, json });
    },

    async requestCancelOrders(orderIds) {
      const json = orderIds.map((o) => ({
        contractName: 'market',
        contractAction: 'cancel',
        contractPayload: {
          type: o.type.toLowerCase(),
          id: o.txId,
        },
      }));

      const store = useStore();

      await store.requestBroadcastJson({ message: 'Cancel Order(s)', json });
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useMarketStore, import.meta.hot));
}
