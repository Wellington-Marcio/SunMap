// no default React import needed with the new JSX transform
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

export default function DynamicChart({ type = 'line', data = {}, options = {}, height = 160 }: { type?: string; data?: any; options?: any; height?: number }) {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.75)' } },
      y: { grid: { color: 'rgba(255,255,255,0.06)' }, ticks: { color: 'rgba(255,255,255,0.75)' } },
    },
  };

  const mergedOptions = { ...defaultOptions, ...(options || {}) };

  if (type === 'bar') {
    return (
      <div style={{ width: '100%', height }} className="chart-placeholder">
        <Bar data={data} options={mergedOptions} />
      </div>
    );
  }

  // default to line
  return (
    <div style={{ width: '100%', height }} className="chart-placeholder">
      <Line data={data} options={mergedOptions} />
    </div>
  );
}
