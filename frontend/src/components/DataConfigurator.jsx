import { useState, useMemo } from 'react'

const CHART_TYPES = [
  { id: 'bar',       label: 'Bar',        icon: '▊▊▊' },
  { id: 'line',      label: 'Line',       icon: '📈' },
  { id: 'pie',       label: 'Pie',        icon: '◔' },
  { id: 'doughnut',  label: 'Doughnut',   icon: '◎' },
  { id: 'polarArea', label: 'Polar Area', icon: '⊛' },
  { id: 'radar',     label: 'Radar',      icon: '✦' },
]

const DUPLICATE_OPTIONS = [
  { id: 'first',   label: 'Keep First' },
  { id: 'sum',     label: 'Sum Values' },
  { id: 'average', label: 'Average Values' },
]

function applyCleaningAndAggregate(rows, config) {
  const { labelCol, valueCol, skipEmpty, skipNonNumeric, trimWhitespace, duplicateStrategy, minValue, maxValue } = config

  let processed = rows.map(row => ({
    label: trimWhitespace ? (row[labelCol] || '').trim() : (row[labelCol] || ''),
    raw:   trimWhitespace ? (row[valueCol] || '').trim() : (row[valueCol] || ''),
  }))

  if (skipEmpty) {
    processed = processed.filter(r => r.label !== '' && r.raw !== '')
  }

  let withValues = processed.map(r => ({ label: r.label, value: parseFloat(r.raw), rawStr: r.raw }))

  if (skipNonNumeric) {
    withValues = withValues.filter(r => !isNaN(r.value))
  } else {
    withValues = withValues.map(r => ({ ...r, value: isNaN(r.value) ? 0 : r.value }))
  }

  if (minValue !== '') {
    const min = parseFloat(minValue)
    if (!isNaN(min)) withValues = withValues.filter(r => r.value >= min)
  }
  if (maxValue !== '') {
    const max = parseFloat(maxValue)
    if (!isNaN(max)) withValues = withValues.filter(r => r.value <= max)
  }

  const grouped = new Map()
  for (const r of withValues) {
    if (!grouped.has(r.label)) {
      grouped.set(r.label, [])
    }
    grouped.get(r.label).push(r.value)
  }

  const labels = []
  const values = []
  for (const [label, vals] of grouped.entries()) {
    labels.push(label)
    if (duplicateStrategy === 'sum') {
      values.push(vals.reduce((a, b) => a + b, 0))
    } else if (duplicateStrategy === 'average') {
      values.push(vals.reduce((a, b) => a + b, 0) / vals.length)
    } else {
      values.push(vals[0])
    }
  }

  return { labels, values }
}

