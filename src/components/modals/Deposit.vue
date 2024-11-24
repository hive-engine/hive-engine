<template>
  <Modal modal-id="depositModal" @before-open="beforeOpen" @closed="modalClose">
    <template #title>Deposit Tokens</template>

    <Loading v-if="modalBusy" small />

    <template v-else>
      <div class="alert-warning mb-5 font-bold">
        There is a 0.75% fee on deposits. Ethereum, ERC-20, BNB, BEP-20, Polygon (POL), Polygon ERC-20, and Solana (SOL) deposits have no deposit fees.
      </div>

      <div v-if="!selectedToken && !depositInfo" class="alert-warning">
        We have optimized our internal
        <strong>Bitcoin (BTC) wallet</strong>. As a result, all deposit addresses generated before
        <strong>July 15, 2021</strong> are invalid. We may not be able to recover funds sent to an old address. Make
        sure you generate a new address by selecting BTC from the select box below.
      </div>

      <template v-if="!depositInfo">
        <SearchSelect v-model="selectedToken" classes="rounded-md" menu-class="rounded-md" :options="tokens" />
      </template>

      <template v-else-if="isDepositDisabled.disabled">
        <div class="alert-warning">{{ isDepositDisabled.reason }}</div>
      </template>

      <template v-else-if="selectedToken === 'HIVE' && depositInfo">
        <div class="mb-3">
          <label class="mb-2 block font-bold">Available Balance</label>
          <div class="cursor-pointer" @click="depositAmount = depositInfo.balance">{{ depositInfo.balance }} HIVE</div>
        </div>

        <div class="mb-3">
          <label for="depositAmount" class="mb-2 block font-bold">Deposit Amount</label>
          <input id="depositAmount" v-model="depositAmount" type="number" step="any" />
        </div>

        <div class="mb-3">You will receive: {{ hiveReceiveAmount }} HIVE</div>

        <button
          class="btn"
          :disabled="depositAmount <= 0 || depositAmount > depositInfo.balance"
          @click.prevent="depositHive"
        >
          <Spinner v-if="btnBusy" />
          {{ ' ' }} Deposit {{ selectedToken }}
        </button>
      </template>

      <template v-else-if="isEvmToken && depositInfo">
        <div class="mb-3">
          <label for="evmAddress" class="mb-2 block font-bold">Your {{ evmToken }} Address</label>

          <div class="flex items-center">
            <input id="evmAddress" v-model="evmAddress" type="text" class="!rounded-r-none" placeholder="0x...." />

            <button
              class="btn-sm self-stretch rounded-none border-r-red-800"
              title="Refresh address"
              @click="walletStore.fetchEvmAddress(networks[selectedToken])"
            >
              <ArrowPathIcon class="h-5 w-5" />
            </button>

            <button
              class="btn-sm self-stretch rounded-l-none"
              title="Add or update address"
              @click="updateEvmAddress(networks[selectedToken])"
            >
              Update
            </button>
          </div>
        </div>

        <template v-if="['ETH', 'BNB', 'POL'].includes(selectedToken)">
          <div class="mb-3">
            <label class="mb-2 block font-bold">Available Balance</label>
            <div class="cursor-pointer" @click="depositAmount = depositInfo.balance">
              {{ depositInfo.balance }} {{ selectedToken }}
            </div>
          </div>

          <div class="mb-3">
            <label for="depositAmount" class="mb-2 block font-bold">Deposit Amount</label>
            <input id="depositAmount" v-model="depositAmount" type="number" step="any" />
          </div>

          <div class="flex flex-wrap items-center justify-between gap-4">
            <button
              class="btn"
              :disabled="depositAmount <= 0 || depositAmount > depositInfo.balance"
              @click.prevent="depositEvmAsset(networks[selectedToken])"
            >
              <Spinner v-if="btnBusy" />
              {{ ' ' }} Deposit {{ selectedToken }}
            </button>

            <p v-if="selectedToken === 'POL'" class="text-sm">
              By depositing POL you'll receive SWAP.MATIC to your wallet. You can get POL back by
              withdrawing SWAP.MATIC.
            </p>
          </div>
        </template>

        <template v-else>
          <div class="mb-3">
            <label class="mb-2 block font-bold">Tokens</label>
            <SearchSelect v-model="evmToken" classes="border border-gray-500 rounded-md" :options="evmTokenOptions" />
          </div>

          <div class="mb-3">
            <label class="mb-2 block font-bold">Available Balance</label>
            <div class="cursor-pointer" @click="depositAmount = depositInfo.balance">
              {{ depositInfo.balance }} {{ evmToken }}
            </div>
          </div>

          <div class="mb-3">
            <label for="depositAmount" class="mb-2 block font-bold">Deposit Amount</label>
            <input id="depositAmount" v-model="depositAmount" type="number" step="any" />
          </div>

          <button
            class="btn"
            :disabled="depositAmount <= 0 || depositAmount > depositInfo.balance"
            @click.prevent="depositEvmToken(networks[selectedToken])"
          >
            <Spinner v-if="btnBusy" />
            {{ ' ' }} Deposit {{ evmToken }}
          </button>
        </template>
      </template>

      <template v-else-if="isSolanaToken">
        <div class="mb-3">
          <label for="solAddress" class="mb-2 block font-bold">Your Solana Address</label>

          <div class="flex items-center">
            <input id="solAddress" v-model="solAddress" type="text" class="!rounded-r-none" placeholder="" />

            <button
              class="btn-sm self-stretch rounded-none border-r-red-800"
              title="Refresh address"
              @click="fetchSolAddress"
            >
              <ArrowPathIcon class="h-5 w-5" />
            </button>

            <button
              class="btn-sm self-stretch rounded-l-none"
              title="Add or update address"
              @click="updateSolAddress"
            >
              Update
            </button>
          </div>
        </div>

          <div class="mb-3">
            <label class="mb-2 block font-bold">Available Balance</label>
            <div class="cursor-pointer" @click="depositAmount = depositInfo.balance">
              {{ depositInfo.balance }} {{ selectedToken }}
            </div>
          </div>

          <div class="mb-3">
            <label for="depositAmount" class="mb-2 block font-bold">Deposit Amount</label>
            <input id="depositAmount" v-model="depositAmount" type="number" step="any" :min="0.01" />
            <div class="text-sm mt-1">Minimum Solana deposit amount is 0.01 SOL</div>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-4">
            <button
              class="btn"
              :disabled="depositAmount < 0.01 || depositAmount > depositInfo.balance"
              @click.prevent="depositSolAsset()"
            >
              <Spinner v-if="btnBusy" />
              {{ ' ' }} Deposit {{ selectedToken }}
            </button>
          </div>
      </template>

      <template v-else>
        <div class="mb-5">
          Please send any amount of <strong>{{ selectedToken }}</strong> to the following address and you will receive
          an equal amount of <strong>{{ depositInfo.pegged_token_symbol }}</strong> in the
          <strong>@{{ depositInfo.destination }}</strong>
          account once the transaction has received the required number of confirmations on the external chain.
        </div>

        <div v-if="depositInfo.address">
          <div class="mb-3">
            <label for="address" class="mb-2 block font-bold">Deposit Address</label>
            <div class="flex items-center">
              <input type="text" class="!rounded-r-none" readonly :value="depositInfo.address" />

              <button class="btn-sm rounded-l-none border-l-0 py-3 leading-4" @click="copyAddress(depositInfo.address)">
                {{ addressCopied ? 'Copied' : 'Copy' }}
              </button>
            </div>
          </div>
        </div>

        <div v-else-if="depositInfo.account && depositInfo.memo">
          <div class="mb-3">
            <label for="account" class="mb-2 block font-bold">Deposit Account</label>
            <div class="flex items-center">
              <input type="text" class="!rounded-r-none" readonly :value="depositInfo.account" />

              <button class="btn-sm rounded-l-none border-l-0 py-3 leading-4" @click="copyAddress(depositInfo.account)">
                {{ addressCopied ? 'Copied' : 'Copy' }}
              </button>
            </div>
          </div>

          <div class="mb-3">
            <label for="memo" class="mb-2 block font-bold">Memo</label>
            <div class="flex items-center">
              <input type="text" class="!rounded-r-none" readonly :value="depositInfo.memo" />

              <button class="btn-sm rounded-l-none border-l-0 py-3 leading-4" @click="copyMemo(depositInfo.memo)">
                {{ memoCopied ? 'Copied' : 'Copy' }}
              </button>
            </div>
          </div>
        </div>
      </template>
    </template>
  </Modal>
