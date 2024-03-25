import { createRouter, createWebHistory } from 'vue-router';
import { useStore } from '@/stores';
import { useCardStore } from '@/stores/card';
import { useLeaseStore } from '@/stores/lease';
import { useUserStore } from '@/stores/user';
import HomeView from '@/views/HomeView.vue';

function loadView(view) {
  return () => import(`@/views/${view}View.vue`);
}

const beforeEnterSL = async () => {
  const store = useStore();
  const cardStore = useCardStore();

  store.loading = true;

  await Promise.all([cardStore.fetchSettings(), cardStore.fetchSLSettings(), cardStore.fetchCardDetails()]);

  store.loading = false;
};

const beforeEnterLease = async () => {
  const store = useStore();
  const leaseStore = useLeaseStore();

  store.loading = true;

  await leaseStore.fetchSettings();
  await leaseStore.fetchMetrics();

  store.loading = false;
};

const validateUsername = (to) => {
  const { account } = to.params;

  return /^[a-z][a-z0-9-.]{2,15}$/.test(account);
};

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
      beforeEnter: (to) => {
        const store = useStore();
        const { symbol } = to.params;

        if (store.settings.deprecated_tokens.includes(symbol)) {
          return {
            name: to.name,
            params: { symbol: 'BEE' },
          };
        }
      },
      component: loadView('Trade'),
    },
    {
      path: '/@:account/wallet',
      name: 'wallet',
      component: loadView('Wallet'),
      beforeEnter: [validateUsername],
    },
    {
      path: '/@:account/cards',
      name: 'sl-cards',
      component: () => import('@/views/splinterlands/CardsView.vue'),
      beforeEnter: [beforeEnterSL, validateUsername],
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/@:account/active-rentals',
      name: 'sl-active-rentals',
      component: () => import('@/views/splinterlands/ActiveRentalsView.vue'),
      beforeEnter: [beforeEnterSL, validateUsername],
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/splinterlands',
      name: 'sl-market',
      component: () => import('@/views/splinterlands/MarketView.vue'),
      beforeEnter: [beforeEnterSL],
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
      path: '/lease',
      name: 'lease',
      component: () => import('@/views/leasing/LeaseView.vue'),
      beforeEnter: beforeEnterLease,
    },
    {
      path: '/@:account/leases',
      name: 'leasing-dashboard',
      component: () => import('@/views/leasing/LeasingDashboardView.vue'),
      beforeEnter: [beforeEnterLease, validateUsername],
      meta: {
        requiresAuth: true,
      },
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
      query: { redirect: btoa(JSON.stringify({ name: to.name, params: to.params, query: to.query })) },
    };
  }
});

export default router;
