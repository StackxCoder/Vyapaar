import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorStr: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorStr: error.toString() };
  }

  componentDidCatch(error, errorInfo) {
    console.error("App Render Crash Caught by Boundary: ", error, errorInfo);
  }

  handleHardReset = () => {
    localStorage.removeItem('vyapaar_data');
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ color: '#ef4444', fontSize: '24px', marginBottom: '16px' }}>Application Logic Error</h1>
          <p style={{ color: '#64748b', marginBottom: '24px' }}>
            We caught a fatal crash rendering the User Interface. This is almost always caused by an older corrupted database layout in your browser's local memory colliding with new features.
          </p>
          <div style={{ background: '#fef2f2', padding: '16px', borderRadius: '8px', color: '#b91c1c', fontSize: '12px', textAlign: 'left', marginBottom: '32px', fontFamily: 'monospace' }}>
            {this.state.errorStr}
          </div>
          <button 
            onClick={this.handleHardReset}
            style={{ padding: '12px 24px', background: '#4f46e5', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Factory Reset Database & Reload
          </button>
          <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '16px' }}>Note: This will delete the corrupt offline data.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
