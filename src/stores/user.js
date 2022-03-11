import { defineStore } from "pinia";
import { useStore } from ".";
import { emitter } from "../plugins/mitt";

export const useUserStore = defineStore({
  id: "user",

  state: () => ({
    username: "",
  }),

  getters: {
    isLoggedIn: (state) => Boolean(state.username),
  },

  actions: {
    async requestLogin(username) {
      const ts = Date.now();

      if (window.hive_keychain) {
        emitter.emit("login-awaiting");

        const store = useStore();

        const { success } = await store.requestKeychain(
          "requestSignBuffer",
          username,
          `${username}${ts}`,
          "Posting"
        );

        if (success) {
          this.username = username;

          localStorage.setItem("username", username);
        }

        emitter.emit("login-done");

        let { redirect } = this.router.currentRoute.value.query;

        if (redirect) {
          redirect = atob(redirect);

          if (this.router.hasRoute(redirect)) {
            this.router.push({ name: redirect });
          }
        }
      }
    },

    requestLogout() {
      this.username = "";

      localStorage.removeItem("username");

      this.router.push("/");
    },
  },
});
