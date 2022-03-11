<template>
  <VolumeBarChart :chart-data="chartData" :options="options" />
</template>

<script>
import { Chart, BarController, BarElement, Tooltip, Legend, LogarithmicScale } from "chart.js";
import { defineComponent, ref, toRefs } from "vue";
import { defineChartComponent } from "vue-chart-3";

Chart.register(BarController, BarElement, Tooltip, Legend, LogarithmicScale);

const VolumeBarChart = defineChartComponent("VolumeBarChart", "bar");

export default defineComponent({
  name: "VolumeChart",

  components: {
    VolumeBarChart,
  },

  props: {
    chartData: { type: Object, required: true },
  },

  setup(props) {
    const { chartData } = toRefs(props);

    const options = ref({
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false,
      },
      scales: {
        y: {
          ticks: {
            fontColor: "#565d69",
          },
          type: "logarithmic",
        },
        x: {
          ticks: {
            fontColor: "#565d69",
          },
          stacked: true,
        },
      },
      plugins: {
        legend: {
          display: true,
        },
      },
    });

    return {
      chartData,
      options,
    };
  },
});
</script>
