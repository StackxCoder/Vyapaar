export function LoadingSpinner() {
  return <div style={{ display:'flex', justifyContent:'center', padding:'2rem' }}>
    <div style={{ width:32, height:32, border:'3px solid #e2e8f0', borderTopColor:'#3b82f6',
      borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
  </div>
}

export function ErrorMessage({ error, onRetry }: { error: Error, onRetry?: () => void }) {
  return <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8,
    padding:'12px 16px', color:'#991b1b', fontSize:14 }}>
    <div style={{ fontWeight:500, marginBottom:4 }}>Kuch galat hua</div>
    <div style={{ marginBottom:onRetry?8:0 }}>{error.message}</div>
    {onRetry && <button onClick={onRetry} style={{ fontSize:12, color:'#1d4ed8', background:'none',
      border:'none', cursor:'pointer', padding:0 }}>Dobara try karo</button>}
  </div>
}