</template>

<script setup>
import { ArrowPathIcon } from '@heroicons/vue/24/outline';
import { notify } from '@kyvg/vue3-notification';
import { useClipboard } from '@vueuse/core';
import {
  Contract,
  isAddress,
  toUtf8Bytes,
  formatEther,
  formatUnits,
  parseEther,
  parseUnits,
  BrowserProvider,
  toBeHex,
} from 'ethers';
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import { computed, ref, watch } from 'vue';
import Big from 'big.js';
import { Buffer } from 'buffer'
import Modal from '@/components/modals/Modal.vue';
import SearchSelect from '@/components/utilities/SearchSelect.vue';
import { hiveClient } from '@/plugins/hive';
import { useStore } from '@/stores';
import { useTokenStore } from '@/stores/token';
import { useUserStore } from '@/stores/user';
import { useWalletStore } from '@/stores/wallet';
import { sleep, toFixedWithoutRounding } from '@/utils';
import { useVfm } from 'vue-final-modal';

globalThis.Buffer = Buffer

let browserProvider = null;
let solanaProvider;

const networks = {
  ETH: 'eth',
  ERC20: 'eth',
  BNB: 'bsc',
  BEP20: 'bsc',
  POL: 'polygon',
  'POLY-ERC20': 'polygon',
};

