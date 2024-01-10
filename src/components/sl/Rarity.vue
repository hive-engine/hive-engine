<template>
  <div
    class="flex flex-col items-center justify-center rounded-full border-2 border-white border-opacity-50 bg-gray-800"
  >
    <template v-if="rarity === 1">
      <svg width="18px" height="18px" viewBox="0 0 18 18">
        <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
          <g transform="translate(-10.000000, -10.000000)" fill-rule="nonzero">
            <g fill="#464646" fill-opacity="0">
              <rect x="0" y="0" width="37.8" height="37.8" rx="5"></rect>
            </g>
            <circle fill="#BFD1DA" cx="18.756" cy="18.756" r="8.756"></circle>
          </g>
        </g>
      </svg>
    </template>

    <template v-else-if="rarity === 2">
      <svg width="18px" height="18px" viewBox="0 0 18 18">
        <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
          <g transform="translate(-10.000000, -10.000000)" fill-rule="nonzero">
            <g fill="#1C3264" fill-opacity="0">
              <rect x="0" y="0" width="37.8" height="37.8" rx="5"></rect>
            </g>
            <circle fill="#7AC2FF" cx="18.756" cy="18.756" r="8.756"></circle>
          </g>
        </g>
      </svg>
    </template>

    <template v-else-if="rarity === 3">
      <svg width="18px" height="18px" viewBox="0 0 18 18">
        <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
          <g transform="translate(-10.000000, -10.000000)" fill-rule="nonzero">
            <g fill="#2B003D" fill-opacity="0">
              <rect x="0" y="0" width="37.8" height="37.8" rx="5"></rect>
            </g>
            <circle fill="#CA6EEB" cx="18.756" cy="18.756" r="8.756"></circle>
          </g>
        </g>
      </svg>
    </template>

    <template v-else-if="rarity === 4">
      <svg width="18px" height="18px" viewBox="0 0 18 18">
        <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
          <g transform="translate(-10.000000, -10.000000)" fill-rule="nonzero">
            <g fill="#382B00" fill-opacity="0">
              <rect x="0" y="0" width="37.8" height="37.8" rx="5"></rect>
            </g>
            <circle fill="#F3C059" cx="18.756" cy="18.756" r="8.756"></circle>
          </g>
        </g>
      </svg>
    </template>
  </div>
</template>

<script setup>
defineProps({
  rarity: { type: Number, required: false, default: 1 },
});
</script>