export default function DataConfigurator({ parsedData, onVisualize, onBack }) {
  const { columnNames, rows } = parsedData

  const [labelCol, setLabelCol]             = useState(0)
  const [valueCol, setValueCol]             = useState(1)
  const [chartType, setChartType]           = useState('bar')
  const [skipEmpty, setSkipEmpty]           = useState(true)
  const [skipNonNumeric, setSkipNonNumeric] = useState(true)
  const [trimWhitespace, setTrimWhitespace] = useState(true)
  const [duplicateStrategy, setDuplicate]   = useState('sum')
  const [minValue, setMinValue]             = useState('')
  const [maxValue, setMaxValue]             = useState('')

  const preview = useMemo(() => rows.slice(0, 5), [rows])

  const processedPreview = useMemo(() => {
    try {
      return applyCleaningAndAggregate(rows, {
        labelCol, valueCol, skipEmpty, skipNonNumeric,
        trimWhitespace, duplicateStrategy, minValue, maxValue,
      })
    } catch {
      return null
    }
  }, [rows, labelCol, valueCol, skipEmpty, skipNonNumeric, trimWhitespace, duplicateStrategy, minValue, maxValue])

  function handleGenerate() {
    if (!processedPreview || processedPreview.labels.length === 0) return
    onVisualize({
      labels:      processedPreview.labels,
      values:      processedPreview.values,
      columnNames: [columnNames[labelCol], columnNames[valueCol]],
      chartType,
    })
  }

  const canGenerate = processedPreview && processedPreview.labels.length > 0

  return (
    <div className="configurator">
      <div className="config-header">
        <div>
          <h2 className="section-title">Configure Visualization</h2>
          <p className="config-subtitle">
            {rows.length} rows &middot; {columnNames.length} columns detected
          </p>
        </div>
        <button className="btn btn-ghost" onClick={onBack}>← Upload Different File</button>
      </div>

      <div className="config-grid">

        {/* Left column */}
        <div className="config-left">

          {/* Raw data preview */}
          <div className="config-card">
            <h3 className="config-card-title">Data Preview <span className="badge">first 5 rows</span></h3>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    {columnNames.map((col, i) => <th key={i}>{col}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, ri) => (
                    <tr key={ri}>
                      {columnNames.map((_, ci) => (
                        <td key={ci}>{row[ci] ?? ''}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Column Selection */}
          <div className="config-card">
            <h3 className="config-card-title">Column Selection</h3>
            <div className="field-row">
              <div className="field">
                <label className="field-label">Label Column (X-axis / Categories)</label>
                <select className="select" value={labelCol} onChange={e => setLabelCol(Number(e.target.value))}>
                  {columnNames.map((col, i) => (
                    <option key={i} value={i}>{col}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="field-label">Value Column (Y-axis / Numbers)</label>
                <select className="select" value={valueCol} onChange={e => setValueCol(Number(e.target.value))}>
                  {columnNames.map((col, i) => (
                    <option key={i} value={i}>{col}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Data Cleaning */}
          <div className="config-card">
            <h3 className="config-card-title">Data Cleaning</h3>
            <div className="cleaning-options">
              <label className="checkbox-row">
                <input type="checkbox" checked={skipEmpty} onChange={e => setSkipEmpty(e.target.checked)} />
                <span>
                  <strong>Skip empty rows</strong>
                  <small>Remove rows where label or value is blank</small>
                </span>
              </label>
              <label className="checkbox-row">
                <input type="checkbox" checked={skipNonNumeric} onChange={e => setSkipNonNumeric(e.target.checked)} />
                <span>
                  <strong>Skip non-numeric values</strong>
                  <small>Remove rows where value column cannot be parsed as a number</small>
                </span>
              </label>
              <label className="checkbox-row">
                <input type="checkbox" checked={trimWhitespace} onChange={e => setTrimWhitespace(e.target.checked)} />
                <span>
                  <strong>Trim whitespace</strong>
                  <small>Strip leading/trailing spaces from all values</small>
                </span>
              </label>
            </div>

            <div className="field" style={{ marginTop: '1rem' }}>
              <label className="field-label">Duplicate Label Handling</label>
              <div className="radio-group">
                {DUPLICATE_OPTIONS.map(opt => (
                  <label key={opt.id} className={`radio-btn ${duplicateStrategy === opt.id ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="duplicate"
                      value={opt.id}
                      checked={duplicateStrategy === opt.id}
                      onChange={() => setDuplicate(opt.id)}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="field-row" style={{ marginTop: '1rem' }}>
              <div className="field">
                <label className="field-label">Min Value Filter</label>
                <input
                  type="number"
                  className="input"
                  placeholder="No minimum"
                  value={minValue}
                  onChange={e => setMinValue(e.target.value)}
                />
              </div>
              <div className="field">
                <label className="field-label">Max Value Filter</label>
                <input
                  type="number"
                  className="input"
                  placeholder="No maximum"
                  value={maxValue}
                  onChange={e => setMaxValue(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="config-right">

          {/* Chart Type */}
          <div className="config-card">
            <h3 className="config-card-title">Chart Type</h3>
            <div className="chart-type-grid">
              {CHART_TYPES.map(ct => (
                <button
                  key={ct.id}
                  className={`chart-type-card ${chartType === ct.id ? 'active' : ''}`}
                  onClick={() => setChartType(ct.id)}
                >
                  <span className="chart-type-icon">{ct.icon}</span>
                  <span className="chart-type-label">{ct.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Processed Preview */}
          <div className="config-card">
            <h3 className="config-card-title">
              Processed Data Preview
              {processedPreview && (
                <span className="badge">{processedPreview.labels.length} rows after cleaning</span>
              )}
            </h3>
            {processedPreview && processedPreview.labels.length > 0 ? (
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{columnNames[labelCol]}</th>
                      <th>{columnNames[valueCol]}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processedPreview.labels.slice(0, 8).map((label, i) => (
                      <tr key={i}>
                        <td>{label}</td>
                        <td>{typeof processedPreview.values[i] === 'number'
                          ? processedPreview.values[i].toFixed(2).replace(/\.00$/, '')
                          : processedPreview.values[i]}</td>
                      </tr>
                    ))}
                    {processedPreview.labels.length > 8 && (
                      <tr>
                        <td colSpan={2} style={{ color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center' }}>
                          ... and {processedPreview.labels.length - 8} more rows
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="empty-state">No data matches the current cleaning rules. Try adjusting the options.</p>
            )}
          </div>

          <button
            className="btn btn-primary btn-full"
            onClick={handleGenerate}
            disabled={!canGenerate}
          >
            Generate Chart →
          </button>
        </div>
      </div>
    </div>
  )
}
