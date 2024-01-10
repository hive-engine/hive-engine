<template>
  <Candlestick :data="data" :options="options" />
</template>

<script setup>
import { Chart, LinearScale, TimeSeriesScale, CategoryScale, Tooltip } from 'chart.js';
import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';
import { ref } from 'vue';
import { createTypedChart } from 'vue-chartjs';
import 'chartjs-adapter-date-fns';

class CustomCandleChart extends CandlestickController {
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

CustomCandleChart.id = 'CandleStick';
CustomCandleChart.defaults = CandlestickController.defaults;

Chart.register(
  CandlestickController,
  CandlestickElement,
  LinearScale,
  TimeSeriesScale,
  CategoryScale,
  Tooltip,
  CustomCandleChart,
);

const Candlestick = createTypedChart('CandleStick', CustomCandleChart);

defineProps({
  data: { type: Object, required: true },
});

const options = ref({
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
  plugins: {
    legend: {
      display: false,
    },
    chartAreaBorder: {
      borderColor: 'white',
    },
  },
});
</script>
