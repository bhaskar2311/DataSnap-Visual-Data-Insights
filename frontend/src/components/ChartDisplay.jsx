import { useState, useRef, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Bar, Line, Pie, Doughnut, PolarArea, Radar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale, LinearScale, RadialLinearScale,
  BarElement, LineElement, PointElement, ArcElement,
  Title, Tooltip, Legend, Filler,
)

function DownloadIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  )
}

const CHART_TYPES = [
  { id: 'bar',           label: 'Bar' },
  { id: 'horizontalBar', label: 'Horiz. Bar' },
  { id: 'line',          label: 'Line' },
  { id: 'area',          label: 'Area' },
  { id: 'steppedLine',   label: 'Stepped' },
  { id: 'pie',           label: 'Pie' },
  { id: 'doughnut',      label: 'Doughnut' },
  { id: 'polarArea',     label: 'Polar Area' },
  { id: 'radar',         label: 'Radar' },
]

const DEFAULT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#3b82f6', '#a855f7',
  '#06b6d4', '#84cc16', '#fb923c', '#f472b6', '#34d399',
]

const PALETTE = [
  // Row 1 — Blues / Purples
  '#6366f1', '#4f46e5', '#7c3aed', '#8b5cf6', '#a855f7',
  // Row 2 — Pinks / Reds
  '#ec4899', '#f43f5e', '#ef4444', '#f97316', '#fb923c',
  // Row 3 — Yellows / Greens
  '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6',
  // Row 4 — Teals / Darks
  '#06b6d4', '#3b82f6', '#1e40af', '#64748b', '#1e293b',
]

// ── Dataset builder (uses custom colors) ────────────────────────────────────

function buildDataset(chartData, colors, activeType) {
  const bgColors  = chartData.labels.map((_, i) => colors[i] || DEFAULT_COLORS[i % DEFAULT_COLORS.length])
  const primary   = colors[0] || DEFAULT_COLORS[0]

  const baseDataset = {
    label: chartData.columnNames[1] || 'Value',
    data:  chartData.values,
    backgroundColor: bgColors,
    borderColor:     bgColors,
    borderWidth: 1,
  }

  // Line-family: single colour with gradient fill
  if (activeType === 'line' || activeType === 'area' || activeType === 'steppedLine') {
    return {
      labels: chartData.labels,
      datasets: [{
        ...baseDataset,
        backgroundColor: activeType === 'area' ? primary + '33' : primary + '18',
        borderColor:     primary,
        borderWidth:     2.5,
        pointBackgroundColor: primary,
        pointBorderColor:     '#fff',
        pointBorderWidth:     2,
        pointRadius:     activeType === 'steppedLine' ? 3 : 4,
        tension:         activeType === 'steppedLine' ? 0 : 0.4,
        fill:            activeType === 'line' ? false : true,
        stepped:         activeType === 'steppedLine' ? 'before' : false,
      }],
    }
  }

  if (activeType === 'radar') {
    return {
      labels: chartData.labels,
      datasets: [{
        ...baseDataset,
        backgroundColor: primary + '33',
        borderColor:     primary,
        borderWidth:     2,
        pointBackgroundColor: primary,
        pointBorderColor:     '#fff',
        pointBorderWidth:     2,
        pointRadius:     4,
      }],
    }
  }

  // Horizontal bar & regular bar — per-bar colours
  return { labels: chartData.labels, datasets: [baseDataset] }
}

function buildOptions(chartType, columnNames) {
  const titleText = `${columnNames[1] || 'Value'} by ${columnNames[0] || 'Category'}`

  const tooltip = {
    callbacks: {
      label: (ctx) => {
        const val = ctx.parsed?.y ?? ctx.parsed?.x ?? ctx.parsed ?? ctx.raw
        const num = typeof val === 'number' ? val : parseFloat(val)
        return ` ${ctx.label || ctx.dataset.label}: ${isNaN(num) ? val : num.toLocaleString()}`
      },
    },
  }

  const base = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' },
      title:  { display: true, text: titleText, font: { size: 15, weight: '600' } },
      tooltip,
    },
  }

  // Cartesian charts (no legend needed, have axes)
  if (['bar', 'horizontalBar', 'line', 'area', 'steppedLine'].includes(chartType)) {
    const isHorizontal = chartType === 'horizontalBar'
    return {
      ...base,
      indexAxis: isHorizontal ? 'y' : 'x',
      plugins: { ...base.plugins, legend: { display: false } },
      scales: {
        x: { beginAtZero: !isHorizontal },
        y: { beginAtZero: isHorizontal ? false : true },
      },
    }
  }
  return base
}

