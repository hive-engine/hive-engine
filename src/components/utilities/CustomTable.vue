<template>
  <div class="overflow-x-auto">
    <table
      class="min-w-full table-auto divide-y divide-gray-200 dark:divide-slate-600 dark:text-gray-300"
      v-bind="$attrs"
    >
      <thead>
        <tr>
          <template v-for="(th, i) of fields" :key="i">
            <th
              v-if="th.sortable"
              scope="col"
              :class="[thClass, 'px-4 py-2 font-bold first-of-type:text-left last-of-type:text-right', th.class]"
              role="columnheader"
              :aria-sort="sortKey === th.key ? sortDirection : 'none'"
              @click="sortItems(th.key)"
            >
              {{ th.label }}
            </th>

            <th
              v-else
              scope="col"
              :class="[thClass, 'px-4 py-2 font-bold first-of-type:text-left last-of-type:text-right', th.class]"
              role="columnheader"
            >
              {{ th.label }}
            </th>
          </template>
        </tr>
      </thead>

      <tbody class="divide-y divide-gray-200 dark:divide-slate-600 dark:text-gray-300">
        <template v-if="computedItems.length > 0">
          <tr
            v-for="(tr, i) of computedItems"
            :key="i"
            class="odd:bg-gray-300 even:bg-gray-200 dark:border-slate-700 odd:dark:bg-slate-800 even:dark:bg-slate-700"
          >
            <td
              v-for="(td, k) of fields"
              :key="k"
              :class="[tdClass, 'px-4 py-2 first-of-type:text-left last-of-type:text-right', td.class]"
            >
              <slot :name="`cell(${td.key})`" :item="tr">
                {{ tr[td.key] !== undefined ? tr[td.key] : '' }}
              </slot>
            </td>
          </tr>
        </template>

        <tr
          v-else
          class="odd:bg-gray-300 even:bg-gray-200 dark:border-slate-700 odd:dark:bg-slate-800 even:dark:bg-slate-700"
        >
          <td class="px-4 py-2 text-center" :colspan="fields.length">No results</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div v-if="perPage > 0" class="flex items-center justify-between border-t border-gray-200 py-3 dark:border-slate-600">
    <div>
      <p class="text-sm text-gray-700 dark:text-gray-300">
        Showing {{ ' ' }}
        <span class="font-bold">{{ (currentPage - 1) * perPage + 1 }}</span>
        {{ ' ' }} to {{ ' ' }}
        <span class="font-bold">
          {{ currentPage * perPage > tableItems.length ? tableItems.length : currentPage * perPage }}
        </span>
        {{ ' ' }} of {{ ' ' }}
        <span class="font-bold">{{ tableItems.length }}</span>
        {{ ' ' }} results
      </p>
    </div>

    <div>
      <Pagination v-model="currentPage" :pages="totalPages" :range-size="1" />
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import Pagination from '@/components/utilities/Pagination.vue';

const props = defineProps({
  fields: { type: Array, required: true },
  items: { type: Array, required: true },
  perPage: { type: Number, default: 0 },
  thClass: { type: String, default: 'text-left' },
  tdClass: { type: String, default: 'text-left' },
});

const sortKey = ref(null);
const sortDirection = ref('none');

const tableItems = computed(() => {
  const items = props.items.slice();

  if (sortDirection.value !== 'none') {
    items.sort((a, b) => {
      if (sortDirection.value === 'descending') {
        return b[sortKey.value] - a[sortKey.value];
      }

      return a[sortKey.value] - b[sortKey.value];
    });
  }

  return items;
});

let currentPage = ref(1);

const totalPages = computed(() => Math.ceil(tableItems.value.length / props.perPage));

const start = computed(() => {
  return props.perPage > 0 ? (currentPage.value - 1) * props.perPage : null;
});

const end = computed(() => {
  if (props.perPage > 0) {
    return start.value + props.perPage < tableItems.value.length
      ? start.value + props.perPage
      : tableItems.value.length;
  }

  return null;
});

const computedItems = computed(() => {
  if (start.value !== null && end.value !== null) {
    return tableItems.value.slice(start.value, end.value);
  }

  return tableItems.value;
});

const sortItems = (key) => {
  sortKey.value = key;

  sortDirection.value = sortDirection.value === 'descending' ? 'ascending' : 'descending';
};
</script>
