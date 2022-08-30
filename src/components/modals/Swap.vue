<template>
  <Modal
    v-model="show"
    name="swapModal"
    :click-to-close="false"
    @before-open="beforeOpen"
    @before-close="beforeClose"
    @closed="onClosed"
  >
    <template #title>Swap Tokens</template>

    <Loading v-if="modalBusy" small />

    <template v-else>
      <div class="text-center">
        Choose which token you would like to swap below. For more information about DSwap see the
        <a href="https://dswap.trade/faq" target="_blank">FAQ</a>.
      </div>

      <LoadingOverlay :show="showOverlay">
        <div class="mb-5 mt-10">
          <label for="fromSymbol" class="block mb-2 font-bold">From</label>

          <SearchSelect
            v-model="fromSymbol"
            :options="fromSymbolOptions"
            classes="mb-3 rounded-md"
          />

          <template v-if="fromSymbol">
            <div class="mb-3">Current balance: {{ fromSymbolBalance }} {{ fromSymbol }}</div>

            <div class="flex items-center w-full">
              <input
                id="fromQuantity"
                v-model="fromQuantity"
                type="number"
                class="w-full h-10 dark:bg-slate-600 dark:border-gray-500 rounded-l-md focus:ring-0 border-r-inherit border-gray-400 disabled:bg-[rgba(0,0,0,.05)]"
              />
              <div
                class="bg-gray-200 dark:bg-slate-600 dark:border-gray-500 rounded-r-md h-10 p-2 border border-l-0 border-gray-400"
              >
                {{ fromSymbol }}
              </div>
            </div>
            <div class="text-sm mt-1">Estimated value (USD): ${{ fromPriceUSD }}</div>
          </template>
        </div>

        <div class="mb-5">
          <label for="toSymbol" class="block mb-2 font-bold">To</label>

          <SearchSelect v-model="toSymbol" :options="toSymbolOptions" classes="mb-3 rounded-md" />

          <template v-if="toSymbol">
            <div class="mb-3">Current balance: {{ toSymbolBalance }} {{ toSymbol }}</div>

            <div class="flex items-center w-full">
              <input
                id="toQuantity"
                v-model="toQuantity"
                type="number"
                class="w-full h-10 dark:bg-slate-600 dark:border-gray-500 rounded-l-md focus:ring-0 border-r-inherit border-gray-400 disabled:bg-[rgba(0,0,0,.05)]"
                readonly
              />
              <div
                class="bg-gray-200 dark:bg-slate-600 dark:border-gray-500 rounded-r-md h-10 p-2 border border-l-0 border-gray-400"
              >
                {{ toSymbol }}
              </div>
            </div>
            <div class="text-sm mt-1">Estimated value (USD): ${{ toPriceUSD }}</div>
          </template>
        </div>

        <template v-if="fromSymbol && toSymbol">
          <div class="mb-2 font-bold">SWAP Settings</div>

          <div class="mb-3 flex flex-wrap items-center justify-between">
            <div class="text-sm font-bold mr-3">Max Slippage ({{ fromSymbol }} -> SWAP.HIVE)</div>

            <div class="flex items-center">
              <input
                v-model="slippageOne"
                type="number"
                class="w-16 dark:bg-slate-600 dark:border-gray-500 rounded-l-md focus:ring-0 border-r-inherit border-gray-400 disabled:bg-[rgba(0,0,0,.05)]"
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
                v-model="slippageTwo"
                type="number"
                class="w-16 dark:bg-slate-600 dark:border-gray-500 rounded-l-md focus:ring-0 border-r-inherit border-gray-400 disabled:bg-[rgba(0,0,0,.05)]"
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

      <div v-if="swapInProgress" class="alert-warning text-center font-bold">
        Swap request is in progress. Please do not close this modal.
      </div>

      <div v-if="valueDiffInPct >= 0.15" class="alert-warning">
        <div>
          The price impact of this swap is higher than 15%. You may incur substantial losses by
          executing this swap. Please check carefully before proceeding.
        </div>

        <label class="block mt-1 font-bold"
          ><input v-model="riskAccepted" type="checkbox" /> I have checked, please let me
          swap.</label
        >
      </div>

      <div class="text-center mt-10">
        <button
          class="btn w-4/5 text-lg"
          :disabled="
            !fromSymbol ||
            !toSymbol ||
            fromQuantity <= 0 ||
            toQuantity <= 0 ||
            (!riskAccepted && valueDiffInPct >= 0.15) ||
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

