<script setup lang="ts">
import {
  Chart,
  registerables,
  type ChartData,
  type ChartOptions,
  type ChartType,
} from 'chart.js'
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

Chart.register(...registerables)

const props = defineProps<{
  type: ChartType
  data: ChartData
  accessibleLabel: string
}>()

const canvas = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

function cssColor(name: string, fallback: string) {
  if (typeof window === 'undefined') {
    return fallback
  }
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}

function chartOptions(): ChartOptions {
  const text = cssColor('--text-muted', '#4a4846')
  const border = cssColor('--border', '#c9c5c0')
  const circular = props.type === 'doughnut'
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 440,
      easing: 'easeOutQuart',
    },
    interaction: {
      intersect: false,
      mode: circular ? 'nearest' : 'index',
    },
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          color: text,
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 7,
          boxHeight: 7,
          padding: 18,
          font: { family: cssColor('--font-sans', 'system-ui'), size: 12 },
        },
      },
      tooltip: {
        backgroundColor: cssColor('--ink', '#09090a'),
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        padding: 12,
        cornerRadius: 10,
      },
    },
    scales: circular
      ? undefined
      : {
          x: {
            border: { display: false },
            grid: { display: false },
            ticks: { color: text, maxRotation: 0, autoSkipPadding: 18 },
          },
          y: {
            beginAtZero: true,
            border: { display: false },
            grid: { color: border },
            ticks: { color: text, precision: 0 },
          },
        },
  }
}

function renderChart() {
  if (!canvas.value) {
    return
  }
  chart?.destroy()
  chart = new Chart(canvas.value, {
    type: props.type,
    data: props.data,
    options: chartOptions(),
  })
}

watch(
  () => [props.type, props.data],
  async () => {
    await nextTick()
    renderChart()
  },
  { deep: true },
)

onMounted(renderChart)

onBeforeUnmount(() => {
  chart?.destroy()
})
</script>

<template>
  <div class="chart" role="img" :aria-label="accessibleLabel">
    <canvas ref="canvas" />
  </div>
</template>

<style scoped>
.chart {
  position: relative;
  width: 100%;
  min-height: 15rem;
}

@media (min-width: 720px) {
  .chart {
    min-height: 18rem;
  }
}
</style>
