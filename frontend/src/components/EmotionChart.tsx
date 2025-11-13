import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export interface EmotionChartProps {
  counts?: Record<string, number> | null;
  percentages?: Record<string, number> | null;
}

export default function EmotionChart({ counts, percentages }: EmotionChartProps) {
  // Map backend summary keys to chart labels
  const happy = (counts?.Positive ?? 0) as number;
  const calm = (counts?.Calm ?? 0) as number;
  const stressed = (counts?.Difficult ?? 0) as number; // map Difficult -> Stressed
  const sad = 0; // not tracked separately in backend summary

  const labels = ['Happy', 'Stressed', 'Calm', 'Sad'];
  const data = {
    labels,
    datasets: [
      {
        label: 'Count (7 days)',
        data: [happy, stressed, calm, sad],
        backgroundColor: ['#22c55e', '#ef4444', '#6b7280', '#2563eb'],
        borderRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false as const,
    plugins: {
      legend: { display: true, position: 'bottom' as const },
      title: { display: false, text: 'Emotions' },
    },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, ticks: { precision: 0 } },
    },
  };

  return (
    <div className="w-full h-64">
      <Bar data={data} options={options} />
    </div>
  );
}
