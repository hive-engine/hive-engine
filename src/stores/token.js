import axios from 'axios';
import { acceptHMRUpdate, defineStore } from 'pinia';
import { BSC_BRIDGE_API, CTC_API, ETH_BRIDGE_API, POLYGON_BRIDGE_API } from '@/config';
import { sidechain } from '@/plugins/sidechain';
import { useStore } from '.';

export const useTokenStore = defineStore({
  id: 'token',

  state: () => ({
    tokens: [],
    metrics: [],
    peggedTokens: [],
    evmTokens: [],
  }),

  actions: {
    async fetchTokens() {
      const limit = 1000;
      let results = [];
      let newData = 0;
      let offset = 0;

      const store = useStore();

      if (!store.settings) {
        await store.fetchSettings();
      }

      do {
        const data = await sidechain.getTokens({}, offset, limit);
        newData = data.length;

        if (data.length > 0) {
          results.push(...data);

          if (data.length < limit) {
            newData = 0;
          }
        }
        offset += limit;
      } while (newData > 0);

      results = results
        .filter((r) => !store.settings.disabled_tokens.includes(r.symbol))
        .map((t) => {
          let metadata = {};
          let icon = 'https://cdn.tribaldex.com/tribaldex/token-icons/UNKNOWN.png';

          try {
            metadata = JSON.parse(t.metadata);

            if (metadata.icon && metadata.icon.startsWith('http')) {
              if (t.symbol === 'BEE') {
                icon = 'https://hive-engine.com/images/logo-small.png';
              } else {
                icon = metadata.icon.endsWith('.svg') ? metadata.icon : `https://images.hive.blog/0x0/${metadata.icon}`;
              }
            }
          } catch {
            //
          }

          return {
            ...t,
            icon,
            metadata,
          };
        });

      this.tokens = results;
    },

    async fetchMetrics() {
      const limit = 1000;
      let results = [];
      let newData = 0;
      let offset = 0;

      do {
        const data = await sidechain.getMetrics({}, offset, limit);
        newData = data.length;

        if (data.length > 0) {
          results.push(...data);

          if (data.length < limit) {
            newData = 0;
          }
        }
        offset += limit;
      } while (newData > 0);

      this.metrics = results;
    },

    async fetchPeggedTokens() {
      try {
        const [{ data: coins }, { data: pairs }] = await Promise.all([
          axios.get(`${CTC_API}/coins/`),
          axios.get(`${CTC_API}/pairs/`),
        ]);

        let tokenPairs = [];
        const nonPeggedCoins = coins.filter((x) => x.coin_type !== 'hiveengine');

        const hive = { name: 'HIVE', symbol: 'HIVE', pegged_token_symbol: 'SWAP.HIVE' };
        tokenPairs.push(hive);

        nonPeggedCoins.forEach((x) => {
          const coinFound = pairs.find((y) => y.from_coin_symbol === x.symbol);

          if (coinFound) {
            const tp = {
              name: x.display_name,
              symbol: x.symbol,
              pegged_token_symbol: coinFound.to_coin_symbol,
            };

            // check if the token exists
            if (!tokenPairs.find((x) => x.symbol === tp.symbol)) {
              tokenPairs.push(tp);
            }
          }
        });

        tokenPairs = tokenPairs.sort((a, b) => a.name.localeCompare(b.name));

        this.peggedTokens = tokenPairs;
      } catch (e) {
        console.log(e.message);
      }
    },

    async fetchSupportedEvmTokens({ network, deposit, withdrawal }) {
      try {
        const endpoints = {
          eth: `${ETH_BRIDGE_API}/utils/tokens/erc20`,
          bsc: `${BSC_BRIDGE_API}/utils/tokens/bep20`,
          polygon: `${POLYGON_BRIDGE_API}/utils/tokens/erc20`,
        };

        const {
          data: { data },
        } = await axios.get(endpoints[network]);

        const tokens = data
          .filter((t) => {
            if (typeof deposit === 'boolean') {
              return t.depositEnabled === deposit;
            }

            return t.withdrawEnabled === withdrawal;
          })
          .map((t) => {
            return {
              name: t.name,
              symbol: t[`${network}Symbol`],
              pegged_token_symbol: t.heSymbol,
              contract_address: t.contractAddress,
              evm_precision: t[`${network}Precision`],
              network,
            };
          });

        this.evmTokens = tokens;
      } catch (e) {
        console.log(e.message);
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useTokenStore, import.meta.hot));
}
