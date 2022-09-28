import { Client } from '@hiveio/dhive';
import { NODES } from '@/config';

const hiveClient = new Client(NODES);

export { hiveClient };

export default {
  install: (app) => {
    app.config.globalProperties.$hiveClient = hiveClient;

    app.provide('hiveClient', hiveClient);
  },
};
