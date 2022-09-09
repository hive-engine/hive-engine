import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { useCardStore } from '@/stores/card';
import HomeView from '@/views/HomeView.vue';
import { useStore } from '@/stores';

function loadView(view) {
  const path = `../views/${view}View.vue`;
  return () => import(/* @vite-ignore */ path);
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/tokens',
      name: 'tokens',
      component: loadView('Tokens'),
    },
    {
      path: '/trade/:symbol',
      name: 'trade',
      component: loadView('Trade'),
    },
    {
      path: '/@:account/wallet',
      name: 'wallet',
      component: loadView('Wallet'),
      beforeEnter: (to) => {
        const { account } = to.params;

        return /^[a-z][a-z0-9-.]{2,15}$/.test(account);
      },
    },
    {
      path: '/@:account/cards',
      name: 'sl-cards',
      component: loadView('splinterlands/Cards'),
      beforeEnter: async (to) => {
        const cardStore = useCardStore();

        await Promise.all([cardStore.fetchSettings(), cardStore.fetchSLSettings(), cardStore.fetchCardDetails()]);

        const { account } = to.params;

        return /^[a-z][a-z0-9-.]{2,15}$/.test(account);
      },
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/splinterlands',
      name: 'sl-market',
      component: loadView('splinterlands/Market'),
      beforeEnter: async () => {
        const cardStore = useCardStore();

        await Promise.all([cardStore.fetchSettings(), cardStore.fetchSLSettings(), cardStore.fetchCardDetails()]);
      },
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/history/:symbol',
      name: 'history',
      component: loadView('History'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/orders',
      name: 'orders',
      component: loadView('Orders'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/rewards',
      name: 'rewards',
      component: loadView('Rewards'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/swaps',
      name: 'swaps',
      component: loadView('Swaps'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/conversion-history',
      name: 'conversion-history',
      component: loadView('ConversionHistory'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/faq',
      name: 'faq',
      component: loadView('Faq'),
    },
    {
      path: '/:pathMatch(.*)*',
      component: loadView('NotFound'),
    },
  ],
});

router.beforeEach(async (to) => {
  const store = useStore();
  const userStore = useUserStore();

  if (!store.settings) {
    await store.fetchSettings();
  }

  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    return {
      path: '/',
      query: { redirect: btoa(to.fullPath) },
    };
  }
});

export default router;