const chainIds = {
  1: 'Ethereum Mainnet',
  3: 'Ropsten Testnet',
  4: 'Rinkeby Testnet',
  56: 'Binance Smart Chain',
  97: 'Binance Smart Chain Testnet',
  137: 'Polygon Mainnet',
  80001: 'Polygon Mumbai Testnet',
};

const ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: '_to', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
];

const modalBusy = ref(true);
const btnBusy = ref(false);

const store = useStore();
const userStore = useUserStore();
const tokenStore = useTokenStore();
const walletStore = useWalletStore();

const selectedToken = ref(null);
const depositAmount = ref('');
const evmAddress = ref('');
const evmToken = ref(null);

const solAddress = ref(null)

const settings = computed(() => store.settings);
const peggedTokens = computed(() => tokenStore.peggedTokens);
const evmTokens = computed(() => tokenStore.evmTokens);
const depositInfo = computed(() => walletStore.depositInfo);

const { copy: copyAddress, copied: addressCopied } = useClipboard();

const { copy: copyMemo, copied: memoCopied } = useClipboard();

const tokens = computed(() => {
  let tokens = [
    ...peggedTokens.value,
    settings.value.eth_bridge.ethereum,
    settings.value.bsc_bridge.bnb,
    settings.value.polygon_bridge.pol,
    settings.value.solana_bridge.solana,
  ];

  if (settings.value.eth_bridge.erc_20.enabled) {
    tokens.push({ name: 'Ethereum Tokens', symbol: 'ERC20' });
  }

  if (settings.value.bsc_bridge.bep_20.enabled) {
    tokens.push({ name: 'Binance Smart Chain Tokens', symbol: 'BEP20' });
  }

  if (settings.value.polygon_bridge.erc_20.enabled) {
    tokens.push({ name: 'Polygon Tokens', symbol: 'POLY-ERC20' });
  }

  tokens = tokens
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((t) => ({ value: t.symbol, text: `${t.name} (${t.symbol})` }));

  return [{ value: null, text: 'Please select a token' }, ...tokens];
});

