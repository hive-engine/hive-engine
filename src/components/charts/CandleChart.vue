<template>
  <Candlestick :chart-data="chartData" :options="options" />
</template>

<script>
import { defineComponent, ref } from "vue";
import { Chart, LinearScale, TimeSeriesScale, Tooltip } from "chart.js";
import { defineChartComponent } from "vue-chart-3";
import { CandlestickController, CandlestickElement } from "chartjs-chart-financial";
import "chartjs-adapter-date-fns";

class CustomCandleChart extends CandlestickController {
  draw() {
    super.draw(arguments);

    const borderColor = "#999";

    if (this.chart.tooltip._active && this.chart.tooltip._active.length) {
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

CustomCandleChart.id = "CustomCandleChart";
CustomCandleChart.defaults = CandlestickController.defaults;

Chart.register(
  CandlestickController,
  CandlestickElement,
  LinearScale,
  TimeSeriesScale,
  Tooltip,
  CustomCandleChart
);

const Candlestick = defineChartComponent("CandleStick", "CustomCandleChart");

export default defineComponent({
  name: "CandlestickChart",

  components: {
    Candlestick,
  },

  props: {
    chartData: { type: Object, required: true },
  },

  setup() {
    const options = ref({
      maintainAspectRatio: false,
      scales: {
        y: {
          ticks: {
            color: "#647882",
          },
          grid: {
            color: "rgba(100, 100, 100, .2)",
            borderWidth: 0,
          },
        },
        x: {
          ticks: {
            color: "#647882",
          },
          grid: {
            color: "rgba(100, 100, 100, .2)",
            borderWidth: 0,
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        chartAreaBorder: {
          borderColor: "white",
        },
      },
    });

    return {
      options,
    };
  },
});
</script>
