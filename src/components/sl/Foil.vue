<template>
  <div
    class="flex flex-col items-center justify-center rounded-full border-2 border-white border-opacity-50 bg-gray-800"
  >
    <template v-if="props.gold">
      <svg xmlns="http://www.w3.org/2000/svg" width="12.865" height="15.225" viewBox="0 0 12.865 15.225">
        <g transform="translate(0)">
          <g transform="translate(0 0)">
            <path
              fill="#ffba00"
              d="M1.781,14.765,0,4.481A.563.563,0,0,1,.46,3.854L2.6,3.485l.606-.108L6.2,2.858l1.84-.324a.562.562,0,0,1,.628.455l1.646,9.44.13.8v.044a.539.539,0,0,1-.022.238.564.564,0,0,1-.433.411l-7.577,1.3a.563.563,0,0,1-.628-.455Zm10.045-3.2-1.8-10.392A.562.562,0,0,0,9.4.714l-2.165.368-3.161.563V.563A.563.563,0,0,1,4.638,0h7.686a.563.563,0,0,1,.541.563V11a.563.563,0,0,1-.563.563Z"
              transform="translate(0 0)"
            />
          </g>
        </g>
      </svg>
    </template>
    <template v-else>
      <svg xmlns="http://www.w3.org/2000/svg" width="12.865" height="15.225" viewBox="0 0 12.865 15.225">
        <g transform="translate(0)">
          <g transform="translate(0 0)">
            <path
              fill="#219b92"
              d="M1.781,14.765,0,4.481A.563.563,0,0,1,.46,3.854L2.6,3.485l.606-.108L6.2,2.858l1.84-.324a.562.562,0,0,1,.628.455l1.646,9.44.13.8v.044a.539.539,0,0,1-.022.238.564.564,0,0,1-.433.411l-7.577,1.3a.563.563,0,0,1-.628-.455Zm10.045-3.2-1.8-10.392A.562.562,0,0,0,9.4.714l-2.165.368-3.161.563V.563A.563.563,0,0,1,4.638,0h7.686a.563.563,0,0,1,.541.563V11a.563.563,0,0,1-.563.563Z"
              transform="translate(0 0)"
            />
          </g>
        </g>
      </svg>
    </template>
  </div>
</template>

<script setup>
const props = defineProps({
  gold: { type: Boolean, required: false, default: false },
});
</script>
