import { Component, ReactNode } from 'react'
interface Props { children: ReactNode }
interface State { hasError: boolean; error?: Error }
export class GlobalErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }
  static getDerivedStateFromError(error: Error): State { return { hasError: true, error } }
  componentDidCatch(error: Error) { console.error('[App Error]', error) }
  render() {
    if (this.state.hasError) return (
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
        height:'100vh',gap:16,padding:24}}>
        <div style={{fontSize:32}}>⚠️</div>
        <div style={{fontSize:18,fontWeight:500}}>Kuch galat hua</div>
        <div style={{fontSize:14,color:'var(--color-text-secondary)',textAlign:'center',maxWidth:300}}>
          {this.state.error?.message || 'Unexpected error'}
        </div>
        <button onClick={() => window.location.reload()}>Page reload karo</button>
      </div>
    )
    return this.props.children
  }
}
