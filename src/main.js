import VueNotifications from '@kyvg/vue3-notification';
import { createHead } from '@unhead/vue';
import FloatingVue from 'floating-vue';
import { createPinia } from 'pinia';
import { createApp, markRaw } from 'vue';
import { createVfm } from 'vue-final-modal';
import VueLazyload from 'vue-lazyload';

import App from '@/App.vue';
import Loading from '@/components/utilities/Loading.vue';
import Spinner from '@/components/utilities/Spinner.vue';

import { LEASE_API } from '@/config';
import eventSource from '@/plugins/eventSource';
import hive from '@/plugins/hive';
import mitt from '@/plugins/mitt';
import hiveEngine from '@/plugins/sidechain';
import router from '@/router';

import 'floating-vue/dist/style.css';
import 'vue-final-modal/style.css';
import '@/index.css';
import '@/assets/scss/app.scss';

const pinia = createPinia();

pinia.use(({ store }) => {
  store.router = markRaw(router);
});

const app = createApp(App);

const head = createHead();
const vfm = createVfm();

app.provide('toFixedWithoutRounding', (t, l = 3) => {
  const a = 10 ** l;
  const s = t * a;
  return Math.trunc(s) / a;
});

app.provide('sleep', (ms) => new Promise((resolve) => setTimeout(resolve, ms)));

app.use(pinia);
app.use(head);
app.use(router);
app.use(hiveEngine);
app.use(mitt);
app.use(hive);
app.use(eventSource, { url: `${LEASE_API}/events` });
app.use(vfm);
app.use(FloatingVue);
app.use(VueNotifications);
app.use(VueLazyload);

app.component('Loading', Loading);
app.component('Spinner', Spinner);

app.mount('#app');