const isEvmToken = computed(() => ['ETH', 'ERC20', 'BNB', 'BEP20', 'POL', 'POLY-ERC20'].includes(selectedToken.value));

const evmTokenOptions = computed(() => {
  const allEvmTokens = evmTokens.value.map((t) => ({
    value: t.symbol,
    text: `${t.name} (${t.symbol})`,
  }));

  return [{ value: null, text: 'Please select a token' }, ...allEvmTokens];
});


const isSolanaToken = computed(() => ['SOL'].includes(selectedToken.value));

const hiveReceiveAmount = computed(() => (depositAmount.value * 0.9925).toFixed(3));

const isDepositDisabled = computed(() => {
  const token = store.settings.disabled_deposits.find((t) => t.symbol === selectedToken.value);

  return {
    disabled: !!token,
    ...token,
  };
});

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

  depositAmount.value = '';
  evmAddress.value = '';
  evmToken.value = null;
  walletStore.depositInfo = null;
};

const updateEvmAddress = async (network = 'eth') => {
  if (!window.ethereum) {
    return;
  }

  const currentAddress = await browserProvider.send('eth_accounts');

  if (!currentAddress.map((a) => a.toLowerCase()).includes(evmAddress.value.toLowerCase())) {
    return notify({
      title: 'Error',
      text: 'Your entered address does not match with the connected Metamask address.',
      type: 'error',
    });
  }

  if (isAddress(evmAddress.value)) {
    try {
      const signer = await browserProvider.getSigner(evmAddress.value);
      const signature = await signer.signMessage(toUtf8Bytes(userStore.username));

      const bridgeConfig = `${network}_bridge`;

      const addressKeys = {
        eth: 'ethereumAddress',
        bsc: 'bscAddress',
        polygon: 'polygonAddress',
      };

      const memo = JSON.stringify({
        id: settings.value[bridgeConfig].id,
        json: {
          [addressKeys[network]]: evmAddress.value,
          signature,
        },
      });

      await store.requestBroadcastTransfer({
        to: settings.value[bridgeConfig].account,
        amount: '0.001',
        memo,
        currency: 'HIVE',
      });
    } catch (e) {
      console.log(e.message);
    }
  }
};

const checkEvmAddress = async (network) => {
  let success = true;

  try {
    evmAddress.value = await walletStore.fetchEvmAddress(network);

    const currentAddress = await browserProvider.send('eth_accounts');

    if (!currentAddress.map((a) => a.toLowerCase()).includes(evmAddress.value.toLowerCase())) {
      success = false;

      notify({
        title: 'Error',
        text: 'Your address does not match with the connected Metamask address.',
        type: 'error',
      });

      await browserProvider.send('wallet_requestPermissions', [{ eth_accounts: {} }]);
    } else if (!isAddress(evmAddress.value)) {
      success = false;

      notify({
        title: 'Error',
        text: 'Please make sure you have added/updated your address before proceeding.',
        type: 'error',
      });
    }
  } catch (e) {
    success = false;

    console.log(e.message);
  }

  return success;
};

const getEvmTokenBalance = async (contractAddress, walletAddress) => {
  if (!walletAddress || !contractAddress) {
    return 0;
  }

  const contract = new Contract(contractAddress, ABI, browserProvider);

  const [balance, decimals] = await Promise.all([contract.balanceOf(walletAddress), contract.decimals()]);

  return formatUnits(balance, decimals);
};

const depositHive = async () => {
  btnBusy.value = true;

  const memo = JSON.stringify({
    id: settings.value.sidechain_id,
    json: {
      contractName: 'hivepegged',
      contractAction: 'buy',
      contractPayload: {},
    },
  });

  await store.requestBroadcastTransfer({
    to: settings.value.hive_pegged_account,
    amount: toFixedWithoutRounding(depositAmount.value, 3).toFixed(3),
    memo,
    currency: 'HIVE',
  });

  btnBusy.value = false;
};

