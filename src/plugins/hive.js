import axios from 'axios';
import { NODES } from '@/config';

export const hiveClient = {
  getRPC() {
    return NODES[0];
  },

  async call(method, params = []) {
    const postData = {
      jsonrpc: '2.0',
      id: 0,
      method,
      params,
    };

    const body = JSON.stringify(postData, (key, value) => {
      if (value && typeof value === 'object' && value.type === 'Buffer') {
        return Buffer.from(value.data).toString('hex');
      }
      return value;
    });

    let result = null;

    const request = await axios.post(this.getRPC(), body);

    result = request.data.result;

    return result;
  },

  async getAccounts(accounts) {
    return this.call('condenser_api.get_accounts', [accounts]);
  },

  async getVestingDelegations(delegator, startAccount = null, limit = 10) {
    return this.call('condenser_api.get_vesting_delegations', [delegator, startAccount, limit]);
  },

  async listRCDirectDelegations(from, to, limit = 1) {
    return this.call('rc_api.list_rc_direct_delegations', { start: [from, to], limit });
  },
};

export default {
  install: (app) => {
    app.config.globalProperties.$hiveClient = hiveClient;

    app.provide('hiveClient', hiveClient);
  },
};
