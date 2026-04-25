import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          padding: '2rem', maxWidth: '700px', margin: '3rem auto',
          background: '#fee2e2', border: '2px solid #ef4444',
          borderRadius: '12px', fontFamily: 'monospace'
        }}>
          <h2 style={{ color: '#b91c1c', marginBottom: '1rem' }}>⚠ Something went wrong</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '.82rem', color: '#7f1d1d' }}>
            {this.state.error?.message}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
          <button
            onClick={() => this.setState({ error: null })}
            style={{ marginTop: '1rem', padding: '.5rem 1rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            Try Again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
