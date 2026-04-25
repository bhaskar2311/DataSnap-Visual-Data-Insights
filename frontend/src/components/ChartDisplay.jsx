import { useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar, Pie } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#3b82f6', '#a855f7',
]

function buildDataset(chartData) {
  const backgroundColors = chartData.labels.map((_, i) => COLORS[i % COLORS.length])
  return {
    labels: chartData.labels,
    datasets: [
      {
        label: chartData.columnNames[1] || 'Value',
        data: chartData.values,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors.map(c => c),
        borderWidth: 1,
      },
    ],
  }
}

const barOptions = {
  responsive: true,
  plugins: {
    legend: { display: false },
    title: { display: true, text: 'Bar Chart', font: { size: 16 } },
  },
  scales: {
    y: { beginAtZero: true },
  },
}

const pieOptions = {
  responsive: true,
  plugins: {
    legend: { position: 'right' },
    title: { display: true, text: 'Pie Chart', font: { size: 16 } },
  },
}

export default function ChartDisplay({ chartData, onReset }) {
  const [view, setView] = useState('both')
  const dataset = buildDataset(chartData)

  return (
    <div className="chart-section">
      <div className="chart-header">
        <h2 className="section-title">Your Visualizations</h2>
        <div className="chart-controls">
          <div className="view-toggle">
            {['both', 'bar', 'pie'].map((v) => (
              <button
                key={v}
                className={`toggle-btn ${view === v ? 'active' : ''}`}
                onClick={() => setView(v)}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
          <button className="btn btn-ghost" onClick={onReset}>Upload New File</button>
        </div>
      </div>

      <div className={`chart-grid ${view !== 'both' ? 'single' : ''}`}>
        {(view === 'both' || view === 'bar') && (
          <div className="chart-card">
            <Bar data={dataset} options={barOptions} />
          </div>
        )}
        {(view === 'both' || view === 'pie') && (
          <div className="chart-card">
            <Pie data={dataset} options={pieOptions} />
          </div>
        )}
      </div>

      <div className="data-summary">
        <h3>Data Summary</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>{chartData.columnNames[0]}</th>
              <th>{chartData.columnNames[1]}</th>
            </tr>
          </thead>
          <tbody>
            {chartData.labels.map((label, i) => (
              <tr key={i}>
                <td>{label}</td>
                <td>{chartData.values[i]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
