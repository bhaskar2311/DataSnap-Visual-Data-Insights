import { useState } from 'react'
import FileUpload from './components/FileUpload'
import ChartDisplay from './components/ChartDisplay'
import ErrorMessage from './components/ErrorMessage'
import { uploadCSV, downloadSample } from './services/api'

export default function App() {
  const [chartData, setChartData] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleUpload(file) {
    setIsLoading(true)
    setError(null)
    try {
      const data = await uploadCSV(file)
      setChartData(data)
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

  function handleReset() {
    setChartData(null)
    setError(null)
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 100 100" fill="none">
              <rect width="100" height="100" rx="20" fill="#6366f1"/>
              <rect x="15" y="55" width="18" height="30" fill="white" rx="3"/>
              <rect x="41" y="35" width="18" height="50" fill="white" rx="3"/>
              <rect x="67" y="20" width="18" height="65" fill="white" rx="3"/>
            </svg>
            <span className="logo-text">DataSnap</span>
          </div>
          <p className="header-tagline">Visual Data Insights</p>
        </div>
      </header>

      <main className="main">
        <ErrorMessage message={error} onDismiss={() => setError(null)} />

        {chartData ? (
          <ChartDisplay chartData={chartData} onReset={handleReset} />
        ) : (
          <>
            <div className="hero">
              <h1 className="hero-title">Turn CSV Data into Beautiful Charts</h1>
              <p className="hero-subtitle">
                Upload any CSV file with two columns and instantly generate bar and pie charts.
                No account needed — your data never leaves your session.
              </p>
            </div>
            <FileUpload
              onUpload={handleUpload}
              onDownloadSample={handleDownloadSample}
              isLoading={isLoading}
            />
          </>
        )}
      </main>

      <footer className="footer">
        <p>DataSnap &mdash; Open-source educational tool &middot; MIT License</p>
      </footer>
    </div>
  )
}
