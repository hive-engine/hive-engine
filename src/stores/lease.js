import { useTimeAgo } from '@vueuse/core';
import axios from 'axios';
import { acceptHMRUpdate, defineStore } from 'pinia';
import { LEASE_API } from '@/config';
import { hiveClient } from '@/plugins/hive';
import { emitter } from '@/plugins/mitt';
import { sidechain } from '@/plugins/sidechain';
import { useUserStore } from '@/stores/user';
import { useWalletStore } from '@/stores/wallet';
import { toFixedNoRounding } from '@/utils';
import { useStore } from '.';

export const leaseApi = axios.create({
  baseURL: LEASE_API,
});

export const useLeaseStore = defineStore({
  id: 'lease',

  state: () => ({
    settings: null,
    requests: [],
    dashboard: null,
    metrics: new Map(),
  }),

  getters: {
    precisions: (state) => {
      if (state.settings) {
        return new Map(state.settings.supported_currencies);
      }

      return new Map();
    },
    assets: (state) => {
      if (state.settings) {
        return new Map(state.settings.supported_assets);
      }

      return new Map();
    },
    currencies: (state) => {
      if (state.settings) {
        return state.settings.supported_currencies.map((c) => c[0]);
      }

      return [];
    },
    minimumPayment: (state) => {
      if (state.settings) {
        return new Map(state.settings.minimum_payment);
      }

      return new Map();
    },
  },

  actions: {
    async fetchSettings() {
      const { data } = await leaseApi.get('settings');

      this.settings = data;
    },

    async fetchMetrics() {
      if (this.settings) {
        await this.fetchSettings();
      }

      const metrics = await sidechain.getMetrics({
        symbol: { $in: [...this.currencies, this.settings.supported_assets] },
      });

      metrics.forEach((m) => this.metrics.set(m.symbol, Number(m.lastPrice)));

      this.metrics.set('HP', 1);
      this.metrics.set('RC', 0.0000000006);
    },

    async fetchLeaseRequests() {
      const store = useStore();

      const { data } = await leaseApi.get('market');

      const requests = data
        .map((d) => {
          const amountInUSD =
            (d.asset === 'HP' ? d.vests_price : this.metrics.get(d.asset)) * store.hivePrice * d.amount;

          const paymentInUSD =
            (d.currency === 'SWAP.HIVE' ? 1 : this.metrics.get(d.currency)) * store.hivePrice * d.total_payment;

          const apr =
            (((365 / (d.duration * 7 + this.assets.get(d.asset).cooldown)) * 0.9 * paymentInUSD) / amountInUSD) * 100;

          let unlocksAt = null;
          let unlockTimeremaining = null;

          if (d.unlocks_at) {
            unlocksAt = new Date(d.unlocks_at);
            unlockTimeremaining = useTimeAgo(unlocksAt, { showSecond: true, updateInterval: 1000 });
          }

          return {
            ...d,
            apr: apr || 0,
            unlocks_at: unlocksAt,
            unlock_time_remaining: unlockTimeremaining,
          };
        })
        .sort((a, b) => b.apr - a.apr);

      this.requests = requests;
    },

    async fetchUserLeases() {
      const store = useStore();
      const userStore = useUserStore();

      const { data } = await leaseApi.get(`leases/${userStore.username}`);

      const mapFunction = (d) => {
        const amountInUSD = (d.asset === 'HP' ? d.vests_price : this.metrics.get(d.asset)) * store.hivePrice * d.amount;

        const paymentInUSD =
          (d.currency === 'SWAP.HIVE' ? 1 : this.metrics.get(d.currency)) * store.hivePrice * d.total_payment;

        const apr =
          (((365 / (d.duration * 7 + this.assets.get(d.asset).cooldown)) * 0.9 * paymentInUSD) / amountInUSD) * 100;

        let unlocksAt = null;
        let unlockTimeremaining = null;

        if (d.unlocks_at) {
          unlocksAt = new Date(d.unlocks_at);
          unlockTimeremaining = useTimeAgo(unlocksAt, { showSecond: true, updateInterval: 1000 });
        }

        return {
          ...d,
          apr: apr || 0,
          unlocks_at: unlocksAt,
          unlock_time_remaining: unlockTimeremaining,
        };
      };

      const dashboard = {};

      Object.keys(data).forEach((key) => {
        dashboard[key] = data[key].map(mapFunction).sort((a, b) => b.apr - a.apr);
      });

      this.dashboard = dashboard;
    },

    async getDelegationAmount({ from, to, amount, symbol, undelegate = false }) {
      if (symbol === 'HP') {
        let toDelegate = amount;

        const [delegated] = await hiveClient.getVestingDelegations(from, to, 1);

        if (delegated && delegated.delegatee === to) {
          if (undelegate) {
            toDelegate = parseFloat(delegated.vesting_shares) - toDelegate;
          } else {
            toDelegate += parseFloat(delegated.vesting_shares);
          }
        }

        return toDelegate.toFixed(6);
      } else if (symbol === 'RC') {
        let toDelegate = amount;

        const {
          rc_direct_delegations: [delegated],
        } = await hiveClient.listRCDirectDelegations(from, to, 1);

        if (delegated && delegated.to === to) {
          if (undelegate) {
            toDelegate = parseFloat(delegated.delegated_rc) - amount;
          } else {
            toDelegate += parseFloat(delegated.delegated_rc);
          }
        }

        return toDelegate;
      }
    },

    async fillLeaseRequest(id) {
      const store = useStore();
      const userStore = useUserStore();
      const walletStore = useWalletStore();

      const payload = { id, username: userStore.username };

      const { success, result } = await store.requestKeychain(
        'requestSignBuffer',
        userStore.username,
        JSON.stringify(payload),
        'Posting',
      );

      if (success) {
        try {
          const { data } = await leaseApi.post(
            `fill/${id}/${userStore.username}`,
            {},
            {
              headers: {
                'X-Signature': result,
              },
              withCredentials: false,
            },
          );

          if (data.asset === 'HP') {
            const delegationAmount = await this.getDelegationAmount({
              from: userStore.username,
              to: data.beneficiary,
              amount: parseFloat(data.amount),
              symbol: 'HP',
            });

            await store.requestKeychain(
              'requestDelegation',
              userStore.username,
              data.beneficiary,
              delegationAmount,
              'VESTS',
            );
          } else if (data.asset === 'RC') {
            const delegationAmount = await this.getDelegationAmount({
              from: userStore.username,
              to: data.beneficiary,
              amount: parseInt(data.amount),
              symbol: 'RC',
            });

            await store.requestBroadcastJson({
              key: 'Posting',
              id: 'rc',
              message: 'Delegate RC',
              json: [
                'delegate_rc',
                {
                  from: userStore.username,
                  delegatees: [data.beneficiary],
                  max_rc: delegationAmount,
                },
              ],
            });
          } else if (data.asset === 'SPS') {
            //
          } else {
            await walletStore.requestDelegate({
              symbol: data.asset,
              to: data.beneficiary,
              quantity: toFixedNoRounding(data.amount, this.assets.get(data.asset).precision),
            });
          }
        } catch (e) {
          console.log(e);
        }
      }
    },

    async requestCancelLease({ id, currency }) {
      const store = useStore();

      const json = {
        contractName: 'tokens',
        contractAction: 'transfer',
        contractPayload: {
          symbol: currency,
          to: this.settings.account,
          quantity: (1 / 10 ** this.precisions.get(currency)).toFixed(this.precisions.get(currency)),
          memo: `cancel ${id}`,
        },
      };

      const message = `Cancel Lease Request`;

      await store.requestBroadcastJson({ message, json, eventName: 'lease-request-cancel-successful' });
    },

    async requestUndelegate(data) {
      const store = useStore();
      const userStore = useUserStore();

      if (data.asset === 'HP') {
        const delegationAmount = await this.getDelegationAmount({
          from: userStore.username,
          to: data.beneficiary,
          amount: parseFloat(data.amount),
          symbol: 'HP',
          undelegate: true,
        });

        const { success } = await store.requestKeychain(
          'requestDelegation',
          userStore.username,
          data.beneficiary,
          delegationAmount,
          'VESTS',
        );

        if (success) {
          emitter.emit('lease-undelegation-successful', data);
        }
      } else if (data.asset === 'RC') {
        const delegationAmount = await this.getDelegationAmount({
          from: userStore.username,
          to: data.beneficiary,
          amount: parseInt(data.amount),
          symbol: 'RC',
          undelegate: true,
        });

        await store.requestBroadcastJson({
          key: 'Posting',
          id: 'rc',
          message: 'Undelegate RC',
          json: [
            'delegate_rc',
            {
              from: userStore.username,
              delegatees: [data.beneficiary],
              max_rc: delegationAmount,
            },
          ],
          eventName: 'lease-undelegation-successful',
          eventData: data,
        });
      } else if (data.asset === 'SPS') {
        //
      } else {
        await store.requestBroadcastJson({
          message: `Undelegate (${data.asset})`,
          json: {
            contractName: 'tokens',
            contractAction: 'undelegate',
            contractPayload: {
              from: data.beneficiary,
              symbol: data.asset,
              quantity: toFixedNoRounding(data.amount, this.assets.get(data.asset).precision),
            },
          },
          eventName: 'lease-undelegation-successful',
          eventData: data,
        });
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useLeaseStore, import.meta.hot));
}