function renderChart(chartType, dataset, options) {
  switch (chartType) {
    case 'bar':           return <Bar       data={dataset} options={options} />
    case 'horizontalBar': return <Bar       data={dataset} options={options} />
    case 'line':          return <Line      data={dataset} options={options} />
    case 'area':          return <Line      data={dataset} options={options} />
    case 'steppedLine':   return <Line      data={dataset} options={options} />
    case 'pie':           return <Pie       data={dataset} options={options} />
    case 'doughnut':      return <Doughnut  data={dataset} options={options} />
    case 'polarArea':     return <PolarArea data={dataset} options={options} />
    case 'radar':         return <Radar     data={dataset} options={options} />
    default:              return <Bar       data={dataset} options={options} />
  }
}

// ── Download helpers ─────────────────────────────────────────────────────────

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = filename
  document.body.appendChild(a); a.click(); a.remove()
  URL.revokeObjectURL(url)
}

function toCSV(chartData) {
  const { columnNames, labels, values } = chartData
  const total  = values.reduce((a, b) => a + b, 0)
  const header = [columnNames[0], columnNames[1], 'Percentage'].join(',')
  const rows   = labels.map((label, i) => {
    const pct = total > 0 ? ((values[i] / total) * 100).toFixed(2) : '0.00'
    return [`"${String(label).replace(/"/g, '""')}"`, values[i], pct].join(',')
  })
  return [header, ...rows].join('\r\n')
}

function toJSON(chartData) {
  const { columnNames, labels, values } = chartData
  const total = values.reduce((a, b) => a + b, 0)
  const data  = labels.map((label, i) => ({
    [columnNames[0]]: label,
    [columnNames[1]]: values[i],
    percentage: total > 0 ? parseFloat(((values[i] / total) * 100).toFixed(2)) : 0,
  }))
  return JSON.stringify({ meta: { labelColumn: columnNames[0], valueColumn: columnNames[1], totalRows: labels.length, total }, data }, null, 2)
}

// ── Color Picker Popup ───────────────────────────────────────────────────────

