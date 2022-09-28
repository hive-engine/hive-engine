<template>
  <div class="page-header">
    <div class="w-full max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 text-gray-200">
      <div class="grid md:grid-cols-4 text-center md:text-left min-h-[160px] items-center">
        <div class="col-span-full md:col-span-3 mt-3">
          <h1 class="text-4xl uppercase">Frequently Asked Questions</h1>
        </div>
      </div>
    </div>
  </div>

  <div class="page-content">
    <div v-for="(category, c) of faqCategories" :key="c" class="mb-10">
      <h3 class="text-2xl font-bold mb-3">{{ makeTitle(category) }}</h3>

      <Disclosure v-for="(faq, i) of FAQ[category]" v-slot="{ open }" :key="i" as="div" class="mb-3">
        <DisclosureButton
          :class="[
            open ? 'rounded-b-none' : '',
            'text-lg flex justify-between w-full px-4 py-2 font-bold text-left bg-gray-400 dark:bg-slate-600 rounded-md',
          ]"
        >
          <span>{{ faq.title }}</span>
          <ChevronUpIcon :class="open ? '' : 'transform rotate-180'" class="w-6 h-6" />
        </DisclosureButton>

        <DisclosurePanel
          class="bg-gray-400 dark:bg-slate-600 px-4 pt-4 pb-2 text-lg rounded-b-md"
          v-html="faq.content"
        ></DisclosurePanel>
      </Disclosure>
    </div>
  </div>

  <PageFooter />
</template>

<script>
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue';
import { ChevronUpIcon } from '@heroicons/vue/24/outline';
import { defineComponent } from 'vue';
import FAQ from '../assets/jsons/faq.json';
import PageFooter from '../components/PageFooter.vue';

export default defineComponent({
  name: 'FAQ',

  components: {
    Disclosure,
    DisclosureButton,
    DisclosurePanel,
    ChevronUpIcon,
    PageFooter,
  },

  setup() {
    const faqCategories = Object.keys(FAQ);

    const makeTitle = (str) => {
      return str
        .split('_')
        .join(' ')
        .replace(/\b(\w)/g, (s) => s.toUpperCase());
    };

    return {
      faqCategories,
      FAQ,
      makeTitle,
    };
  },
});
</script>
