<template>
  <div class="overflow-x-auto">
    <table
      class="min-w-full table-auto divide-y divide-gray-200 dark:divide-slate-600 dark:text-gray-300"
      v-bind="$attrs"
    >
      <thead class="bg-gray-400 dark:bg-slate-600">
        <tr>
          <template v-for="(th, i) of fields" :key="i">
            <th
              scope="col"
              :class="[
                thClass,
                'px-4 py-2 font-bold first-of-type:text-left last-of-type:text-right',
                th.class,
              ]"
              role="columnheader"
              :aria-sort="sortKey === th.key ? sortDirection : 'none'"
              v-if="th.sortable"
              @click="sortItems(th.key)"
            >{{ th.label }}</th>

            <th
              scope="col"
              :class="[
                thClass,
                'px-4 py-2 font-bold first-of-type:text-left last-of-type:text-right',
                th.class,
              ]"
              role="columnheader"
              v-else
            >{{ th.label }}</th>
          </template>
        </tr>
      </thead>

      <tbody class="divide-y divide-gray-200 dark:divide-slate-600 dark:text-gray-300">
        <tr
          v-if="items.length > 0"
          v-for="(tr, i) of items"
          key="i"
          class="odd:bg-gray-300 even:bg-gray-200 odd:dark:bg-slate-800 even:dark:bg-slate-700 dark:border-slate-700"
        >
          <td
            v-for="(td, k) of fields"
            :class="[tdClass, 'px-4 py-2 first-of-type:text-left last-of-type:text-right', td.class]"
          >
            <slot :name="`cell(${td.key})`" :item="tr">
              {{
                tr[td.key] !== undefined ? tr[td.key] : ""
              }}
            </slot>
          </td>
        </tr>

        <tr
          v-else
          class="odd:bg-gray-300 even:bg-gray-200 odd:dark:bg-slate-800 even:dark:bg-slate-700 dark:border-slate-700"
        >
          <td class="px-4 py-2 text-center" :colspan="fields.length">No results</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div
    v-if="perPage > 0"
    class="bg-white dark:bg-slate-600 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-slate-600 sm:px-6"
  >
    <div>
      <p class="text-sm text-gray-700 dark:text-gray-300">
        Showing {{ " " }}
        <span class="font-bold">{{ (currentPage - 1) * perPage + 1 }}</span>
        {{ " " }} to {{ " " }}
        <span class="font-bold">
          {{
            currentPage * perPage > tableItems.length ? tableItems.length : currentPage * perPage
          }}
        </span>
        {{ " " }} of {{ " " }}
        <span class="font-bold">{{ tableItems.length }}</span>
        {{ " " }} results
      </p>
    </div>

    <div>
      <Pagination v-model="currentPage" :pages="totalPages" :range-size="1" />
    </div>
  </div>
</template>

<script>
import { defineComponent, computed, ref } from "vue";
import Pagination from "../utilities/Pagination.vue";

export default defineComponent({
  name: "CustomTable",

  components: {
    Pagination,
  },

  props: {
    fields: { type: Array, required: true },
    items: { type: Array, required: true },
    perPage: { type: Number, default: 0 },
    thClass: { type: String, default: "text-left" },
    tdClass: { type: String, default: "text-left" },
  },

  setup(props) {
    const fields = computed(() => props.fields);
    const perPage = computed(() => props.perPage);

    const thClass = props.thClass;
    const tdClass = props.tdClass;

    const sortKey = ref(null);
    const sortDirection = ref("none");

    const tableItems = computed(() => {
      const items = props.items.slice();

      if (sortDirection.value !== "none") {
        items.sort((a, b) => {
          if (sortDirection.value === "descending") {
            return new Intl.Collator("en", { numeric: true }).compare(
              b[sortKey.value],
              a[sortKey.value]
            );
          }

          return new Intl.Collator("en", { numeric: true }).compare(
            a[sortKey.value],
            b[sortKey.value]
          );
        });
      }

      return items;
    });

    let currentPage = ref(1);

    const totalPages = computed(() => Math.ceil(tableItems.value.length / perPage.value));

    let start = null;
    let end = null;

    if (perPage.value > 0) {
      start = computed(() => (currentPage.value - 1) * perPage.value);
      end = computed(() =>
        start.value + perPage.value < tableItems.value.length
          ? start.value + perPage.value
          : tableItems.value.length
      );
    }

    const items = computed(() => {
      if (start && end) {
        return tableItems.value.slice(start.value, end.value);
      }

      return tableItems.value;
    });

    const sortItems = (key) => {
      sortKey.value = key;

      sortDirection.value = sortDirection.value === "descending" ? "ascending" : "descending";
    };

    return {
      thClass,
      tdClass,
      fields,
      tableItems,
      items,
      sortKey,
      sortDirection,
      perPage,
      currentPage,
      totalPages,

      sortItems,
    };
  },
});
</script>