function ColorPicker({ current, onSelect, onClose }) {
  const ref = useRef(null)
  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div className="color-picker-popup" ref={ref}>
      <div className="color-picker-grid">
        {PALETTE.map(color => (
          <button
            key={color}
            className={`palette-swatch ${current === color ? 'selected' : ''}`}
            style={{ background: color }}
            onClick={() => { onSelect(color); onClose() }}
            title={color}
          />
        ))}
      </div>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function ChartDisplay({ chartData, onReconfigure, onReset }) {
  const [activeType, setActiveType] = useState(chartData.chartType || 'bar')
  const [downloaded, setDownloaded] = useState(null)
  const [colors, setColors]         = useState(() =>
    chartData.labels.map((_, i) => DEFAULT_COLORS[i % DEFAULT_COLORS.length])
  )
  const [openPickerIdx, setOpenPickerIdx] = useState(null)
  const [colorPanelOpen, setColorPanelOpen] = useState(false)

  function setColor(idx, color) {
    setColors(prev => { const next = [...prev]; next[idx] = color; return next })
  }

  function resetColors() {
    setColors(chartData.labels.map((_, i) => DEFAULT_COLORS[i % DEFAULT_COLORS.length]))
  }

  function handleDownload(format) {
    const slug = (chartData.columnNames[1] || 'data').replace(/\s+/g, '_').toLowerCase()
    const ts   = new Date().toISOString().slice(0, 10)
    if (format === 'csv')  downloadFile(toCSV(chartData),  `datasnap_${slug}_${ts}.csv`,  'text/csv;charset=utf-8;')
    if (format === 'json') downloadFile(toJSON(chartData), `datasnap_${slug}_${ts}.json`, 'application/json')
    if (format === 'png') {
      const canvas = document.querySelector('.main-chart canvas')
      if (canvas) {
        const link = document.createElement('a')
        link.download = `datasnap_${slug}_${ts}.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
      }
    }
    setDownloaded(format)
    setTimeout(() => setDownloaded(null), 2000)
  }

  const dataset = buildDataset(chartData, colors, activeType)
  const options  = buildOptions(activeType, chartData.columnNames)

  const total  = chartData.values.reduce((a, b) => a + b, 0)
  const maxVal = Math.max(...chartData.values)
  const minVal = Math.min(...chartData.values)
  const avg    = total / chartData.values.length

  return (
    <div className="chart-section">
      <div className="chart-header">
        <div>
          <h2 className="section-title">Visualization</h2>
          <p className="config-subtitle">
            {chartData.labels.length} data points &middot; {chartData.columnNames[0]} vs {chartData.columnNames[1]}
          </p>
        </div>
        <div className="chart-controls">
          <button className="btn btn-ghost" onClick={onReconfigure}>← Reconfigure</button>
          <button className="btn btn-ghost" onClick={onReset}>Upload New File</button>
        </div>
      </div>

      {/* Chart type switcher */}
      <div className="view-toggle chart-type-switcher">
        {CHART_TYPES.map(ct => (
          <button
            key={ct.id}
            className={`toggle-btn ${activeType === ct.id ? 'active' : ''}`}
            onClick={() => setActiveType(ct.id)}
          >
            {ct.label}
          </button>
        ))}
      </div>

      {/* Stats row */}
      <div className="stats-row">
        <div className="stat-card"><span className="stat-label">Total</span><span className="stat-value">{total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
        <div className="stat-card"><span className="stat-label">Average</span><span className="stat-value">{avg.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
        <div className="stat-card"><span className="stat-label">Max</span><span className="stat-value">{maxVal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
        <div className="stat-card"><span className="stat-label">Min</span><span className="stat-value">{minVal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
        <div className="stat-card"><span className="stat-label">Data Points</span><span className="stat-value">{chartData.labels.length}</span></div>
      </div>

      {/* Download bar */}
      <div className="download-bar">
        <span className="download-label">Download cleaned data as:</span>
        <div className="download-actions">
          {['csv', 'json', 'png'].map(fmt => (
            <button
              key={fmt}
              className={`btn btn-download ${downloaded === fmt ? 'downloaded' : ''}`}
              onClick={() => handleDownload(fmt)}
            >
              {downloaded === fmt ? '✓ Downloaded' : <><DownloadIcon /> {fmt.toUpperCase()}{fmt === 'png' ? ' Chart' : ''}</>}
            </button>
          ))}
        </div>
      </div>

      {/* Color customization panel */}
      <div className="color-panel">
        <button
          className="color-panel-toggle"
          onClick={() => setColorPanelOpen(p => !p)}
        >
          <span className="color-preview-row">
            {chartData.labels.slice(0, 8).map((_, i) => (
              <span key={i} className="mini-swatch" style={{ background: colors[i] }} />
            ))}
            {chartData.labels.length > 8 && <span className="mini-more">+{chartData.labels.length - 8}</span>}
          </span>
          <span className="color-panel-label">🎨 Customize Colors</span>
          <span className="color-panel-chevron">{colorPanelOpen ? '▲' : '▼'}</span>
        </button>

        {colorPanelOpen && (
          <div className="color-panel-body">
            <div className="color-entries">
              {chartData.labels.map((label, i) => (
                <div key={i} className="color-entry">
                  <div className="color-entry-left">
                    <div className="color-swatch-wrap">
                      <button
                        className="color-swatch-btn"
                        style={{ background: colors[i] }}
                        onClick={() => setOpenPickerIdx(openPickerIdx === i ? null : i)}
                        title={`Change color for "${label}"`}
                      />
                      {openPickerIdx === i && (
                        <ColorPicker
                          current={colors[i]}
                          onSelect={color => setColor(i, color)}
                          onClose={() => setOpenPickerIdx(null)}
                        />
                      )}
                    </div>
                    <span className="color-entry-label" title={label}>{label}</span>
                  </div>
                  <span className="color-entry-hex">{colors[i]}</span>
                </div>
              ))}
            </div>
            <button className="btn btn-ghost btn-reset-colors" onClick={resetColors}>
              ↺ Reset to defaults
            </button>
          </div>
        )}
      </div>

      {/* Main chart */}
      <div className="chart-card main-chart">
        {renderChart(activeType, dataset, options)}
      </div>

      {/* Data table */}
      <div className="data-summary">
        <h3>Full Data Table</h3>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{chartData.columnNames[0]}</th>
                <th>{chartData.columnNames[1]}</th>
                <th>% of Total</th>
              </tr>
            </thead>
            <tbody>
              {chartData.labels.map((label, i) => (
                <tr key={i}>
                  <td style={{ width: '2.5rem' }}>
                    <span className="table-dot" style={{ background: colors[i] }} />
                  </td>
                  <td>{label}</td>
                  <td>{chartData.values[i].toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                  <td>
                    <div className="percent-bar-wrap">
                      <div className="percent-bar" style={{ width: `${(chartData.values[i] / maxVal) * 100}%`, background: colors[i] }} />
                      <span>{total > 0 ? ((chartData.values[i] / total) * 100).toFixed(1) : 0}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
