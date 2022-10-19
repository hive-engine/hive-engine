import { Client } from '@hiveio/dhive';
import { NODES } from '@/config';

const hiveClient = new Client(NODES, { failoverThreshold: 0, consoleOnFailover: true, timeout: 3000 });

export { hiveClient };

export default {
  install: (app) => {
    app.config.globalProperties.$hiveClient = hiveClient;

    app.provide('hiveClient', hiveClient);
  },
};
