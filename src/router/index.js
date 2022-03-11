import { createRouter, createWebHistory } from "vue-router";
import { useUserStore } from "../stores/user";
import HomeView from "../views/HomeView.vue";

function loadView(view) {
  return () => import(`../views/${view}View.vue`);
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
    },
    {
      path: "/tokens",
      name: "tokens",
      component: loadView("Tokens"),
    },
    {
      path: "/trade/:symbol",
      name: "trade",
      component: loadView("Trade"),
    },
    {
      path: "/wallet",
      name: "wallet",
      component: loadView("Wallet"),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: "/history/:symbol",
      name: "history",
      component: loadView("History"),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: "/orders",
      name: "orders",
      component: loadView("Orders"),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: "/rewards",
      name: "rewards",
      component: loadView("Rewards"),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: "/swaps",
      name: "swaps",
      component: loadView("Swaps"),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: "/conversion-history",
      name: "conversion-history",
      component: loadView("ConversionHistory"),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: "/faq",
      name: "faq",
      component: loadView("Faq"),
    },
    {
      path: "/:pathMatch(.*)*",
      component: loadView("NotFound"),
    },
  ],
});

router.beforeEach((to) => {
  const userStore = useUserStore();

  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    return {
      path: "/",
      query: { redirect: btoa(to.fullPath) },
    };
  }
});

export default router;
