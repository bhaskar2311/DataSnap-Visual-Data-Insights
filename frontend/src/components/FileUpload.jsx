import { useState, useRef } from 'react'

const MAX_SIZE_BYTES = 50 * 1024 * 1024 // 50MB

function formatSize(bytes) {
  if (bytes < 1024)       return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function FileUpload({ onUpload, onDownloadSample, isLoading }) {
  const [dragOver, setDragOver]       = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [fileError, setFileError]     = useState(null)
  const inputRef = useRef(null)

  function handleFile(file) {
    if (!file) return
    setFileError(null)

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setFileError('Only .csv files are supported. Please select a CSV file.')
      setSelectedFile(null)
      return
    }

    if (file.size > MAX_SIZE_BYTES) {
      setFileError(`File is too large (${formatSize(file.size)}). Maximum allowed size is 50 MB.`)
      setSelectedFile(null)
      return
    }

    if (file.size === 0) {
      setFileError('The selected file is empty. Please choose a CSV with data.')
      setSelectedFile(null)
      return
    }

    setSelectedFile(file)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }

  function handleChange(e) {
    handleFile(e.target.files[0])
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (selectedFile) onUpload(selectedFile)
  }

  return (
    <div className="upload-card">
      <h2 className="section-title">Upload Your CSV</h2>

      <div
        className={`drop-zone ${dragOver ? 'drag-over' : ''} ${fileError ? 'drop-zone-error' : ''}`}
        onClick={() => inputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <div className="drop-zone-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>

        {fileError ? (
          <p className="drop-zone-text file-error-text">{fileError}</p>
        ) : selectedFile ? (
          <p className="drop-zone-text selected">
            <strong>{selectedFile.name}</strong>
            <span> &nbsp;({formatSize(selectedFile.size)})</span>
          </p>
        ) : (
          <p className="drop-zone-text">
            Drag &amp; drop a CSV file here, or <span className="link-text">click to browse</span>
          </p>
        )}

        <p className="drop-zone-hint">Supports .csv files &middot; up to 50 MB</p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          onChange={handleChange}
          style={{ display: 'none' }}
        />
      </div>

      <div className="upload-actions">
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={!selectedFile || isLoading}
        >
          {isLoading ? (
            <span className="btn-spinner">
              <span className="spinner" /> Processing...
            </span>
          ) : 'Upload & Configure'}
        </button>
        <button className="btn btn-secondary" onClick={onDownloadSample} disabled={isLoading}>
          Download Sample CSV
        </button>
      </div>
    </div>
  )
}
