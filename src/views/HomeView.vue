<template>
  <section class="hero flex items-center justify-center text-gray-200">
    <div class="mx-auto w-full max-w-7xl px-2 text-center sm:px-6 lg:px-8">
      <h1 class="text-4xl">Create Tokens + Smart Contracts on the Hive Blockchain.</h1>

      <router-link :to="{ name: 'tokens' }" class="btn mt-10 px-8 py-3">Get Started</router-link>
    </div>
  </section>

  <section class="flex items-center justify-center text-gray-700 dark:text-gray-300">
    <div class="mx-auto w-full max-w-5xl px-2 py-16 text-center sm:px-6 lg:px-8">
      <h2 class="text-2xl">
        Hive Engine is a platform that empowers communities, project owners, fundraisers, developers, and businesses to
        quickly and easily build on the Hive blockchain like never before.
      </h2>
    </div>
  </section>

  <section class="full-steam flex items-center text-gray-200">
    <div class="mx-auto w-full max-w-xl rounded-lg bg-[rgba(0,0,0,.85)] p-6 text-center">
      <h3 class="text-4xl uppercase text-yellow-400">Full Steam</h3>

      <p class="mt-5 text-xl">
        Up until now, you've only been tapping into a very small fraction of Hive's true potential. It's like you've
        been using the Death Star to charge your phone.
      </p>

      <p class="mt-5 text-xl">
        Hive Engine unlocks unlimited possibilities by adding a layer of functionality that seamlessly integrates with
        the blockchain.
      </p>

      <p class="mt-5 text-xl">Are you ready to rock 'n' roll?</p>
    </div>
  </section>

  <section class="gears flex items-center text-gray-200">
    <div class="mx-auto w-full max-w-7xl px-2 py-16 text-center sm:px-6 lg:px-8">
      <h3 class="text-4xl uppercase">Holy Smart Contract, Batman!</h3>

      <p class="mt-10 text-xl">
        The Hive-Engine platform makes smart contracts on the Hive blockchain a reality. The first smart contract being
        introduced is the ability to quickly and easily create custom tokens.
      </p>

      <p class="mt-8">Do you know the best part?</p>

      <p class="mt-5 font-bold uppercase text-yellow-400">No coding required!</p>

      <img class="mx-auto mt-5 block" src="/images/hive-engine-overview.png" alt="Hive-Engine Overview" />
    </div>
  </section>

  <section class="aboard-he flex items-center text-gray-700 dark:text-gray-300">
    <div class="mx-auto w-full max-w-7xl px-2 py-16 sm:px-6 lg:px-8">
      <h3 class="text-center text-4xl uppercase text-red-500">The Train is Leaving the Station</h3>

      <div class="mt-10 text-xl">
        <p>All aboard the Hive Express!</p>

        <p class="mt-5">Today is Token Creation. Tomorrow the world!</p>

        <p class="mt-5">
          We wanted to get Tokens out to you guys ASAP, but don't worry. There's lots more to come. This includes more
          robust token management and an internal market to trade tokens against Hive, just like the existing HIVE/SBD
          market.
        </p>

        <p class="mt-5">But wait. There's more!</p>

        <p class="mt-5">
          Smart contracts are capable of doing so much more. As we add more smart contracts to the platform, so will the
          service offerings on this site. All easy to use and deploy for non-developers. If you ARE a developer, you'll
          have lots of toys to play with as well.
        </p>
      </div>
    </div>
  </section>

  <PageFooter />
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import PageFooter from '@/components/PageFooter.vue';

const router = useRouter();
const route = useRoute();

const { p, t } = route.query;

if (p === 'market' && t !== '') {
  router.push({ name: 'trade', params: { symbol: t } });
}
</script>
