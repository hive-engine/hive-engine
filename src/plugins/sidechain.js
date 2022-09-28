import axios from 'axios';
import { HISTORY_API, SIDECHAIN_RPC } from '@/config';

const instance = axios.create({
  baseURL: SIDECHAIN_RPC,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  },
});

const sidechain = {
  async call(endpoint, request) {
    const postData = {
      jsonrpc: '2.0',
      id: Date.now(),
      ...request,
    };

    let result = null;

    const query = await instance.post(`${endpoint}`, postData, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

    result = query.data.result;

    return result;
  },

  async callHistory(endpoint, params) {
    let result = null;

    const query = await axios.get(`${HISTORY_API}/${endpoint}`, { params });

    result = query.data;

    return result;
  },

  blockchain(request) {
    return this.call('blockchain', request);
  },

  contract(request) {
    return this.call('contracts', request);
  },

  getContractParams(contractName) {
    const request = {
      method: 'findOne',
      params: {
        contract: contractName,
        table: 'params',
        query: {},
      },
    };

    return this.contract(request);
  },

  getBalance(account, symbol) {
    const query = { account };

    const request = {
      method: 'find',
      params: {
        contract: 'tokens',
        table: 'balances',
        query,
      },
    };

    if (symbol) {
      if (Array.isArray(symbol)) {
        request.params.query = { ...query, symbol: { $in: symbol } };
      } else {
        request.method = 'findOne';
        request.params.query = { ...query, symbol };
      }
    }

    return this.contract(request);
  },

  getTokens(query = {}, offset = 0, limit = 1000) {
    const request = {
      method: 'find',
      params: {
        contract: 'tokens',
        table: 'tokens',
        query,
        offset,
        limit,
      },
    };

    return this.contract(request);
  },

  getPendingUnstakes(account, symbol) {
    const query = { account };

    if (Array.isArray(symbol)) {
      query.symbol = { $in: symbol };
    } else {
      query.symbol = symbol;
    }

    const request = {
      method: 'find',
      params: {
        contract: 'tokens',
        table: 'pendingUnstakes',
        query,
      },
    };

    return this.contract(request);
  },

  getMetrics(query = {}, offset = 0, limit = 1000) {
    const request = {
      method: 'find',
      params: {
        contract: 'market',
        table: 'metrics',
        query,
        limit,
        offset,
      },
    };

    if (typeof query === 'string') {
      request.method = 'findOne';
      request.params.query = { symbol: query };
    }

    return this.contract(request);
  },

  getOrders(query, type = 'buy', limit = 100, descending = true) {
    const request = {
      method: 'find',
      params: {
        contract: 'market',
        query,
        indexes: [{ index: 'priceDec', descending }],
        limit,
        offset: 0,
      },
    };

    request.params.table = type === 'buy' ? 'buyBook' : 'sellBook';

    return this.contract(request);
  },

  getTradesHistory(symbol, type = null, limit = 100) {
    const query = {};
    if (symbol !== null) {
      query.symbol = symbol;
    }
    if (type !== null) {
      query.type = type;
    }

    const request = {
      method: 'find',
      params: {
        contract: 'market',
        table: 'tradesHistory',
        query,
        limit,
        offset: 0,
        indexes: [{ index: '_id', descending: true }],
      },
    };

    return this.contract(request);
  },

  getPendingWithdrawals(recipient) {
    const query = {};

    if (recipient) {
      query.recipient = recipient;
    }

    const request = {
      method: 'find',
      params: {
        contract: 'hivepegged',
        table: 'withdrawals',
        query,
      },
    };

    return this.contract(request);
  },

  getTransaction(txid) {
    const request = {
      method: 'getTransactionInfo',
      params: {
        txid,
      },
    };

    return this.blockchain(request);
  },

  getAccountHistory(params) {
    return this.callHistory('accountHistory', params);
  },
};

export { sidechain };

export default {
  install: (app) => {
    app.config.globalProperties.$sidechain = sidechain;

    app.provide('sidechain', sidechain);
  },
};
