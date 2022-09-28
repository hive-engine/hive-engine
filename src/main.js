import Notifications from '@kyvg/vue3-notification';
import FloatingVue from 'floating-vue';
import { createPinia } from 'pinia';
import { createApp, markRaw } from 'vue';
import { vfmPlugin } from 'vue-final-modal';
import VueLazyload from 'vue-lazyload';

import App from './App.vue';
import Loading from './components/utilities/Loading.vue';
import Spinner from './components/utilities/Spinner.vue';

import hive from './plugins/hive';
import mitt from './plugins/mitt';
import hiveEngine from './plugins/sidechain';
import router from './router';

import 'floating-vue/dist/style.css';
import './index.css';
import './assets/scss/app.scss';

const pinia = createPinia();

pinia.use(({ store }) => {
  store.router = markRaw(router);
});

const app = createApp(App);

app.provide('toFixedWithoutRounding', (t, l = 3) => {
  const a = 10 ** l;
  const s = t * a;
  return Math.trunc(s) / a;
});

app.provide('sleep', (ms) => new Promise((resolve) => setTimeout(resolve, ms)));

app.use(pinia);
app.use(router);
app.use(hiveEngine);
app.use(mitt);
app.use(hive);
app.use(vfmPlugin);
app.use(FloatingVue);
app.use(Notifications);
app.use(VueLazyload);

app.component('Loading', Loading);
app.component('Spinner', Spinner);

app.mount('#app');
