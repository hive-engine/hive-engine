<template>
  <div
    class="flex flex-col items-center justify-center rounded-full border-2 border-white border-opacity-50 bg-gray-800 p-1 text-white"
  >
    <template v-if="edition === 0">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21.53 31.79">
        <polygon fill="currentColor" points="10.77 0 0 31.79 7.76 31.79 10.77 22.92 13.77 31.79 21.53 31.79 10.77 0" />
      </svg>
    </template>
    <template v-else-if="edition === 1">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 19.03 31.79">
        <polygon
          fill="currentColor"
          points="6.25 13.43 14.75 8.52 0 0 0 5.96 4.43 8.52 0 11.07 0 15.78 8.7 20.8 0 25.83 0 31.79 19.03 20.8 6.25 13.43"
        />
      </svg>
    </template>
    <template v-else-if="edition === 2">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 19.03 31.71">
        <polygon
          fill="currentColor"
          points="19.03 11.19 0 0 0 6.28 8.5 11.19 0 16.1 0 16.7 0 22.38 0 31.7 6 31.7 6 18.85 19.03 11.19"
        />
      </svg>
    </template>
    <template v-else-if="edition === 3">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20.37 31.71">
        <polygon
          fill="currentColor"
          points="20.37 31.7 11.19 15.8 19.03 11.19 0 0 0 6.28 8.5 11.19 0 16.1 0 16.7 0 22.38 0 31.7 6 31.7 6 18.85 6.02 18.84 13.44 31.7 20.37 31.7"
        />
      </svg>
    </template>
    <template v-else-if="edition === 4">
      <svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50">
        <polygon
          fill="currentColor"
          points="28.14 4.89 28.14 37.57 21.86 37.57 21.86 4.89 14.32 4.89 14.32 37.57 14.32 45.11 21.86 45.11 28.14 45.11 35.68 45.11 35.68 37.57 35.68 4.89 28.14 4.89"
        />
      </svg>
    </template>
    <template v-else-if="edition === 5">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32.08">
        <g id="Layer_2" data-name="Layer 2">
          <g id="Layer_1-2" data-name="Layer 1">
            <polygon
              fill="currentColor"
              points="7.98 32.08 7.98 23.39 15.33 16.04 7.98 8.69 7.98 0 24.02 16.04 8.02 32.04 7.98 32.08"
            />
            <rect fill="none" y="0.04" width="32" height="32" />
          </g>
        </g>
      </svg>
    </template>
    <template v-else-if="edition === 7">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 187.8 181.96">
        <g id="Layer_2" data-name="Layer 2">
          <g id="Layer_1-2" data-name="Layer 1">
            <path
              fill="currentColor"
              d="M133.63,45.36,93.9,79.22,54.18,45.36,0,91.53l54.18,46.18L93.9,103.85l39.73,33.86L187.8,91.53ZM79.7,91.74,54.18,113.49l-25.77-22,25.77-22L79.7,91.32l-.25.21Zm28.41,0,.24-.21-.24-.21,25.52-21.75,25.76,22-25.76,22Z"
            />
            <polygon fill="currentColor" points="110.94 40.45 93.9 0 76.86 40.45 93.9 55.02 110.94 40.45" />
            <polygon fill="currentColor" points="76.86 141.51 93.9 181.96 110.94 141.51 93.9 126.94 76.86 141.51" />
          </g>
        </g>
      </svg>
    </template>
    <template v-else-if="edition === 8">
      <svg
        id="Capa_1"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
        x="0px"
        y="0px"
        viewBox="0 0 187.8 182"
        style="enable-background: new 0 0 187.8 182"
        xml:space="preserve"
      >
        <g id="Group_4447" transform="translate(24.389 30)">
          <g transform="matrix(1, 0, 0, 1, -24.39, -30)">
            <path
              id="Path_14891-2"
              fill="currentColor"
              d="M47.1,91l46.8,70.2L140.6,91L93.9,20.7L47.1,91z M93.9,131.4L66.9,91l26.9-40.4L120.8,91
			L93.9,131.4z"
            />
          </g>
          <path id="Path_14892" fill="currentColor" d="M69.5,85.4L85.9,61L69.5,36.5L53,61L69.5,85.4z" />
          <path id="Path_14893" fill="currentColor" d="M117.4,12.4v28L136.8,61l-19.5,20.5v28l46-48.5L117.4,12.4z" />
          <path id="Path_14894" fill="currentColor" d="M22,110.1V82L2.1,61l19.9-21V11.9L-24.4,61L22,110.1z" />
        </g>
      </svg>
    </template>
  </div>
</template>

<script setup>
defineProps({
  edition: { type: Number, required: true },
});
</script>
