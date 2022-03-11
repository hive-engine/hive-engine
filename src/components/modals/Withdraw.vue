<template>
  <vue-final-modal
    v-model="show"
    v-slot="{ params, close }"
    classes="flex justify-center items-center"
    content-class="w-full max-w-xl relative flex flex-col max-h-full border dark:border-gray-800 rounded bg-white dark:bg-gray-600 dark:text-gray-300"
    name="withdrawModal"
    @before-open="beforeOpen"
    @closed="modalClose"
  >
    <div class="flex items-center justify-between px-6 py-4">
      <div class="text-3xl font-bold leading-6 text-gray-900 dark:text-gray-300">Withdraw Tokens</div>

      <button class="dark:text-gray-300" @click="close">
        <x-icon class="h-5 w-5" aria-hidden="true" />
      </button>
    </div>

    <div class="p-6 flex-grow">
      <Loading small v-if="modalBusy" />

      <template v-else>
        <div class="alert-warning mb-5 font-bold">
          There is a 0.75% fee on withdrawals. For Ethereum, ERC-20, BNB, BEP-20, Polygon (MATIC)
          and Polygon ERC-20 withdrawals fee is 1% and you will also pay for the Ethereum / BSC /
          Polygon network gas fee.
        </div>

        <SearchSelect
          class="rounded-md mb-3"
          menu-class="rounded-md"
          :options="tokens"
          v-model="selectedToken"
        />

        <template v-if="selectedToken">
          <template v-if="isWithdrawalDisabled.disabled">
            <div class="alert-warning">{{ isWithdrawalDisabled.reason }}</div>
          </template>

          <template v-else>
            <template v-if="isEvmToken">
              <SearchSelect
                class="rounded-md mb-3"
                menu-class="rounded-md"
                :options="evmTokenOptions"
                v-model="evmToken"
              />
            </template>

            <div class="mb-3">
              <label class="block mb-2 font-bold">Available Balance</label>
              <div
                class="cursor-pointer"
                @click="withdrawAmount = tokenBalance"
              >{{ tokenBalance }} {{ isEvmToken ? evmToken : selectedToken }}</div>
            </div>

            <div class="mb-3">
              <label for="withdrawAmount" class="block mb-2 font-bold">Withdraw Amount</label>

              <div class="flex items-center">
                <input
                  id="withdrawAmount"
                  type="number"
                  step="any"
                  :class="[
                    v$.withdrawAmount.$error
                      ? 'border-red-500 dark:border-red-500 focus:border-red-500 focus:ring-red-500'
                      : '',
                    'rounded-l-md w-full dark:bg-slate-600 dark:border-gray-500',
                  ]"
                  v-model="withdrawAmount"
                />
                <div
                  class="bg-gray-200 dark:bg-slate-600 dark:border-gray-500 rounded-r-md p-2 border border-l-0 border-gray-400"
                >{{ isEvmToken && evmToken ? evmToken : selectedToken }}</div>
              </div>
              <div
                v-if="v$.withdrawAmount.$error"
                class="text-sm text-red-500 mt-1"
              >Please enter a valid amount to withdraw.</div>
            </div>

            <div class="mb-3">
              <label for="withdrawAddress" class="block mb-2 font-bold">Withdraw Address</label>
              <input
                id="withdrawAddress"
                type="text"
                :class="[
                  v$.withdrawAddress.$error
                    ? 'border-red-500 dark:border-red-500 focus:border-red-500 focus:ring-red-500'
                    : '',
                  'rounded-md w-full dark:bg-slate-600 dark:border-gray-500',
                ]"
                :disabled="selectedToken === 'SWAP.HIVE'"
                v-model="withdrawAddress"
              />
              <div
                v-if="v$.withdrawAddress.$error"
                class="text-sm text-red-500 mt-1"
              >Please enter a valid receiving address.</div>
            </div>

            <div class="mb-3" v-if="showMemoField">
              <label for="withdrawMemo" class="block mb-2 font-bold">Withdraw Memo</label>
              <input
                id="withdrawMemo"
                type="text"
                class="rounded-md w-full dark:bg-slate-600 dark:border-gray-500"
                v-model="withdrawMemo"
              />
            </div>

            <template v-if="isEvmToken && evmToken">
              <div class="flex items-center justify-between">
                <div class="mb-3">
                  <div class="mb-2 font-bold">Gas Fee</div>
                  <div>{{ evmGasFee }} {{ evmFeeSymbol }}</div>
                  <a
                    class="cursor-pointer text-sm font-bold text-red-500"
                    @click.prevent="walletStore.fetchGasFee(network, evmToken)"
                  >Refresh</a>
                </div>

                <div class="mb-3">
                  <div class="mb-2 font-bold">Fee Balance</div>
                  <div>{{ gasFeeBalance }} {{ evmFeeSymbol }}</div>
                  <a
                    class="cursor-pointer text-sm font-bold text-red-500 mr-5"
                    @click.prevent="walletStore.fetchFeeBalance(network)"
                  >Refresh</a>
                  <a
                    class="cursor-pointer text-sm font-bold text-red-500"
                    @click.prevent="vfm$.show('feeDepositModal')"
                  >Deposit</a>
                </div>
              </div>
            </template>

            <div
              v-if="minimumWithdrawAmount > 0"
              class="mb-3"
            >Minimum withdrawal amount: {{ minimumWithdrawAmount }} {{ selectedToken }}</div>

            <div class="mb-3">You will receive (estimated): {{ receiveAmount }} {{ receiveSymbol }}</div>

            <div v-if="selectedToken === 'SWAP.BLURT'" class="text-sm mb-3">
              SWAP.BLURT withdrawal has 0.100 SWAP.BLURT transaction fee of the Blurt Blockchain on
              top of the 0.75% withdrawal fee of Hive-Engine.
            </div>

            <button
              class="btn"
              :disabled="
                minimumWithdrawAmount > tokenBalance ||
                withdrawAmount <= 0 ||
                withdrawAmount > tokenBalance ||
                (isEvmToken && evmGasFee > gasFeeBalance)
              "
              @click.prevent="withdrawToken"
            >
              <Spinner v-if="btnBusy" />
              {{ " " }} Withdraw
              {{ isEvmToken ? evmToken : selectedToken }}
            </button>
          </template>
        </template>
      </template>
    </div>
  </vue-final-modal>

  <vue-final-modal
    v-model="feeDepositModalshow"
    v-slot="{ params, close }"
    classes="flex justify-center items-center"
    content-class="w-full max-w-lg relative flex flex-col max-h-full border dark:border-gray-800 rounded bg-white dark:bg-gray-600 dark:text-gray-300"
    name="feeDepositModal"
    @before-open="beforeDepositModalOpen"
    @closed="onFeeDepositModalClose"
  >
    <div class="flex items-center justify-between px-6 py-4">
      <div class="text-2xl font-bold leading-6 text-gray-900 dark:text-gray-300">Deposit Gas Fee</div>

      <button class="dark:text-gray-300" @click="close">
        <x-icon class="h-5 w-5" aria-hidden="true" />
      </button>
    </div>

    <div class="p-6 flex-grow" v-if="!modalBusy">
      <div class="mb-3">
        In order to withdraw {{ selectedToken }} tokens, you must provide enough
        {{ evmFeeSymbol }} to cover the network gas fee. This reserved fee balance is
        non-refundable.
      </div>

      <div class="font-bold mb-3">Fee deposits can take up to 5 minutes to reflect in balance.</div>

      <div class="mb-3">
        <label class="block mb-2 font-bold">Available Balance</label>
        <div
          class="cursor-pointer"
          @click="feeDepositAmount = evmFeeSymbolBalance"
        >{{ evmFeeSymbolBalance }} {{ evmFeeSymbol }}</div>
      </div>

      <div class="mb-3">
        <label for="depositAmount" class="block mb-2 font-bold">Deposit Amount</label>

        <div class="flex items-center">
          <input
            id="depositAmount"
            type="number"
            step="any"
            class="rounded-l-md w-full dark:bg-slate-600 dark:border-gray-500"
            v-model="feeDepositAmount"
          />
          <div
            class="bg-gray-200 dark:bg-slate-600 dark:border-gray-500 rounded-r-md p-2 border border-l-0 border-gray-400"
          >{{ evmFeeSymbol }}</div>
        </div>
      </div>

      <button
        class="btn"
        :disabled="feeDepositAmount <= 0 || feeDepositAmount > evmFeeSymbolBalance"
        @click.prevent="depositGasFee"
      >Deposit Fee</button>
    </div>
  </vue-final-modal>
