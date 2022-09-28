<template>
  <VolumeBarChart :chart-data="chartData" :options="options" />
</template>

<script setup>
import { BarController, BarElement, Chart, Legend, LogarithmicScale, Tooltip } from 'chart.js';
import { ref } from 'vue';
import { defineChartComponent } from 'vue-chart-3';

Chart.register(BarController, BarElement, Tooltip, Legend, LogarithmicScale);

const VolumeBarChart = defineChartComponent('VolumeBarChart', 'bar');

defineProps({
  chartData: { type: Object, required: true },
});

const options = ref({
  maintainAspectRatio: false,
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
      type: 'logarithmic',
    },
    x: {
      ticks: {
        color: '#647882',
      },
      grid: {
        color: 'rgba(100, 100, 100, .2)',
        borderWidth: 0,
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
</script>