const depositEvmAsset = async (network) => {
  btnBusy.value = true;

  try {
    if (await checkEvmAddress(network)) {
      await browserProvider.send('eth_sendTransaction', [
        {
          to: depositInfo.value.deposit_address,
          from: evmAddress.value,
          value: toBeHex(parseEther(depositAmount.value.toString())),
        },
      ]);
    }
  } catch (e) {
    console.log(e.message);
  }

  btnBusy.value = false;
};

const depositEvmToken = async (network) => {
  btnBusy.value = true;

  try {
    if (await checkEvmAddress(network)) {
      const { contract_address: contractAddress, evm_precision: precision } = evmTokens.value.find(
        (t) => t.symbol === evmToken.value,
      );

      const signer = await browserProvider.getSigner();

      const contract = new Contract(contractAddress, ABI, signer);

      const amount = parseUnits(depositAmount.value.toString(), precision);

      await contract.transfer(depositInfo.value.deposit_address, amount);
    }
  } catch (e) {
    console.log(e.message);
  }

  btnBusy.value = false;
};


const getSolConnection = () => {
  return new Connection('https://solana-rpc.publicnode.com', 'confirmed');
};

const isSolAddress = (address) => {
  return /[1-9A-HJ-NP-Za-km-z]{32,44}/.test(address);
};

const fetchSolAddress = async () => {
  solAddress.value = await walletStore.fetchSolAddress();
};

const updateSolAddress = async () => {
  if (!solanaProvider) return;

  const resp = await solanaProvider.connect();

  if (resp.publicKey.toString() !== solAddress.value) {
    return notify({
      title: 'Error',
      text: 'Your entered address does not match with the connected address.',
      type: 'error',
    });
  }

  if (isSolAddress(solAddress.value)) {
    try {
      const encodedMessage = new TextEncoder().encode(userStore.username);

      const signedMessage = await solanaProvider.signMessage(
        encodedMessage,
        'utf8',
      );

      console.log(signedMessage);

      const memo = JSON.stringify({
        id: store.settings?.solana_bridge.id,
        json: {
          solanaAddress: solAddress.value,
          signature: Buffer.from(signedMessage.signature).toString('hex'),
        },
      });

      await store.requestBroadcastTransfer({
        to: store.settings.solana_bridge.account,
        amount: '0.001',
        memo,
        currency: 'HIVE',
      });
    } catch (error) {
      console.log(error);
    }
  }
};

const checkSolAddress = async () => {
  let success = true;

  try {
    solAddress.value = await walletStore.fetchSolAddress();

    const resp = await solanaProvider.connect();

    if (!isSolAddress(solAddress.value)) {
      success = false;

      notify({
        title: 'Error',
        text: 'Please make sure you have added/updated your address before proceeding.',
        type: 'error',
      });
    } else if (resp.publicKey.toString() !== solAddress.value) {
      success = false;

      notify({
        title: 'Error',
        text: 'Your entered address does not match with the connected address.',
        type: 'error',
      });
    }
  } catch (e) {
    success = false;

    console.log(e);
  }

  return success;
};

const solWaitForConfirmation = async (signature) => {
  let count = 0;

  while (count < 10) {
    try {
      await sleep(3000);

      const { value } = await getSolConnection().getSignatureStatus(signature);

      if (value) {
        return value;
      }
    } catch {
      //
    }

    count += 1;
  }
};

const $vfm = useVfm()

const depositSolAsset = async () => {
  btnBusy.value = true;

  try {
    if (await checkSolAddress()) {
      const sender = new PublicKey(solAddress.value);

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: sender,
          toPubkey: new PublicKey(
            store.settings.solana_bridge.gateway_address,
          ),
          lamports: Big(depositAmount.value)
            .times(10 ** 9)
            .toNumber(),
        }),
      );

      const { blockhash } = await getSolConnection().getLatestBlockhash();

      transaction.recentBlockhash = blockhash;
      transaction.feePayer = sender;

      const { signature } =
        await solanaProvider.signAndSendTransaction(transaction);

      await solWaitForConfirmation(signature);

      notify({
        title: 'Success',
        type: 'success',
        text: `Transaction has been submitted to the Solana blockchain`,
      });

      await $vfm.closeAll()
    }
  } catch (e) {
    console.log(e);
  }

  btnBusy.value = false;
};

