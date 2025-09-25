import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { getChartColor } from '../../config/statusColors';
import type {
  TransactionVolume,
  StatusDistribution,
  DepartmentPerformance,
  ProcessingTimeByType
} from '../../types/report';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface ChartProps {
  isRTL?: boolean;
}

// Volume Trends Chart
interface VolumeChartProps extends ChartProps {
  data: TransactionVolume[];
}

export const VolumeChart: React.FC<VolumeChartProps> = ({ data, isRTL = false }) => {
  const chartData = {
    labels: data.map(item => item.period),
    datasets: [
      {
        label: isRTL ? 'عدد المعاملات' : 'Transaction Count',
        data: data.map(item => item.count),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      }
    ]
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: isRTL ? 'اتجاه حجم المعاملات' : 'Transaction Volume Trends',
        font: {
          size: 16
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  return (
    <div style={{ height: '300px' }}>
      <Line data={chartData} options={options} />
    </div>
  );
};

// Status Distribution Chart
interface StatusChartProps extends ChartProps {
  data: StatusDistribution[];
}

export const StatusChart: React.FC<StatusChartProps> = ({ data, isRTL = false }) => {
  const chartData = {
    labels: data.map(item => item.status),
    datasets: [
      {
        data: data.map(item => item.percentage),
        backgroundColor: data.map(item => getChartColor(item.status)),
        borderWidth: 0
      }
    ]
  };

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom'
      },
      title: {
        display: true,
        text: isRTL ? 'توزيع الحالة' : 'Status Distribution',
        font: {
          size: 16
        }
      }
    }
  };

  return (
    <div style={{ height: '300px' }}>
      <Doughnut data={chartData} options={options} />
    </div>
  );
};

// Department Performance Chart
interface DepartmentChartProps extends ChartProps {
  data: DepartmentPerformance[];
}

export const DepartmentChart: React.FC<DepartmentChartProps> = ({ data, isRTL = false }) => {
  const chartData = {
    labels: data.map(item => item.department),
    datasets: [
      {
        label: isRTL ? 'مكتمل' : 'Completed',
        data: data.map(item => item.completed),
        backgroundColor: '#10b981'
      },
      {
        label: isRTL ? 'معلق' : 'Pending',
        data: data.map(item => item.pending),
        backgroundColor: '#f59e0b'
      }
    ]
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top'
      },
      title: {
        display: true,
        text: isRTL ? 'أداء القسم' : 'Department Performance',
        font: {
          size: 16
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  return (
    <div style={{ height: '300px' }}>
      <Bar data={chartData} options={options} />
    </div>
  );
};

// Processing Time Chart
interface ProcessingTimeChartProps extends ChartProps {
  data: ProcessingTimeByType[];
}

export const ProcessingTimeChart: React.FC<ProcessingTimeChartProps> = ({ data, isRTL = false }) => {
  const chartData = {
    labels: data.map(item => item.type),
    datasets: [
      {
        label: isRTL ? 'متوسط الأيام' : 'Average Days',
        data: data.map(item => item.avgDays),
        backgroundColor: [
          '#3b82f6',
          '#10b981',
          '#f59e0b',
          '#ef4444',
          '#8b5cf6'
        ]
      }
    ]
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: isRTL ? 'وقت المعالجة حسب النوع' : 'Processing Time by Type',
        font: {
          size: 16
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true
      }
    }
  };

  return (
    <div style={{ height: '300px' }}>
      <Bar data={chartData} options={options} />
    </div>
  );
};

// Weekly Workload Chart (for Editor Dashboard)
interface WorkloadChartProps extends ChartProps {
  data: { day: string; assigned: number; completed: number; }[];
}

export const WorkloadChart: React.FC<WorkloadChartProps> = ({ data, isRTL = false }) => {
  const chartData = {
    labels: data.map(item => item.day),
    datasets: [
      {
        label: isRTL ? 'مخصص' : 'Assigned',
        data: data.map(item => item.assigned),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      },
      {
        label: isRTL ? 'مكتمل' : 'Completed',
        data: data.map(item => item.completed),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4
      }
    ]
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top'
      },
      title: {
        display: true,
        text: isRTL ? 'عبء العمل الأسبوعي' : 'Weekly Workload',
        font: {
          size: 16
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  return (
    <div style={{ height: '300px' }}>
      <Line data={chartData} options={options} />
    </div>
  );
};