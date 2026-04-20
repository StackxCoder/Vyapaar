import { useState, useRef, useEffect } from 'react'
import { sendChatMessage, ChatMessage } from '../api/ai'

const QUICK_PROMPTS = [
  'Is mahine profit kitna hua?',
  'Kiski udhaar 60 din se zyada hai?',
  'Sabse zyada kaun sa product bika?',
  'Cash flow kaisa hai?',
  'Aaj kya karna chahiye?',
  'Kaunsa batch repeat karoon?',
]

export default function AIAssistant() {
  const [messages, setMessages] = useState<{ role: 'user'|'ai'; text: string }[]>([
    { role: 'ai', text: 'Namaste! Main aapke business ka AI assistant hoon. Business ke baare mein kuch bhi poochho — udhaar, sales, batches, profit sab.' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const getHistory = (): ChatMessage[] =>
    messages.slice(-8).map(m => ({ role: m.role === 'user' ? 'user' : 'model', text: m.text }))

  const send = async (text: string) => {
    if (!text.trim() || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text }])
    setLoading(true)
    try {
      const reply = await sendChatMessage(text, getHistory())
      setMessages(prev => [...prev, { role: 'ai', text: reply }])
    } catch (e: any) {
      setMessages(prev => [...prev, {
        role: 'ai',
        text: e.message?.includes('rate limit')
          ? 'Thoda wait karo aur dobara try karo.'
          : 'Server se connect nahi ho paa raha. Thodi der baad try karo.',
      }])
    } finally { setLoading(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff' }}>
      
      <div style={{ flex: 1, padding: 20, overflowY: 'auto' }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            margin: '12px 0',
            textAlign: m.role === 'user' ? 'right' : 'left',
          }}>
            <span style={{
              display: 'inline-block',
              padding: '12px 16px',
              borderRadius: 16,
              background: m.role === 'user' ? '#4F46E5' : '#F1F5F9',
              color: m.role === 'user' ? '#fff' : '#1E293B',
              fontSize: 14,
              lineHeight: 1.5,
              maxWidth: '85%'
            }}>{m.text}</span>
          </div>
        ))}
        {loading && (
          <div style={{ textAlign: 'left', margin: '12px 0' }}>
            <span style={{ padding: '12px 16px', borderRadius: 16, background: '#F1F5F9', color: '#64748B', display: 'inline-block', fontSize: 13 }}>
            Soch raha hoon...
            </span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding: '12px 20px', display: 'flex', gap: 8, overflowX: 'auto', background: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
        {QUICK_PROMPTS.map(q => (
          <button key={q} onClick={() => send(q)} style={{
            flexShrink: 0, fontSize: 12, padding: '6px 12px', borderRadius: 20,
            border: '0.5px solid var(--color-border-secondary)', background: 'transparent',
            cursor: 'pointer', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap',
          }}>{q}</button>
        ))}
      </div>

      <div style={{ padding: '16px 20px', borderTop: '1px solid #E2E8F0', display: 'flex', gap: 12 }}>
        <input 
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send(input)}
          placeholder="Business ke baare mein poochho..."
          style={{ flex: 1, fontSize: 14, padding: '12px', borderRadius: 8, border: '1px solid #CBD5E1', outline: 'none' }}
        />
        <button onClick={() => send(input)} disabled={loading || !input.trim()}
          style={{ padding: '0 20px', fontSize: 14, fontWeight: 600, background: '#4F46E5', color: '#fff', border: 'none', borderRadius: 8, cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', opacity: loading || !input.trim() ? 0.6 : 1 }}>
          Bhejo
        </button>
      </div>
    </div>
  )
}
