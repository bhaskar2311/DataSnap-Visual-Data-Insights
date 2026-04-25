import { useState } from 'react'
import FileUpload from './components/FileUpload'
import DataConfigurator from './components/DataConfigurator'
import ChartDisplay from './components/ChartDisplay'
import ErrorMessage from './components/ErrorMessage'
import { uploadCSV, downloadSample } from './services/api'

// step: 'upload' | 'configure' | 'visualize'

export default function App() {
  const [step, setStep]           = useState('upload')
  const [parsedData, setParsedData] = useState(null)
  const [chartData, setChartData]   = useState(null)
  const [error, setError]           = useState(null)
  const [isLoading, setIsLoading]   = useState(false)

  async function handleUpload(file) {
    setIsLoading(true)
    setError(null)
    try {
      const data = await uploadCSV(file)
      setParsedData(data)
      setStep('configure')
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        'Something went wrong. Please check your file and try again.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDownloadSample() {
    try {
      await downloadSample()
    } catch {
      setError('Failed to download sample file. Make sure the backend is running.')
    }
  }

  function handleVisualize(data) {
    setChartData(data)
    setStep('visualize')
  }

  function handleReconfigure() {
    setStep('configure')
  }

  function handleReset() {
    setStep('upload')
    setParsedData(null)
    setChartData(null)
    setError(null)
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
              const stepKeys = ['upload', 'configure', 'visualize']
              const currentIdx = stepKeys.indexOf(step)
              const isActive = currentIdx === i
              const isDone   = currentIdx > i
              return (
                <div key={s} className={`step-pill ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}>
                  <span className="step-num">{isDone ? '✓' : i + 1}</span>
                  <span className="step-name">{s}</span>
                </div>
              )
            })}
          </div>
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
              onDownloadSample={handleDownloadSample}
              isLoading={isLoading}
            />
          </>
        )}

        {step === 'configure' && parsedData && (
          <DataConfigurator
            parsedData={parsedData}
            onVisualize={handleVisualize}
            onBack={handleReset}
          />
        )}

        {step === 'visualize' && chartData && (
          <ChartDisplay
            chartData={chartData}
            onReconfigure={handleReconfigure}
            onReset={handleReset}
          />
        )}
      </main>

      <footer className="footer">
        <p>DataSnap &mdash; Open-source educational tool &middot; MIT License</p>
      </footer>
    </div>
  )
}
