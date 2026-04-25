import { useState, useMemo } from 'react'

const CHART_TYPES = [
  { id: 'bar',           label: 'Bar',         icon: '▊▊▊' },
  { id: 'horizontalBar', label: 'Horiz. Bar',  icon: '▬▬▬' },
  { id: 'line',          label: 'Line',        icon: '📈' },
  { id: 'area',          label: 'Area',        icon: '◿' },
  { id: 'steppedLine',   label: 'Stepped',     icon: '⌐' },
  { id: 'pie',           label: 'Pie',         icon: '◔' },
  { id: 'doughnut',      label: 'Doughnut',    icon: '◎' },
  { id: 'polarArea',     label: 'Polar Area',  icon: '⊛' },
  { id: 'radar',         label: 'Radar',       icon: '✦' },
]

const DUPLICATE_OPTIONS = [
  { id: 'first',   label: 'Keep First',     hint: 'Use only the first row per label — good when each label is truly unique' },
  { id: 'sum',     label: 'Sum',            hint: 'Add all values per label — good for counts, sales, totals' },
  { id: 'average', label: 'Average',        hint: 'Mean of all values per label — good for Age, Salary, Score, Temperature' },
]

// ── Smart suggestion engine ──────────────────────────────────────────────────

function analyzeColumns(columnNames, rows) {
  const n = rows.length
  return columnNames.map((name, idx) => {
    const raw      = rows.map(r => (r[idx] ?? '').trim()).filter(v => v !== '')
    const numerics = raw.map(v => parseFloat(v)).filter(v => !isNaN(v))
    const unique   = [...new Set(raw)]
    const nameLow  = name.toLowerCase()

    const isIdLike        = nameLow.includes('id') || nameLow === 'index' || nameLow === '#' || unique.length === n
    const numericRatio    = numerics.length / Math.max(raw.length, 1)
    const isNumeric       = numericRatio > 0.85
    const isBinary        = isNumeric && unique.length <= 2 && numerics.every(v => v === 0 || v === 1)
    const isLowCardinality = unique.length <= 20
    const isCategorical   = !isNumeric && isLowCardinality
    const hasNegatives    = numerics.some(v => v < 0)
    const looksLikeDate   = !isNumeric && raw.some(v => /\d{4}[-/]\d{1,2}/.test(v) || /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(v))

    return {
      idx, name, isIdLike, isNumeric, isBinary, isCategorical, isLowCardinality,
      looksLikeDate, hasNegatives, cardinality: unique.length, numericRatio, numerics,
    }
  })
}