watch(selectedToken, async (value) => {
  modalBusy.value = true;

  if (value === 'HIVE') {
    const [account] = await hiveClient.getAccounts([userStore.username]);

    walletStore.depositInfo = { balance: parseFloat(account.balance) };
  } else if (
    value === 'ETH' ||
    value === 'ERC20' ||
    value === 'BNB' ||
    value === 'BEP20' ||
    value === 'POL' ||
    value === 'POLY-ERC20'
  ) {
    if (window.ethereum) {
      browserProvider = new BrowserProvider(window.ethereum);

      const network = networks[value];
      const bridgeConfig = `${network}_bridge`;

      const chainId = await browserProvider.send('net_version');
      const requiredChainId = settings.value[bridgeConfig].chain_id;

      let isCorrectChain = Number(chainId) === requiredChainId;

      if (!isCorrectChain) {
        try {
          await browserProvider.send('wallet_switchEthereumChain', [
            { chainId: `0x${Number(requiredChainId).toString(16)}` },
          ]);

          isCorrectChain = true;
        } catch (error) {
          selectedToken.value = null;

          const text = `Please make sure your Web3 wallet network is set to ${chainIds[requiredChainId]}.`;

          notify({
            title: 'Error',
            text,
            type: 'error',
          });
        }
      }

      if (isCorrectChain) {
        try {
          await browserProvider.send('eth_requestAccounts', []);

          evmAddress.value = await walletStore.fetchEvmAddress(network);

          let balance = 0;

          const depositAddress = settings.value[bridgeConfig].gateway_address;

          if (value === 'ETH' || value === 'BNB' || value === 'POL') {
            if (isAddress(evmAddress.value)) {
              balance = toFixedWithoutRounding(formatEther(await browserProvider.getBalance(evmAddress.value)), 8);
            }
          } else {
            await tokenStore.fetchSupportedEvmTokens({ network, deposit: true });
          }

          walletStore.depositInfo = { balance, deposit_address: depositAddress };
        } catch (e) {
          console.log(e.message);

          selectedToken.value = null;

          notify({
            title: 'Error',
            text: 'Please allow us to connect to Metamask.',
            type: 'error',
          });
        }
      }
    } else {
      selectedToken.value = null;

      notify({
        title: 'Error',
        text: 'Metamask or other Web3 wallet was not found.',
        type: 'error',
      });
    }
  }else if (value === 'SOL') {
    const provider = window.solana
      ? window.solana
      : window.xfi && window.xfi.solana
        ? window.xfi.solana
        : null;

    if (!provider) {
      selectedToken.value = '';

      return notify({
        title: 'Error',
        type: 'error',
        text: 'Phantom or other Solana supported wallet was not found.',
      });
    }

    solanaProvider = provider;

    try {
      const resp = await provider.connect();
      console.log(resp.publicKey.toString());

      solAddress.value = await walletStore.fetchSolAddress();

      let balance = 0;

      if (solAddress.value) {
        const balanceReq = await getSolConnection().getBalance(resp.publicKey);

        balance = Big(balanceReq.toString())
          .div(10 ** 9)
          .toNumber();
      }

      walletStore.depositInfo = {
        balance,
        address: store.settings?.solana_bridge.gateway_address,
      };
    } catch (err) {
      console.log(err);
    }
  } else {
    await walletStore.getDepositAddress(value);
  }

  modalBusy.value = false;
});

watch(evmToken, async (value) => {
  if (!value) {
    return;
  }

  const { contract_address: contractAddress, network } = evmTokens.value.find((t) => t.symbol === value);

  const bridgeConfig = `${network}_bridge`;

  const balance = toFixedWithoutRounding(await getEvmTokenBalance(contractAddress, evmAddress.value), 8);

  walletStore.depositInfo = {
    balance,
    deposit_address: settings.value[bridgeConfig].gateway_address,
  };
});
</script>
