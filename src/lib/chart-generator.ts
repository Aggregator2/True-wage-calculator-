/**
 * Chart Generation Utilities for PDF Reports
 * Generates charts using Chart.js and converts them to base64 images for PDF embedding
 */

import { Chart, ChartConfiguration, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

/**
 * Create a canvas element for chart rendering
 */
function createCanvas(width: number, height: number): HTMLCanvasElement {
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }
  // Server-side: use canvas package if available
  // For now, return a mock canvas
  const { createCanvas } = require('canvas');
  return createCanvas(width, height);
}

/**
 * Generate a donut chart showing income breakdown
 */
export async function generateDonutChart(
  data: { label: string; value: number; color: string }[],
  centerText?: string
): Promise<string> {
  const canvas = createCanvas(400, 400);
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  const config: ChartConfiguration<'doughnut'> = {
    type: 'doughnut',
    data: {
      labels: data.map(d => d.label),
      datasets: [{
        data: data.map(d => d.value),
        backgroundColor: data.map(d => d.color),
        borderWidth: 2,
        borderColor: '#FFFFFF',
      }],
    },
    options: {
      responsive: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: {
              size: 12,
              family: 'Helvetica',
            },
            padding: 15,
          },
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.label || '';
              const value = context.parsed;
              const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: £${value.toLocaleString()} (${percentage}%)`;
            },
          },
        },
      },
      cutout: '65%',
    },
    plugins: centerText ? [{
      id: 'centerText',
      beforeDraw: (chart) => {
        const { ctx, chartArea } = chart;
        if (!ctx || !chartArea) return;

        ctx.save();
        ctx.font = 'bold 32px Helvetica';
        ctx.fillStyle = '#1E293B';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const centerX = (chartArea.left + chartArea.right) / 2;
        const centerY = (chartArea.top + chartArea.bottom) / 2;

        ctx.fillText(centerText, centerX, centerY);
        ctx.restore();
      },
    }] : [],
  };

  const chart = new Chart(ctx, config);

  // Wait for chart to render
  await new Promise(resolve => setTimeout(resolve, 100));

  const base64Image = canvas.toDataURL('image/png');
  chart.destroy();

  return base64Image;
}

/**
 * Generate a bar chart comparing values
 */
export async function generateBarChart(
  labels: string[],
  data: number[],
  colors: string[],
  title?: string
): Promise<string> {
  const canvas = createCanvas(500, 300);
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  const config: ChartConfiguration<'bar'> = {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: title || '',
        data,
        backgroundColor: colors,
        borderWidth: 0,
        borderRadius: 6,
      }],
    },
    options: {
      responsive: false,
      indexAxis: 'y',
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              return `£${(context.parsed.x ?? 0).toLocaleString()}`;
            },
          },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: {
            color: '#E2E8F0',
          },
          ticks: {
            callback: (value) => `£${value}`,
          },
        },
        y: {
          grid: {
            display: false,
          },
        },
      },
    },
  };

  const chart = new Chart(ctx, config);

  await new Promise(resolve => setTimeout(resolve, 100));

  const base64Image = canvas.toDataURL('image/png');
  chart.destroy();

  return base64Image;
}

/**
 * Generate a line chart for FIRE projection
 */
export async function generateLineChart(
  years: number[],
  datasets: { label: string; data: number[]; color: string; fill?: boolean }[]
): Promise<string> {
  const canvas = createCanvas(600, 350);
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  const config: ChartConfiguration<'line'> = {
    type: 'line',
    data: {
      labels: years.map(y => `Year ${y}`),
      datasets: datasets.map(ds => ({
        label: ds.label,
        data: ds.data,
        borderColor: ds.color,
        backgroundColor: ds.fill ? ds.color + '33' : 'transparent',
        borderWidth: 3,
        fill: ds.fill || false,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      })),
    },
    options: {
      responsive: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            font: {
              size: 12,
              family: 'Helvetica',
            },
            usePointStyle: true,
            padding: 15,
          },
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              return `${context.dataset.label}: £${(context.parsed.y ?? 0).toLocaleString()}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            color: '#E2E8F0',
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: '#E2E8F0',
          },
          ticks: {
            callback: (value) => `£${(value as number).toLocaleString()}`,
          },
        },
      },
    },
  };

  const chart = new Chart(ctx, config);

  await new Promise(resolve => setTimeout(resolve, 100));

  const base64Image = canvas.toDataURL('image/png');
  chart.destroy();

  return base64Image;
}

/**
 * Generate a horizontal bar chart for time cost visualization
 */
export async function generateTimeCostChart(
  categories: string[],
  hours: number[]
): Promise<string> {
  const canvas = createCanvas(500, 350);
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Color intensity based on hours (more hours = darker red)
  const maxHours = Math.max(...hours);
  const colors = hours.map(h => {
    const intensity = h / maxHours;
    const red = 220;
    const green = Math.floor(38 + (217 * (1 - intensity)));
    const blue = Math.floor(38 + (217 * (1 - intensity)));
    return `rgb(${red}, ${green}, ${blue})`;
  });

  const config: ChartConfiguration<'bar'> = {
    type: 'bar',
    data: {
      labels: categories,
      datasets: [{
        label: 'Hours of Life',
        data: hours,
        backgroundColor: colors,
        borderWidth: 0,
        borderRadius: 6,
      }],
    },
    options: {
      responsive: false,
      indexAxis: 'y',
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              return `${(context.parsed.x ?? 0).toFixed(1)} hours per year`;
            },
          },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: {
            color: '#E2E8F0',
          },
          ticks: {
            callback: (value) => `${value}h`,
          },
        },
        y: {
          grid: {
            display: false,
          },
        },
      },
    },
  };

  const chart = new Chart(ctx, config);

  await new Promise(resolve => setTimeout(resolve, 100));

  const base64Image = canvas.toDataURL('image/png');
  chart.destroy();

  return base64Image;
}

/**
 * Generate a simple comparison bar chart
 */
export async function generateComparisonChart(
  label1: string,
  value1: number,
  label2: string,
  value2: number,
  color1: string = '#DC2626',
  color2: string = '#64748B'
): Promise<string> {
  const canvas = createCanvas(400, 250);
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  const config: ChartConfiguration<'bar'> = {
    type: 'bar',
    data: {
      labels: [label1, label2],
      datasets: [{
        data: [value1, value2],
        backgroundColor: [color1, color2],
        borderWidth: 0,
        borderRadius: 8,
        barThickness: 60,
      }],
    },
    options: {
      responsive: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              return `${(context.parsed.y ?? 0).toFixed(1)}%`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          grid: {
            color: '#E2E8F0',
          },
          ticks: {
            callback: (value) => `${value}%`,
          },
        },
        x: {
          grid: {
            display: false,
          },
        },
      },
    },
  };

  const chart = new Chart(ctx, config);

  await new Promise(resolve => setTimeout(resolve, 100));

  const base64Image = canvas.toDataURL('image/png');
  chart.destroy();

  return base64Image;
}
