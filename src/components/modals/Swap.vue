<template>
  <Modal
    name="swapModal"
    v-model="show"
    :click-to-close="false"
    @before-open="beforeOpen"
    @close="onClose"
  >
    <template #title>Swap Tokens</template>

    <Loading small v-if="modalBusy" />

    <template v-else>
      <div class="text-center">
        Choose which token you would like to swap below. For more information about DSwap see the
        <a href="https://dswap.trade/faq" target="_blank">FAQ</a>.
      </div>

      <LoadingOverlay :show="showOverlay">
        <div class="mb-5 mt-10">
          <label for="fromSymbol" class="block mb-2 font-bold">From</label>

          <SearchSelect :options="fromSymbolOptions" v-model="fromSymbol" class="mb-3" />

          <template v-if="fromSymbol">
            <div class="mb-3">Current balance: {{ fromSymbolBalance }} {{ fromSymbol }}</div>

            <div class="flex items-center w-full">
              <input
                id="fromQuantity"
                type="number"
                class="w-full h-10 dark:bg-slate-600 dark:border-gray-500 rounded-l-md focus:ring-0 border-r-inherit border-gray-400 disabled:bg-[rgba(0,0,0,.05)]"
                v-model="fromQuantity"
              />
              <div
                class="bg-gray-200 dark:bg-slate-600 dark:border-gray-500 rounded-r-md h-10 p-2 border border-l-0 border-gray-400"
              >
                {{ fromSymbol }}
              </div>
            </div>
          </template>
        </div>

        <div class="mb-5">
          <label for="toSymbol" class="block mb-2 font-bold">To</label>

          <SearchSelect :options="toSymbolOptions" v-model="toSymbol" class="mb-3" />

          <template v-if="toSymbol">
            <div class="mb-3">Current balance: {{ toSymbolBalance }} {{ toSymbol }}</div>

            <div class="flex items-center w-full">
              <input
                id="toQuantity"
                type="number"
                class="w-full h-10 dark:bg-slate-600 dark:border-gray-500 rounded-l-md focus:ring-0 border-r-inherit border-gray-400 disabled:bg-[rgba(0,0,0,.05)]"
                v-model="toQuantity"
                readonly
              />
              <div
                class="bg-gray-200 dark:bg-slate-600 dark:border-gray-500 rounded-r-md h-10 p-2 border border-l-0 border-gray-400"
              >
                {{ toSymbol }}
              </div>
            </div>
          </template>
        </div>

        <template v-if="fromSymbol && toSymbol">
          <div class="mb-2 font-bold">SWAP Settings</div>

          <div class="mb-3 flex flex-wrap items-center justify-between">
            <div class="text-sm font-bold mr-3">Max Slippage ({{ fromSymbol }} -> SWAP.HIVE)</div>

            <div class="flex items-center">
              <input
                type="number"
                class="w-16 dark:bg-slate-600 dark:border-gray-500 rounded-l-md focus:ring-0 border-r-inherit border-gray-400 disabled:bg-[rgba(0,0,0,.05)]"
                v-model="slippageOne"
              />
              <div
                class="bg-gray-200 dark:bg-slate-600 dark:border-gray-500 rounded-r-md p-2 border border-l-0 border-gray-400"
              >
                %
              </div>
            </div>
          </div>

          <div
            v-if="toSymbol !== 'SWAP.HIVE'"
            class="mb-3 flex flex-wrap items-center justify-between"
          >
            <div class="text-sm font-bold mr-3">Max Slippage (SWAP.HIVE -> {{ toSymbol }})</div>

            <div class="flex items-center">
              <input
                type="number"
                class="w-16 dark:bg-slate-600 dark:border-gray-500 rounded-l-md focus:ring-0 border-r-inherit border-gray-400 disabled:bg-[rgba(0,0,0,.05)]"
                v-model="slippageTwo"
              />
              <div
                class="bg-gray-200 dark:bg-slate-600 dark:border-gray-500 rounded-r-md p-2 border border-l-0 border-gray-400"
              >
                %
              </div>
            </div>
          </div>
        </template>
      </LoadingOverlay>

      <div class="alert-warning text-center font-bold" v-if="btnBusy">
        Swap request is in progress. Please do not close this modal.
      </div>

      <div class="text-center mt-10">
        <button
          class="btn w-4/5 text-lg"
          :disabled="
            !fromSymbol ||
            !toSymbol ||
            fromQuantity <= 0 ||
            toQuantity <= 0 ||
            btnBusy ||
            showOverlay
          "
          @click.prevent="requestSwap"
        >
          <Spinner v-if="btnBusy" />
          {{ " " }} Swap
        </button>
      </div>
    </template>
  </Modal>
</template>