<script setup>
import axios from "axios";
import { computed, inject, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { debouncedWatch } from "@vueuse/core";
import { DSWAP_API, DSWAP_ACCOUNT, DSWAP_SOURCE_ID } from "../../config";
import { useStore } from "../../stores";
import { useTokenStore } from "../../stores/token";
import { useWalletStore } from "../../stores/wallet";
import { toFixedNoRounding, toFixedWithoutRounding } from "../../utils";
import { useUserStore } from "../../stores/user";
import Modal from "./Modal.vue";
import SearchSelect from "../utilities/SearchSelect.vue";
import LoadingOverlay from "../utilities/LoadingOverlay.vue";
import { sidechain } from "../../plugins/sidechain";

const event = inject("eventBus");
const vfm$ = inject("$vfm");
const show = ref(false);
const modalBusy = ref(true);
const btnBusy = ref(false);
const showOverlay = ref(false);
const swapInProgress = ref(false);
const riskAccepted = ref(false);

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

const fromMetrics = ref(null);
const toMetrics = ref(null);

const slippageOne = ref(5);
const slippageTwo = ref(5);

const baseTokenAmount = ref(0);

const tokens = computed(() => tokenStore.tokens);
const wallet = computed(() => walletStore.wallet);
const username = computed(() => userStore.username);

const fromPriceUSD = computed(() => {
  if (fromQuantity.value > 0 && fromMetrics.value) {
    return toFixedNoRounding(
      fromQuantity.value * Number(fromMetrics.value?.highestBid) * store.hivePrice,
      5
    );
  }

  return 0;
});

const toPriceUSD = computed(() => {
  if (toQuantity.value > 0 && toMetrics.value) {
    return toFixedNoRounding(
      toQuantity.value * Number(toMetrics.value?.lastPrice) * store.hivePrice,
      5
    );
  }

  return 0;
});

const valueDiffInPct = computed(() => {
  if (showOverlay.value || fromQuantity.value <= 0 || toQuantity.value <= 0) {
    return 0;
  }

  return toFixedWithoutRounding((fromPriceUSD.value - toPriceUSD.value) / fromPriceUSD.value, 3);
});

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

const beforeClose = async (e) => {
  if (swapInProgress.value) {
    if (
      confirm(
        "Swap request is in progress. If you close this modal, your swap will fail. Click cancel to stop closing the modal."
      )
    ) {
      await vfm$.hideAll();

      onClosed();
    } else {
      e.stop();
    }
  }
};

const onClosed = () => {
  fromSymbol.value = null;
  toSymbol.value = null;

  fromQuantity.value = "";
  toQuantity.value = "";

  slippageOne.value = 5;
  slippageTwo.value = 5;

  showOverlay.value = false;
  swapInProgress.value = false;

  baseTokenAmount.value = 0;

  riskAccepted.value = false;
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

const onTransferSuccessful = async ({ id }) => {
  showOverlay.value = true;
  swapInProgress.value = true;

  await store.validateTransaction(id, 10);
};

const onTransactionValidated = async ({ error, contract, action, payload, trx_id: trxId }) => {
  if (!error && contract === "tokens" && action === "transfer" && payload.to === DSWAP_ACCOUNT) {
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

      swapInProgress.value = false;
      showOverlay.value = false;

      await vfm$.hideAll();

      onClosed();

      router.push({ name: "swaps" });
    } catch (e) {
      console.log(e.message);
    }
  }

  swapInProgress.value = false;
  showOverlay.value = false;
};

watch(fromSymbol, async (value) => {
  if (toSymbol.value && value === toSymbol.value) {
    toSymbol.value = null;
  }

  if (value) {
    fromMetrics.value =
      value === "SWAP.HIVE" ? { highestBid: 1, lastPrice: 1 } : await sidechain.getMetrics(value);
  }
});

watch(toSymbol, async (value) => {
  fromQuantity.value = 1;

  if (fromSymbol.value && value === fromSymbol.value) {
    toSymbol.value = null;
  }

  if (value) {
    toMetrics.value =
      value === "SWAP.HIVE" ? { highestBid: 1, lastPrice: 1 } : await sidechain.getMetrics(value);
  }
});

watch(fromQuantity, () => {
  if (toSymbol.value) {
    showOverlay.value = true;
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
  event.on("dswap-transfer-successful", onTransferSuccessful);
  event.on("transaction-validated", onTransactionValidated);
});

onBeforeUnmount(() => {
  event.off("dswap-transfer-successful", onTransferSuccessful);
  event.off("transaction-validated", onTransactionValidated);
});
</script>