</template>

<script>
import { computed, defineComponent, inject, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { XIcon } from "@heroicons/vue/outline";
import { useVuelidate } from "@vuelidate/core";
import { required, requiredIf } from "@vuelidate/validators";
import { useStore } from "../../stores";
import { useUserStore } from "../../stores/user";
import { useTokenStore } from "../../stores/token";
import { useWalletStore } from "../../stores/wallet";
import { sidechain } from "../../plugins/sidechain";
import { toFixedWithoutRounding } from "../../utils";
import SearchSelect from "../utilities/SearchSelect.vue";
import { utils } from "ethers";

export default defineComponent({
  name: "WithdrawModal",

  components: {
    XIcon,
    SearchSelect,
  },

  setup() {
    const vfm$ = inject("$vfm");
    const event = inject("eventBus");
    const show = ref(false);
    const feeDepositModalshow = ref(false);
    const modalBusy = ref(true);
    const btnBusy = ref(false);

    const store = useStore();
    const userStore = useUserStore();
    const tokenStore = useTokenStore();
    const walletStore = useWalletStore();

    const selectedToken = ref(null);
    const withdrawAmount = ref("");
    const withdrawAddress = ref("");
    const withdrawMemo = ref("");
    const tokenBalance = ref(0);

    const feeDepositAmount = ref("");
    const evmFeeSymbolBalance = ref(0);

    const settings = computed(() => store.settings);
    const username = computed(() => userStore.username);
    const peggedTokens = computed(() => tokenStore.peggedTokens);
    const evmTokens = computed(() => tokenStore.evmTokens);
    const evmGasFee = computed(() => walletStore.evmGasFee);
    const gasFeeBalance = computed(() => walletStore.gasFeeBalance);

    const isEvmToken = ref(false);
    const evmToken = ref(null);

    const tokens = computed(() => {
      let tokens = [
        ...peggedTokens.value,
        settings.value.eth_bridge.ethereum,
        settings.value.bsc_bridge.bnb,
        settings.value.polygon_bridge.matic,
      ];

      if (settings.value.eth_bridge.erc_20.enabled) {
        tokens.push({ name: "Ethereum Tokens", symbol: "ERC20", pegged_token_symbol: "ERC20" });
      }

      if (settings.value.bsc_bridge.bep_20.enabled) {
        tokens.push({
          name: "Binance Smart Chain Tokens",
          symbol: "BEP20",
          pegged_token_symbol: "BEP20",
        });
      }

      if (settings.value.polygon_bridge.erc_20.enabled) {
        tokens.push({
          name: "Polygon Tokens",
          symbol: "POLY-ERC20",
          pegged_token_symbol: "POLY-ERC20",
        });
      }

      tokens = tokens
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((t) => ({
          value: t.pegged_token_symbol,
          text: `${t.name} (${t.symbol})`,
          symbol: t.symbol,
        }));

      return [{ value: null, text: "Please select a token" }, ...tokens];
    });

    const evmTokenOptions = computed(() => {
      const allEvmTokens = evmTokens.value.map((t) => ({
        value: t.pegged_token_symbol,
        text: `${t.name} (${t.symbol})`,
      }));

      return [{ value: null, text: "Please select a token" }, ...allEvmTokens];
    });

    const isWithdrawalDisabled = computed(() => {
      const token = settings.value.disabled_withdrawals.find(
        (t) => t.symbol === selectedToken.value
      );

      return {
        disabled: !!token,
        ...token,
      };
    });

    const evmAssets = computed(() => {
      const {
        eth_bridge: {
          ethereum: { pegged_token_symbol: peggedEth },
        },
        bsc_bridge: {
          bnb: { pegged_token_symbol: peggedBnb },
        },
        polygon_bridge: {
          matic: { pegged_token_symbol: peggedMatic },
        },
      } = settings.value;

      return [peggedEth, peggedBnb, peggedMatic];
    });

    const evmFeeSymbol = computed(() => {
      const {
        eth_bridge: {
          ethereum: { pegged_token_symbol: peggedEth },
        },
        bsc_bridge: {
          bnb: { pegged_token_symbol: peggedBnb },
        },
        polygon_bridge: {
          matic: { pegged_token_symbol: peggedMatic },
        },
      } = settings.value;

      const feeSymbols = {
        ETH: peggedEth,
        ERC20: peggedEth,
        BNB: peggedBnb,
        BEP20: peggedBnb,
        MATIC: peggedMatic,
        "POLY-ERC20": peggedMatic,
      };

      return feeSymbols[selectedToken.value];
    });

    const network = computed(() => {
      const networks = {
        ["SWAP.ETH"]: "eth",
        ERC20: "eth",
        ["SWAP.BNB"]: "bsc",
        BEP20: "bsc",
        ["SWAP.MATIC"]: "polygon",
        "POLY-ERC20": "polygon",
      };

      return networks[selectedToken.value];
    });

    const receiveAmount = computed(() => {
      let receiveAmount = 0;

      if (withdrawAmount.value > 0) {
        receiveAmount = toFixedWithoutRounding(withdrawAmount.value * 0.9925, 8);

        if ([...evmAssets.value, "ERC20", "BEP20", "POLY-ERC20"].includes(selectedToken.value)) {
          receiveAmount = toFixedWithoutRounding(withdrawAmount.value * 0.99 - evmGasFee.value, 8);
        } else if (selectedToken.value === "SWAP.BLURT") {
          receiveAmount = toFixedWithoutRounding(receiveAmount - 0.1, 3);
        } else if (selectedToken.value === "SWAP.HIVE") {
          receiveAmount = toFixedWithoutRounding(receiveAmount, 3);
        }
      }

      return receiveAmount;
    });

    const receiveSymbol = computed(() => {
      if (isEvmToken.value && evmToken.value) {
        const { symbol } = evmTokens.value.find((t) => t.pegged_token_symbol === evmToken.value);

        return symbol;
      } else if (selectedToken.value) {
        const { symbol } = tokens.value.find((t) => t.value === selectedToken.value);

        return symbol;
      }

      return undefined;
    });

    const minimumWithdrawAmount = computed(() => {
      let min = 0;
      const minWithdrawals = new Map(settings.value.minimum_withdrawals);

      if (selectedToken.value) {
        min = minWithdrawals.get(selectedToken.value) || 0;
      }

      return min;
    });

    const showMemoField = computed(() => {
      const supportsMemo = ["SWAP.EOS", "SWAP.BTS"];

      return supportsMemo.includes(selectedToken.value);
    });

    const rules = {
      withdrawAmount: {
        required,
        minValue(value) {
          if (minimumWithdrawAmount.value > 0) {
            return value >= minimumWithdrawAmount.value;
          }

          return value > 0;
        },
      },

      withdrawAddress: {
        requiredIf: requiredIf(() => {
          return selectedToken.value !== "SWAP.HIVE";
        }),
        validAddress: (value) => {
          if (evmAssets.value.includes(selectedToken.value) || isEvmToken.value) {
            return utils.isAddress(value);
          }

          return true;
        },
      },
    };

    const v$ = useVuelidate(rules, { withdrawAmount, withdrawAddress });

    const depositGasFee = async () => {
      await walletStore.requestDepositGasFee({
        amount: toFixedWithoutRounding(feeDepositAmount.value, 8),
        symbol: evmFeeSymbol.value,
        network: network.value,
      });
    };

    const withdrawToken = async () => {
      v$.value.$touch();

      const symbol = ["ERC20", "BEP20", "POLY-ERC20"].includes(selectedToken.value)
        ? evmToken.value
        : selectedToken.value;

      let amount = withdrawAmount.value;

      if (symbol === "SWAP.BLURT") {
        amount = toFixedWithoutRounding(amount, 3);
      }
      if (!v$.value.$invalid) {
        btnBusy.value = true;

        await walletStore.requestTokenWithdrawal({
          amount: amount.toString(),
          symbol,
          address: withdrawAddress.value.trim(),
          memo: withdrawMemo.value.trim(),
          network: network.value,
        });

        btnBusy.value = false;
      }
    };

    const beforeOpen = async () => {
      modalBusy.value = true;

      if (!settings.value) {
        await store.fetchSettings();
      }

      await tokenStore.fetchPeggedTokens();

      modalBusy.value = false;
    };

    const modalClose = () => {
      selectedToken.value = null;
      withdrawAmount.value = "";
      withdrawAddress.value = "";
      withdrawMemo.value = "";
      tokenBalance.value = 0;
    };

    const beforeDepositModalOpen = async () => {
      const balance = await sidechain.getBalance(username.value, evmFeeSymbol.value);

      evmFeeSymbolBalance.value = balance ? Number(balance.balance) : 0;
    };

    const onFeeDepositModalClose = () => {
      feeDepositAmount.value = "";
      evmFeeSymbolBalance.value = 0;
    };

    onMounted(() => {
      event.on("fee-deposit-successful", () => {
        feeDepositModalshow.value = false;
      });
    });

    onBeforeUnmount(() => {
      event.off("fee-deposit-successful");
    });

    watch(selectedToken, async (value) => {
      modalBusy.value = true;

      v$.value.$reset();

      isEvmToken.value = false;
      tokenBalance.value = 0;

      withdrawAddress.value = "";

      if (value === "SWAP.HIVE") {
        withdrawAddress.value = username.value;
      } else if (evmAssets.value.includes(value)) {
        await walletStore.fetchGasFee(network.value, value);
      } else if (["ERC20", "BEP20", "POLY-ERC20"].includes(value)) {
        isEvmToken.value = true;

        await Promise.all([
          tokenStore.fetchSupportedEvmTokens({ network: network.value, withdrawal: true }),
          walletStore.fetchFeeBalance(network.value),
        ]);
      }

      withdrawMemo.value = "";
      withdrawAmount.value = "";

      if (!["ERC20", "BEP20", "POLY-ERC20"].includes(value)) {
        const balance = await sidechain.getBalance(username.value, value);

        tokenBalance.value = balance ? Number(balance.balance) : 0;
      }

      modalBusy.value = false;
    });

    watch(evmToken, async (value) => {
      v$.value.$reset();

      const [balance] = await Promise.all([
        sidechain.getBalance(username.value, value),
        walletStore.fetchGasFee(network.value, value),
        walletStore.fetchFeeBalance(network.value),
      ]);

      tokenBalance.value = balance ? Number(balance.balance) : 0;
    });

    return {
      v$,
      vfm$,
      show,
      feeDepositModalshow,
      modalBusy,
      btnBusy,

      selectedToken,
      tokens,
      evmTokenOptions,
      evmGasFee,
      gasFeeBalance,
      evmFeeSymbol,
      isWithdrawalDisabled,
      network,

      withdrawAmount,
      withdrawAddress,
      withdrawMemo,
      tokenBalance,
      receiveAmount,
      receiveSymbol,
      minimumWithdrawAmount,
      showMemoField,

      isEvmToken,
      evmToken,

      feeDepositAmount,
      evmFeeSymbolBalance,

      beforeOpen,
      modalClose,
      beforeDepositModalOpen,
      onFeeDepositModalClose,
      withdrawToken,
      depositGasFee,

      walletStore,
    };
  },
});
</script>