<script>
import axios from "axios";
import { computed, defineComponent, inject, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { debouncedWatch } from "@vueuse/core";
import { DSWAP_API, DSWAP_ACCOUNT, DSWAP_SOURCE_ID } from "../../config";
import { useStore } from "../../stores";
import { useTokenStore } from "../../stores/token";
import { useWalletStore } from "../../stores/wallet";
import { toFixedWithoutRounding } from "../../utils";
import { useUserStore } from "../../stores/user";
import Modal from "./Modal.vue";
import SearchSelect from "../utilities/SearchSelect.vue";
import LoadingOverlay from "../utilities/LoadingOverlay.vue";

export default defineComponent({
  name: "SwapModal",

  components: {
    Modal,
    SearchSelect,
    LoadingOverlay,
  },

  setup() {
    const event = inject("eventBus");
    const vfm$ = inject("$vfm");
    const show = ref(false);
    const modalBusy = ref(true);
    const btnBusy = ref(false);
    const showOverlay = ref(false);

    const dswapAPI = axios.create({
      baseURL: DSWAP_API,
    });

    const router = useRouter();

    const store = useStore();
    const tokenStore = useTokenStore();
    const walletStore = useWalletStore();
    const userStore = useUserStore();

    const fromSymbol = ref(null);
    const toSymbol = ref(null);

    const fromQuantity = ref("");
    const toQuantity = ref("");

    const slippageOne = ref(5);
    const slippageTwo = ref(5);

    const baseTokenAmount = ref(0);

    const tokens = computed(() => tokenStore.tokens);
    const wallet = computed(() => walletStore.wallet);
    const username = computed(() => userStore.username);

    const fromSymbolOptions = computed(() => {
      const options = tokens.value.map((t) => ({
        text: `${t.name} (${t.symbol})`,
        value: t.symbol,
      }));

      return [{ value: null, text: "Please select a token" }, ...options];
    });

    const toSymbolOptions = computed(() => {
      const options = tokens.value
        .filter((t) => {
          if (fromSymbol.value) {
            return !(t.symbol === fromSymbol.value);
          }

          return true;
        })
        .map((t) => ({ text: `${t.name} (${t.symbol})`, value: t.symbol }));

      return [{ value: null, text: "Please select a token" }, ...options];
    });

    const fromSymbolBalance = computed(() => {
      if (fromSymbol.value) {
        const bal = wallet.value.find((t) => t.symbol === fromSymbol.value);

        if (bal) {
          return bal.balance;
        }
      }

      return 0;
    });

    const toSymbolBalance = computed(() => {
      if (toSymbol.value) {
        const bal = wallet.value.find((t) => t.symbol === toSymbol.value);

        if (bal) {
          return bal.balance;
        }
      }

      return 0;
    });

    const beforeOpen = async () => {
      modalBusy.value = true;

      const requests = [await walletStore.fetchWallet()];

      if (tokens.value.length <= 0) {
        requests.push(tokenStore.fetchTokens());
      }

      await Promise.all(requests);

      modalBusy.value = false;
    };

    const onClose = () => {
      fromSymbol.value = null;
      toSymbol.value = null;

      fromQuantity.value = "";
      toQuantity.value = "";

      slippageOne.value = 5;
      slippageTwo.value = 5;

      showOverlay.value = false;

      baseTokenAmount.value = 0;
    };

    const requestSwap = async () => {
      btnBusy.value = true;

      await walletStore.requestTransfer({
        to: DSWAP_ACCOUNT,
        symbol: fromSymbol.value,
        quantity: fromQuantity.value.toString(),
        memo: "SwapRequest",
        eventName: "dswap-transfer-successful",
      });

      btnBusy.value = false;
    };

    watch(fromSymbol, (value) => {
      if (toSymbol.value && value === toSymbol.value) {
        toSymbol.value = null;
      }
    });

    watch(toSymbol, (value) => {
      if (fromSymbol.value && value === fromSymbol.value) {
        toSymbol.value = null;
      }
    });

    debouncedWatch(
      fromQuantity,
      async () => {
        if (toSymbol.value) {
          showOverlay.value = true;

          try {
            const postData = {
              Chain: 1,
              TokenInput: fromSymbol.value,
              TokenInputAmount: fromQuantity.value,
              TokenOutput: toSymbol.value,
            };

            const {
              data: { TokenOutputAmount, BaseTokenAmount },
            } = await dswapAPI.post("SwapRequest/CalculateSwapOutput", postData);

            toQuantity.value = toFixedWithoutRounding(TokenOutputAmount, 8);
            baseTokenAmount.value = BaseTokenAmount;
          } catch (e) {
            console.log(e.message);
          }

          showOverlay.value = false;
        }
      },
      { debounce: 500 }
    );

    onMounted(() => {
      event.on("dswap-transfer-successful", async ({ id }) => {
        showOverlay.value = true;
        btnBusy.value = true;

        await store.validateTransaction(id, 10);
      });

      event.on(
        "transaction-validated",
        async ({ error, contract, action, payload, trx_id: trxId }) => {
          if (
            !error &&
            contract === "tokens" &&
            action === "transfer" &&
            payload.to === DSWAP_ACCOUNT
          ) {
            try {
              const postData = {
                Chain: 1,
                Account: username.value,
                TokenInput: fromSymbol.value,
                TokenInputAmount: fromQuantity.value,
                TokenOutput: toSymbol.value,
                TokenOutputAmount: toQuantity.value,
                SwapSourceId: DSWAP_SOURCE_ID,
                ChainTransactionId: trxId,
                MaxSlippageInputToken: slippageOne.value,
                MaxSlippageOutputToken: slippageTwo.value,
                BaseTokenAmount: baseTokenAmount.value,
                TokenInputMemo: "",
              };

              await dswapAPI.post("SwapRequest", postData);

              await vfm$.hideAll();

              router.push({ name: "swaps" });
            } catch (e) {
              console.log(e.message);
            }
          }

          btnBusy.value = false;
          showOverlay.value = false;
        }
      );
    });

    onBeforeUnmount(() => {
      event.off("dswap-transfer-successful");
      event.off("transaction-validated");
    });

    return {
      show,
      modalBusy,
      btnBusy,
      showOverlay,

      fromSymbol,
      toSymbol,

      fromQuantity,
      toQuantity,

      fromSymbolOptions,
      toSymbolOptions,

      fromSymbolBalance,
      toSymbolBalance,

      slippageOne,
      slippageTwo,

      beforeOpen,
      onClose,
      requestSwap,
    };
  },
});
</script>
