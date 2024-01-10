<template>
  <div class="page-header">
    <div class="mx-auto w-full max-w-7xl px-2 text-gray-200 sm:px-6 lg:px-8">
      <div class="grid min-h-[160px] items-center text-center md:grid-cols-4 md:text-left">
        <div class="col-span-full mt-3 md:col-span-3">
          <h1 class="text-4xl uppercase">Frequently Asked Questions</h1>
        </div>
      </div>
    </div>
  </div>

  <div class="page-content">
    <div v-for="(category, c) of faqCategories" :key="c" class="mb-10">
      <h3 class="mb-3 text-2xl font-bold">{{ makeTitle(category) }}</h3>

      <Disclosure v-for="(faq, i) of FAQ[category]" v-slot="{ open }" :key="i" as="div" class="mb-3">
        <DisclosureButton
          :class="[
            open ? 'rounded-b-none' : '',
            'flex w-full justify-between rounded-md bg-gray-400 px-4 py-2 text-left text-lg font-bold dark:bg-slate-600',
          ]"
        >
          <span>{{ faq.title }}</span>
          <ChevronUpIcon :class="open ? '' : 'rotate-180 transform'" class="h-6 w-6" />
        </DisclosureButton>

        <DisclosurePanel
          class="rounded-b-md bg-gray-400 px-4 pb-2 pt-4 text-lg dark:bg-slate-600"
          v-html="faq.content"
        ></DisclosurePanel>
      </Disclosure>
    </div>
  </div>

  <PageFooter />
</template>

<script setup>
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue';
import { ChevronUpIcon } from '@heroicons/vue/24/outline';
import { useHead } from '@unhead/vue';
import FAQ from '@/assets/jsons/faq.json';
import PageFooter from '@/components/PageFooter.vue';

useHead({
  title: 'FAQ',
});

const faqCategories = Object.keys(FAQ);

const makeTitle = (str) => {
  return str
    .split('_')
    .join(' ')
    .replace(/\b(\w)/g, (s) => s.toUpperCase());
};
</script>
