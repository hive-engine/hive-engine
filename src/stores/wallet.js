import axios from 'axios';
import Big from 'big.js';
import { format } from 'date-fns';
import { isAddress } from 'ethers';
import { acceptHMRUpdate, defineStore } from 'pinia';
import { BSC_BRIDGE_API, CTC_API, ETH_BRIDGE_API, POLYGON_BRIDGE_API, SCOT_API, SOLANA_BRIDGE_API } from '@/config';
import { sidechain } from '@/plugins/sidechain';
import { useTokenStore } from '@/stores/token';
import { useUserStore } from '@/stores/user';
import { toFixedWithoutRounding } from '@/utils';
import { useStore } from '.';

export const useWalletStore = defineStore({
  id: 'wallet',

  state: () => ({
    wallet: [],
    pendingUnstakes: [],
    depositInfo: null,
    evmGasFee: 0,
    gasFeeBalance: 0,
  }),

  getters: {
    popularChoices: () => {
      const tokenStore = useTokenStore();

      const splTokens = tokenStore.tokens.filter((t) => t.issuer === 'steemmonsters').map((t) => t.symbol);
      const glsTokens = tokenStore.tokens.filter((t) => t.issuer === 'gls.dao').map((t) => t.symbol);

      return (token) =>
        splTokens.includes(token)
          ? [{ text: 'Splinterlands', value: 'steemmonsters' }]
          : glsTokens.includes(token)
            ? [{ text: 'Genesis League Sports', value: 'gls-he' }]
            : [];
    },
  },

  actions: {
    async fetchWallet(account, symbols) {
      try {
        const store = useStore();
        const userStore = useUserStore();

        if (!store.settings) {
          await store.fetchSettings();
        }

        const balances = await sidechain.getBalance(account || userStore.username, symbols);

        this.wallet = balances
          .filter((b) => !store.settings.disabled_tokens.includes(b.symbol))
          .map((b) => {
            const balance = Big(b.balance.trim());
            const delegationsIn = Big(b.delegationsIn ? b.delegationsIn : 0);

            const delegationsOut = Big(b.delegationsOut ? b.delegationsOut : 0);

            const stake = Big(b.stake ? b.stake : 0);

            const pendingUnstake = Big(b.pendingUnstake);

            return { ...b, balance, delegationsIn, delegationsOut, stake, pendingUnstake };
          });
      } catch {
        //
      }
    },

    async fetchPendingUnstakes(account) {
      try {
        const userStore = useUserStore();

        let pendingUnstakes = await sidechain.getPendingUnstakes(account || userStore.username);

        pendingUnstakes = pendingUnstakes.map((p) => ({
          ...p,
          quantity: Big(p.quantity),
          quantityLeft: Big(p.quantityLeft),
        }));

        this.pendingUnstakes = pendingUnstakes;
      } catch {
        //
      }
    },

    async requestTransfer({ symbol, to, quantity, memo, eventName }) {
      const json = {
        contractName: 'tokens',
        contractAction: 'transfer',
        contractPayload: {
          symbol,
          to,
          quantity,
          memo,
        },
      };

      const message = `Transfer (${symbol})`;

      const store = useStore();

      await store.requestBroadcastJson({ message, json, eventName });
    },

    async requestDelegate({ symbol, to, quantity }) {
      const json = {
        contractName: 'tokens',
        contractAction: 'delegate',
        contractPayload: {
          to,
          symbol,
          quantity,
        },
      };

      const message = `Delegate (${symbol})`;

      const store = useStore();

      await store.requestBroadcastJson({ message, json });
    },

    async requestUndelegate({ symbol, from, quantity }) {
      const json = {
        contractName: 'tokens',
        contractAction: 'undelegate',
        contractPayload: {
          from,
          symbol,
          quantity,
        },
      };

      const message = `Undelegate (${symbol})`;

      const store = useStore();

      await store.requestBroadcastJson({ message, json });
    },

    async requestStake({ symbol, to, quantity }) {
      const json = {
        contractName: 'tokens',
        contractAction: 'stake',
        contractPayload: {
          to,
          symbol,
          quantity,
        },
      };

      const message = `Stake (${symbol})`;

      const store = useStore();

      await store.requestBroadcastJson({ message, json });
    },

    async requestUnstake({ symbol, quantity }) {
      const json = {
        contractName: 'tokens',
        contractAction: 'unstake',
        contractPayload: {
          symbol,
          quantity,
        },
      };

      const message = `Unstake (${symbol})`;

      const store = useStore();

      await store.requestBroadcastJson({ message, json });
    },

    async requestCancelUnstake({ symbol, trxId }) {
      const json = {
        contractName: 'tokens',
        contractAction: 'cancelUnstake',
        contractPayload: {
          txID: trxId,
        },
      };

      const message = `Cancel Unstake (${symbol})`;

      const store = useStore();

      await store.requestBroadcastJson({ message, json });
    },

    async getDepositAddress(symbol) {
      let depositInfo = null;

      try {
        const tokenStore = useTokenStore();
        const userStore = useUserStore();

        const peggedToken = tokenStore.peggedTokens.find((p) => p.symbol === symbol);

        if (!peggedToken) {
          return;
        }

        if (!userStore.isLoggedIn) {
          return;
        }

        const { data: response } = await axios.post(`${CTC_API}/convert/`, {
          from_coin: symbol,
          to_coin: peggedToken.pegged_token_symbol,
          destination: userStore.username,
        });

        depositInfo = { ...response, ...peggedToken };
      } catch (e) {
        console.log(e.message);
      }

      this.depositInfo = depositInfo;
    },

    async fetchEvmAddress(network = 'eth') {
      const userStore = useUserStore();

      let address = '';

      const endpoints = {
        eth: `${ETH_BRIDGE_API}/utils/ethaddress`,
        bsc: `${BSC_BRIDGE_API}/utils/bscaddress`,
        polygon: `${POLYGON_BRIDGE_API}/utils/polygonaddress`,
      };

      const addressKeys = {
        eth: 'ethereumAddress',
        bsc: 'bscAddress',
        polygon: 'polygonAddress',
      };

      try {
        const {
          data: { data },
        } = await axios.get(`${endpoints[network]}/${userStore.username}`);

        address = data[addressKeys[network]];
      } catch (e) {
        console.log(e.message);
      }

      return isAddress(address) ? address : '';
    },

    async fetchGasFee(network, evmToken) {
      try {
        const endpoints = {
          eth: `${ETH_BRIDGE_API}/utils/withdrawalfee`,
          bsc: `${BSC_BRIDGE_API}/utils/withdrawalfee`,
          polygon: `${POLYGON_BRIDGE_API}/utils/withdrawalfee`,
        };

        const {
          data: { data },
        } = await axios.get(`${endpoints[network]}/${evmToken}`);

        this.evmGasFee = Number(data);
      } catch (e) {
        console.log(e.message);
      }
    },

    async fetchFeeBalance(network) {
      const userStore = useUserStore();

      try {
        const endpoints = {
          eth: `${ETH_BRIDGE_API}/utils/feebalance`,
          bsc: `${BSC_BRIDGE_API}/utils/feebalance`,
          polygon: `${POLYGON_BRIDGE_API}/utils/feebalance`,
        };

        const {
          data: {
            data: { balance },
          },
        } = await axios.get(`${endpoints[network]}/${userStore.username}`);

        this.gasFeeBalance = Number(balance);
      } catch (e) {
        console.log(e);
      }
    },

    async requestDepositGasFee({ amount, symbol, network }) {
      const store = useStore();

      const bridgeAccount = store.settings[`${network}_bridge`].account;

      const json = {
        contractName: 'tokens',
        contractAction: 'transfer',
        contractPayload: {
          symbol,
          to: bridgeAccount,
          quantity: amount.toFixed(8),
          memo: 'fee',
        },
      };

      const message = 'Deposit Reserved Gas Fee';

      await store.requestBroadcastJson({ message, json, eventName: 'fee-deposit-successful' });
    },

    async fetchSolAddress() {
      const userStore = useUserStore();

      let address = '';

      try {
        const {
          data: { data },
        } = await axios.get(`${SOLANA_BRIDGE_API}/utils/soladdress/${userStore.username}`);

        address = data['solanaAddress'];
      } catch (e) {
        console.log(e.message);
      }

      return /[1-9A-HJ-NP-Za-km-z]{32,44}/.test(address) ? address : '';
    },

    async getWithdrawalAddress({ symbol, address }) {
      const tokenStore = useTokenStore();
      const userStore = useUserStore();

      let result = null;

      const peggedToken = tokenStore.peggedTokens.find((p) => p.pegged_token_symbol === symbol);

      if (!peggedToken) {
        return;
      }

      if (!userStore.username) {
        return;
      }

      const data = {
        from_coin: peggedToken.pegged_token_symbol,
        to_coin: peggedToken.symbol,
        destination: address,
      };

      const { data: response } = await axios.post(`${CTC_API}/convert/`, data);

      result = { ...response, ...peggedToken };

      return result;
    },

    async requestTokenWithdrawal({ amount, symbol, address, memo, network }) {
      try {
        const store = useStore();

        let json = {
          contractName: 'tokens',
          contractAction: 'transfer',
          contractPayload: {},
        };

        if (symbol === 'SWAP.HIVE') {
          json = {
            contractName: 'hivepegged',
            contractAction: 'withdraw',
            contractPayload: {
              quantity: toFixedWithoutRounding(Number(amount), 3).toFixed(3),
            },
          };
        } else if (symbol === store.settings?.solana_bridge.solana.pegged_token_symbol) {
          json.contractPayload = {
            symbol,
            to: store.settings.solana_bridge.account,
            quantity: amount,
            memo: address,
          };
        } else if (network) {
          const bridgeAccount = store.settings[`${network}_bridge`].account;

          json.contractPayload = {
            symbol,
            to: bridgeAccount,
            quantity: amount,
            memo: address,
          };
        } else {
          const withdrawInfo = await this.getWithdrawalAddress({ symbol, address, memo });

          console.log(withdrawInfo);

          let withdrawMemo = withdrawInfo.memo;

          if (memo && memo !== '') {
            withdrawMemo = `${withdrawMemo} ${memo}`;
          }

          json.contractPayload = {
            symbol: withdrawInfo.pegged_token_symbol,
            to: withdrawInfo.account,
            quantity: amount,
            memo: withdrawMemo,
          };
        }

        const message = `Withdraw ${symbol}`;

        await store.requestBroadcastJson({ message, json });
      } catch {
        //
      }
    },

    async fetchConversionHistory() {
      const userStore = useUserStore();

      try {
        let [
          {
            data: { results: withdrawals },
          },
          {
            data: { results: deposits },
          },
        ] = await Promise.all([
          axios.get(`${CTC_API}/conversions`, {
            params: { limit: 20, offset: 0, deposit__from_account: userStore.username },
          }),
          axios.get(`${CTC_API}/conversions`, {
            params: { limit: 20, offset: 0, to_address: userStore.username },
          }),
        ]);

        withdrawals = withdrawals
          .filter((w) => w.from_coin_symbol.includes('SWAP.'))
          .map((w) => {
            const amount = Number(w.to_amount);
            const fee = Number(w.ex_fee);
            const timestamp = new Date(w.created_at).getTime();

            return {
              type: 'Withdraw',
              symbol: w.to_coin_symbol,
              address: w.to_address,
              trx_id: w.to_txid,
              amount: toFixedWithoutRounding(amount + fee, 8),
              fee,
              timestamp,
              date: format(timestamp, 'Pp'),
            };
          });

        deposits = deposits
          .filter((w) => w.to_coin_symbol.includes('SWAP.'))
          .map((w) => {
            const amount = Number(w.to_amount);
            const fee = Number(w.ex_fee);
            const timestamp = new Date(w.created_at).getTime();

            return {
              type: 'Deposit',
              symbol: w.to_coin_symbol,
              address: w.from_address,
              trx_id: w.to_txid,
              amount: toFixedWithoutRounding(amount + fee, 8),
              fee,
              timestamp,
              date: format(timestamp, 'Pp'),
            };
          });

        const conversions = [...withdrawals, ...deposits].sort((a, b) => b.timestamp - a.timestamp);

        return conversions;
      } catch {
        //
      }

      return [];
    },

    async fetchScotRewards() {
      const userStore = useUserStore();

      let rewards = [];

      try {
        const { data } = await axios.get(`${SCOT_API}/@${userStore.username}`, {
          params: { hive: 1 },
        });

        rewards = Object.values(data)
          .filter((r) => r.pending_token > 0)
          .map((r) => ({
            symbol: r.symbol,
            stake: toFixedWithoutRounding(r.staked_tokens / 10 ** r.precision, r.precision),
            reward: toFixedWithoutRounding(r.pending_token / 10 ** r.precision, r.precision),
          }));
      } catch {
        //
      }

      return rewards;
    },

    async requestClaimScotRewards(symbols) {
      const store = useStore();

      let json = {};

      if (Array.isArray(symbols)) {
        json = symbols.reduce((acc, symbol) => {
          acc.push({ symbol });

          return acc;
        }, []);
      } else {
        json = { symbol: symbols };
      }

      const message = `Claim SCOT Rewards`;

      await store.requestBroadcastJson({
        id: 'scot_claim_token',
        key: 'Posting',
        message,
        json,
        eventName: 'scot-claim-successful',
      });
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useWalletStore, import.meta.hot));
}