function suggestBestConfig(columnNames, rows) {
  const analysis = analyzeColumns(columnNames, rows)

  // Score each column as a potential LABEL (categories/X-axis)
  const labelCandidates = analysis.map(c => {
    if (c.isIdLike) return { ...c, labelScore: -200 }
    let s = 0
    if (c.isCategorical)              s += 60   // text categorical = ideal
    if (c.looksLikeDate)              s += 30   // date-like = good for line
    if (c.cardinality >= 2  && c.cardinality <= 5)  s += 50
    if (c.cardinality >= 6  && c.cardinality <= 15) s += 35
    if (c.cardinality >= 16 && c.cardinality <= 30) s += 10
    if (c.cardinality > 30)           s -= 40   // too many = bad label
    if (c.isNumeric && c.cardinality > 15) s -= 60  // numeric high-cardinality = terrible label
    if (c.isNumeric && c.cardinality <= 6) s += 20  // numeric but few values (e.g. Pclass 1,2,3) = ok
    return { ...c, labelScore: s }
  }).sort((a, b) => b.labelScore - a.labelScore)

  // Score each column as a potential VALUE (Y-axis/numbers)
  const valueCandidates = analysis.map(c => {
    if (c.isIdLike) return { ...c, valueScore: -200 }
    let s = 0
    if (c.isNumeric)    s += 80
    if (c.isBinary)     s += 10
    if (!c.isNumeric)   s -= 60
    return { ...c, valueScore: s }
  }).sort((a, b) => b.valueScore - a.valueScore)

  // Pick best non-overlapping pair
  let labelIdx = labelCandidates[0]?.idx ?? 0
  let valueIdx = valueCandidates[0]?.idx ?? 1
  if (labelIdx === valueIdx) {
    const altV = valueCandidates.find(c => c.idx !== labelIdx)
    const altL = labelCandidates.find(c => c.idx !== valueIdx)
    if (altV) valueIdx = altV.idx
    else if (altL) labelIdx = altL.idx
  }

  const lA = analysis[labelIdx]
  const vA = analysis[valueIdx]

  // Determine best chart type
  let chartType  = 'bar'
  let chartReason = ''

  // Check if label values are monotonically increasing (time-series or sequential)
  const labelNums = lA.looksLikeDate ? [] : analysis[labelIdx].numerics
  const isSequential = labelNums.length > 3 && labelNums.every((v, i) => i === 0 || v >= labelNums[i - 1])

  if (lA.looksLikeDate || isSequential) {
    chartType   = 'area'
    chartReason = 'Sequential or date-like labels detected — an Area chart shows trends and magnitude together.'
  } else if (lA.cardinality <= 4) {
    chartType   = 'doughnut'
    chartReason = `Only ${lA.cardinality} categories — a Doughnut chart shows part-of-whole proportions clearly.`
  } else if (lA.cardinality <= 8) {
    chartType   = 'pie'
    chartReason = `${lA.cardinality} categories — a Pie chart gives a clear breakdown at a glance.`
  } else if (lA.cardinality <= 20) {
    // Check if labels are long strings — horizontal bar is easier to read
    const avgLabelLen = analysis[labelIdx].unique ? analysis[labelIdx].unique.reduce((s, v) => s + String(v).length, 0) / analysis[labelIdx].unique.length : 0
    if (avgLabelLen > 10) {
      chartType   = 'horizontalBar'
      chartReason = `${lA.cardinality} categories with long labels — a Horizontal Bar chart keeps labels readable.`
    } else {
      chartType   = 'bar'
      chartReason = `${lA.cardinality} categories — a Bar chart is the clearest comparison tool here.`
    }
  } else {
    chartType   = 'horizontalBar'
    chartReason = `Many categories (${lA.cardinality}). Horizontal Bar keeps the chart readable — consider filtering with Min/Max to reduce noise.`
  }

  // Determine duplicate strategy using name hints + value characteristics
  const valueName = vA.name.toLowerCase()
  const AVG_HINTS = ['age', 'salary', 'price', 'score', 'rate', 'temp', 'height', 'weight',
                     'distance', 'duration', 'speed', 'income', 'revenue', 'fare', 'grade',
                     'rating', 'percent', 'pct', 'ratio', 'avg', 'average', 'mean', 'median']
  const SUM_HINTS = ['count', 'total', 'num', 'qty', 'quantity', 'freq', 'frequency',
                     'sales', 'transactions', 'orders', 'tickets', 'visits', 'clicks', 'views']

  const nameHintsAvg = AVG_HINTS.some(h => valueName.includes(h))
  const nameHintsSum = SUM_HINTS.some(h => valueName.includes(h))

  // Value-range analysis: if max value is already large (>200) and not counts, it's a measurement
  const valMax = vA.numerics.length ? Math.max(...vA.numerics) : 0
  const hasDecimals = vA.numerics.some(v => !Number.isInteger(v))
  const looksLikeMeasurement = hasDecimals || valMax > 200 || nameHintsAvg

  let duplicateStrategy = 'sum'
  let dupReason = 'Summing duplicate labels — good for counts and totals.'

  if (vA.isBinary) {
    duplicateStrategy = 'average'
    dupReason = 'Binary (0/1) values detected — averaging gives a rate/proportion (e.g. survival rate).'
  } else if (vA.hasNegatives || nameHintsAvg || (looksLikeMeasurement && !nameHintsSum)) {
    duplicateStrategy = 'average'
    dupReason = `"${vA.name}" looks like a measurement — averaging per label gives meaningful values (e.g. average age per class).`
  } else if (nameHintsSum) {
    duplicateStrategy = 'sum'
    dupReason = `"${vA.name}" looks like a count/total — summing per label gives the correct aggregate.`
  }

  // Detect column quality issues
  const warnings = []
  if (lA.isIdLike)    warnings.push(`"${lA.name}" looks like an ID column — using it as a label will create one bar per row.`)
  if (!vA.isNumeric)  warnings.push(`"${vA.name}" is not numeric — values may not chart correctly.`)
  if (lA.cardinality > 30) warnings.push(`${lA.cardinality} unique labels is a lot — the chart may look crowded. Try filtering.`)

  // Confidence
  const confidence = lA.labelScore > 30 && vA.valueScore > 50 ? 'high' : lA.labelScore > 0 ? 'medium' : 'low'

  return {
    labelCol: labelIdx,
    valueCol: valueIdx,
    chartType,
    duplicateStrategy,
    skipEmpty: true,
    skipNonNumeric: true,
    trimWhitespace: true,
    minValue: '',
    maxValue: '',
    reasoning: {
      labelCol:  `"${lA.name}" (${lA.cardinality} unique values, ${lA.isCategorical ? 'categorical' : lA.isNumeric ? 'numeric' : 'mixed'})`,
      valueCol:  `"${vA.name}" (numeric${vA.isBinary ? ', binary 0/1' : ''})`,
      chartType: chartReason,
      duplicate: dupReason,
      confidence,
      warnings,
    },
  }
}

