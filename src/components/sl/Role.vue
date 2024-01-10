<template>
  <div
    class="flex flex-col items-center justify-center rounded-full border-2 border-white border-opacity-50 bg-gray-800"
  >
    <template v-if="type === 'Summoner'">
      <svg width="29" height="17" xmlns="http://www.w3.org/2000/svg">
        <g fill-rule="nonzero" fill="none">
          <rect width="37.8" height="37.8" rx="5" fill="none" fill-opacity="0" transform="translate(-5 -11)" />
          <path
            fill="#FF9F56"
            d="m19.818 11.944 4.711-1.7-4.548-.3 4.386-5.6-6.417 2.4L16.935 0l-5.726 6.12-3.533-1.206 2.559 4.829H3.411l6.01 2.2L0 13.28l13.97 2.762-7.188-2.762 4.914-.487-2.843-2.356 3.168.569-1.462-3.249 2.8 2.031L15.676 3.9v5.2l4.142-1.706-2.762 3.452h2.315l-2.477 1.706 5.036.934-7.96 2.559 14.376-1.706z"
          />
        </g>
      </svg>
    </template>
    <template v-else>
      <svg width="17" height="15" xmlns="http://www.w3.org/2000/svg">
        <g fill-rule="nonzero" fill="none">
          <rect width="37.8" height="37.8" rx="5" fill="none" fill-opacity="0" transform="translate(-11 -12)" />
          <path
            d="M12.152 14.416H0l2.126-5.5 2 5.186L6 11.647l2.016 2.626 2.016-2.626 1.972 2.579 2.052-5.306 2.118 5.5-4.022-.004Zm-.1-14.1-1.879 2.453L8.161.139 6.15 2.769 4.17.19 2.126 5.5 0 0h16.176l-2.118 5.5L12.052.316Z"
            fill="#EEE"
          />
        </g>
      </svg>
    </template>
  </div>
</template>

<script setup>
defineProps({
  type: { type: String, required: false, default: 'Monster' },
});
</script>
