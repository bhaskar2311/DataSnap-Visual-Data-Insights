import { useState, useEffect } from 'react'
import FileUpload from './components/FileUpload'
import DataConfigurator from './components/DataConfigurator'
import ChartDisplay from './components/ChartDisplay'
import ErrorMessage from './components/ErrorMessage'

function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10A5 5 0 0012 7z" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  )
}

export default function App() {
  const [step, setStep]             = useState('upload')
  const [parsedData, setParsedData] = useState(null)
  const [chartData, setChartData]   = useState(null)
  const [error, setError]           = useState(null)
  const [isLoading]                 = useState(false)
  const [darkMode, setDarkMode]     = useState(() => {
    const saved = localStorage.getItem('datasnap-theme')
    return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
    localStorage.setItem('datasnap-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  function handleUpload(parsedData) {
    setParsedData(parsedData)
    setStep('configure')
  }

  function handleVisualize(data) { setChartData(data); setStep('visualize') }
  function handleReconfigure()   { setStep('configure') }
  function handleReset() {
    setStep('upload'); setParsedData(null); setChartData(null); setError(null)
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="logo" onClick={handleReset} style={{ cursor: 'pointer' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 100 100" fill="none">
              <rect width="100" height="100" rx="20" fill="#6366f1"/>
              <rect x="15" y="55" width="18" height="30" fill="white" rx="3"/>
              <rect x="41" y="35" width="18" height="50" fill="white" rx="3"/>
              <rect x="67" y="20" width="18" height="65" fill="white" rx="3"/>
            </svg>
            <span className="logo-text">DataSnap</span>
          </div>

          <div className="step-indicator">
            {['Upload', 'Configure', 'Visualize'].map((s, i) => {
              const stepKeys  = ['upload', 'configure', 'visualize']
              const currentIdx = stepKeys.indexOf(step)
              const isActive  = currentIdx === i
              const isDone    = currentIdx > i
              return (
                <div key={s} className={`step-pill ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}>
                  <span className="step-num">{isDone ? '✓' : i + 1}</span>
                  <span className="step-name">{s}</span>
                </div>
              )
            })}
          </div>

          <button
            className="theme-toggle"
            onClick={() => setDarkMode(d => !d)}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            title={darkMode ? 'Light mode' : 'Dark mode'}
          >
            {darkMode ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </header>

      <main className="main">
        <ErrorMessage message={error} onDismiss={() => setError(null)} />

        {step === 'upload' && (
          <>
            <div className="hero">
              <h1 className="hero-title">Turn CSV Data into Beautiful Charts</h1>
              <p className="hero-subtitle">
                Upload any CSV file, clean your data, pick your columns, choose your chart type — and visualize instantly.
              </p>
            </div>
            <FileUpload
              onUpload={handleUpload}
              isLoading={isLoading}
            />
          </>
        )}

        {step === 'configure' && parsedData && (
          <DataConfigurator parsedData={parsedData} onVisualize={handleVisualize} onBack={handleReset} />
        )}

        {step === 'visualize' && chartData && (
          <ChartDisplay chartData={chartData} onReconfigure={handleReconfigure} onReset={handleReset} />
        )}
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <p>DataSnap &mdash; Open-source educational tool &middot; MIT License</p>
          <p className="footer-credit">
            Developed by <strong>Bhaskar Shivaji Kumbhar</strong>
          </p>
        </div>
      </footer>
    </div>
  )
}