// ── Data processing (same as before) ────────────────────────────────────────

function applyCleaningAndAggregate(rows, config) {
  const { labelCol, valueCol, skipEmpty, skipNonNumeric, trimWhitespace, duplicateStrategy, minValue, maxValue } = config

  let processed = rows.map(row => ({
    label: trimWhitespace ? (row[labelCol] || '').trim() : (row[labelCol] || ''),
    raw:   trimWhitespace ? (row[valueCol] || '').trim() : (row[valueCol] || ''),
  }))

  if (skipEmpty)      processed = processed.filter(r => r.label !== '' && r.raw !== '')

  let withValues = processed.map(r => ({ label: r.label, value: parseFloat(r.raw) }))

  if (skipNonNumeric) withValues = withValues.filter(r => !isNaN(r.value))
  else                withValues = withValues.map(r => ({ ...r, value: isNaN(r.value) ? 0 : r.value }))

  if (minValue !== '') { const min = parseFloat(minValue); if (!isNaN(min)) withValues = withValues.filter(r => r.value >= min) }
  if (maxValue !== '') { const max = parseFloat(maxValue); if (!isNaN(max)) withValues = withValues.filter(r => r.value <= max) }

  const grouped = new Map()
  for (const r of withValues) {
    if (!grouped.has(r.label)) grouped.set(r.label, [])
    grouped.get(r.label).push(r.value)
  }

  const labels = [], values = []
  for (const [label, vals] of grouped.entries()) {
    labels.push(label)
    if (duplicateStrategy === 'sum')    values.push(vals.reduce((a, b) => a + b, 0))
    else if (duplicateStrategy === 'average') values.push(vals.reduce((a, b) => a + b, 0) / vals.length)
    else values.push(vals[0])
  }

  return { labels, values }
}

// ── Component ────────────────────────────────────────────────────────────────

