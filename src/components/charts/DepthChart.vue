<template>
  <DepthLineChart :data="data" :options="options" />
</template>

<script setup>
import { CategoryScale, Chart, Filler, LineController, LineElement, PointElement, Tooltip } from 'chart.js';
import { ref } from 'vue';
import { createTypedChart } from 'vue-chartjs';

class CustomLineChart extends LineController {
  draw() {
    super.draw(arguments);

    const borderColor = '#999';

    if (this.chart.tooltip && this.chart.tooltip._active && this.chart.tooltip._active.length) {
      const activePoint = this.chart.tooltip._active[0];

      const { x } = activePoint.element;
      const topY = this.chart.scales.y.top;
      const bottomY = this.chart.scales.y.bottom;

      const ctx = this.chart.ctx;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, topY);
      ctx.lineTo(x, bottomY);
      ctx.lineWidth = 2;
      ctx.strokeStyle = borderColor;
      ctx.stroke();
      ctx.restore();
    }
  }
}

CustomLineChart.id = 'DepthLineChart';
CustomLineChart.defaults = LineController.defaults;

Chart.register(LineController, LineElement, Tooltip, PointElement, CategoryScale, Filler);

const DepthLineChart = createTypedChart('DepthLineChart', CustomLineChart);

defineProps({
  data: { type: Object, required: true },
});

const options = ref({
  interaction: {
    mode: 'index',
    intersect: false,
  },
  scales: {
    y: {
      ticks: {
        color: '#647882',
      },
      grid: {
        color: 'rgba(100, 100, 100, .2)',
        borderWidth: 0,
      },
    },
    x: {
      ticks: {
        color: '#647882',
      },
      grid: {
        color: 'rgba(100, 100, 100, .2)',
        borderWidth: 0,
      },
    },
  },
});
</script>