export default function DataConfigurator({ parsedData, onVisualize, onBack }) {
  const { columnNames, rows } = parsedData

  const [labelCol, setLabelCol]             = useState(0)
  const [valueCol, setValueCol]             = useState(Math.min(1, columnNames.length - 1))
  const [chartType, setChartType]           = useState('bar')
  const [skipEmpty, setSkipEmpty]           = useState(true)
  const [skipNonNumeric, setSkipNonNumeric] = useState(true)
  const [trimWhitespace, setTrimWhitespace] = useState(true)
  const [duplicateStrategy, setDuplicate]   = useState('sum')
  const [minValue, setMinValue]             = useState('')
  const [maxValue, setMaxValue]             = useState('')
  const [suggestion, setSuggestion]         = useState(null)
  const [suggestionApplied, setSuggestionApplied] = useState(false)

  const preview = useMemo(() => rows.slice(0, 5), [rows])

  // Detect when Sum is producing unreasonably inflated values
  const aggregationWarning = useMemo(() => {
    if (duplicateStrategy !== 'sum') return null
    // Find the max raw value in the value column
    const rawNumerics = rows.map(r => parseFloat((r[valueCol] || '').trim())).filter(v => !isNaN(v))
    if (!rawNumerics.length) return null
    const rawMax = Math.max(...rawNumerics)
    // Check how many rows map to each label
    const labelCounts = {}
    rows.forEach(r => {
      const lbl = (r[labelCol] || '').trim()
      if (lbl) labelCounts[lbl] = (labelCounts[lbl] || 0) + 1
    })
    const maxGroupSize = Math.max(...Object.values(labelCounts))
    // If summing would multiply the value by a large factor, warn
    if (maxGroupSize > 5 && rawMax * maxGroupSize > rawMax * 3) {
      const colName = columnNames[valueCol]
      const avgHints = ['age', 'salary', 'price', 'score', 'rate', 'temp', 'height', 'weight', 'fare', 'grade', 'rating', 'percent', 'income']
      const looksLikeMeasurement = avgHints.some(h => colName.toLowerCase().includes(h)) || rawMax > 100
      if (looksLikeMeasurement) {
        return `⚠ "${colName}" looks like a measurement (max raw value: ${rawMax.toLocaleString()}). With Sum, values from up to ${maxGroupSize} rows get added together — producing numbers like ${(rawMax * maxGroupSize).toLocaleString()}. Switch to "Average" to get meaningful values like the actual ${colName}.`
      }
    }
    return null
  }, [rows, labelCol, valueCol, duplicateStrategy, columnNames])

  const processedPreview = useMemo(() => {
    try {
      return applyCleaningAndAggregate(rows, {
        labelCol, valueCol, skipEmpty, skipNonNumeric,
        trimWhitespace, duplicateStrategy, minValue, maxValue,
      })
    } catch { return null }
  }, [rows, labelCol, valueCol, skipEmpty, skipNonNumeric, trimWhitespace, duplicateStrategy, minValue, maxValue])

  function handleSuggest() {
    const s = suggestBestConfig(columnNames, rows)
    setSuggestion(s)
    setSuggestionApplied(false)
  }

  function applySuggestion() {
    setLabelCol(suggestion.labelCol)
    setValueCol(suggestion.valueCol)
    setChartType(suggestion.chartType)
    setDuplicate(suggestion.duplicateStrategy)
    setSkipEmpty(suggestion.skipEmpty)
    setSkipNonNumeric(suggestion.skipNonNumeric)
    setTrimWhitespace(suggestion.trimWhitespace)
    setMinValue(suggestion.minValue)
    setMaxValue(suggestion.maxValue)
    setSuggestionApplied(true)
  }

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
        <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-suggest" onClick={handleSuggest}>
            <span>✨</span> Suggest Best Chart
          </button>
          <button className="btn btn-ghost" onClick={onBack}>← Upload Different File</button>
        </div>
      </div>

      {/* Suggestion Panel */}
      {suggestion && (
        <div className={`suggestion-panel ${suggestion.reasoning.confidence}`}>
          <div className="suggestion-header">
            <div className="suggestion-title">
              <span className="suggestion-badge">
                {suggestion.reasoning.confidence === 'high' ? '✨ High Confidence' :
                 suggestion.reasoning.confidence === 'medium' ? '⚡ Medium Confidence' : '⚠ Low Confidence'} Suggestion
              </span>
              <button className="suggestion-close" onClick={() => setSuggestion(null)}>✕</button>
            </div>
            {suggestionApplied && (
              <div className="suggestion-applied-note">✓ Settings applied below — click "Generate Chart" to visualize.</div>
            )}
          </div>

          <div className="suggestion-body">
            <div className="suggestion-grid">
              <div className="suggestion-item">
                <span className="sug-label">Label Column</span>
                <span className="sug-value">{suggestion.reasoning.labelCol}</span>
              </div>
              <div className="suggestion-item">
                <span className="sug-label">Value Column</span>
                <span className="sug-value">{suggestion.reasoning.valueCol}</span>
              </div>
              <div className="suggestion-item">
                <span className="sug-label">Recommended Chart</span>
                <span className="sug-value">
                  {CHART_TYPES.find(c => c.id === suggestion.chartType)?.icon}{' '}
                  {CHART_TYPES.find(c => c.id === suggestion.chartType)?.label}
                </span>
              </div>
              <div className="suggestion-item">
                <span className="sug-label">Duplicate Strategy</span>
                <span className="sug-value">{DUPLICATE_OPTIONS.find(d => d.id === suggestion.duplicateStrategy)?.label}</span>
              </div>
            </div>

            <div className="suggestion-reasons">
              <p className="reason-line">📊 {suggestion.reasoning.chartType}</p>
              <p className="reason-line">🔁 {suggestion.reasoning.duplicate}</p>
              {suggestion.reasoning.warnings.map((w, i) => (
                <p key={i} className="reason-line warning">⚠ {w}</p>
              ))}
            </div>

            {!suggestionApplied ? (
              <button className="btn btn-primary" onClick={applySuggestion}>
                Apply This Suggestion
              </button>
            ) : (
              <button className="btn btn-primary" onClick={handleGenerate} disabled={!canGenerate}>
                Generate Chart Now →
              </button>
            )}
          </div>
        </div>
      )}

      <div className="config-grid">

        {/* Left column */}
        <div className="config-left">

          {/* Raw data preview */}
          <div className="config-card">
            <h3 className="config-card-title">Data Preview <span className="badge">first 5 rows</span></h3>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>{columnNames.map((col, i) => <th key={i}>{col}</th>)}</tr>
                </thead>
                <tbody>
                  {preview.map((row, ri) => (
                    <tr key={ri}>
                      {columnNames.map((_, ci) => <td key={ci}>{row[ci] ?? ''}</td>)}
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
                <select className="select" value={labelCol} onChange={e => { setLabelCol(Number(e.target.value)); setSuggestionApplied(false) }}>
                  {columnNames.map((col, i) => <option key={i} value={i}>{col}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="field-label">Value Column (Y-axis / Numbers)</label>
                <select className="select" value={valueCol} onChange={e => { setValueCol(Number(e.target.value)); setSuggestionApplied(false) }}>
                  {columnNames.map((col, i) => <option key={i} value={i}>{col}</option>)}
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

              {aggregationWarning && (
                <div className="aggregation-warning">
                  <p>{aggregationWarning}</p>
                  <button className="agg-fix-btn" onClick={() => setDuplicate('average')}>
                    Switch to Average →
                  </button>
                </div>
              )}

              <div className="dup-options">
                {DUPLICATE_OPTIONS.map(opt => (
                  <label key={opt.id} className={`dup-option ${duplicateStrategy === opt.id ? 'active' : ''}`}>
                    <input type="radio" name="duplicate" value={opt.id} checked={duplicateStrategy === opt.id} onChange={() => setDuplicate(opt.id)} />
                    <div className="dup-option-text">
                      <span className="dup-option-label">{opt.label}</span>
                      <span className="dup-option-hint">{opt.hint}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="field-row" style={{ marginTop: '1rem' }}>
              <div className="field">
                <label className="field-label">Min Value Filter</label>
                <input type="number" className="input" placeholder="No minimum" value={minValue} onChange={e => setMinValue(e.target.value)} />
              </div>
              <div className="field">
                <label className="field-label">Max Value Filter</label>
                <input type="number" className="input" placeholder="No maximum" value={maxValue} onChange={e => setMaxValue(e.target.value)} />
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
              <p className="empty-state">No data matches current cleaning rules. Try adjusting the options.</p>
            )}
          </div>

          <button className="btn btn-primary btn-full" onClick={handleGenerate} disabled={!canGenerate}>
            Generate Chart →
          </button>
        </div>
      </div>
    </div>
  )
}
