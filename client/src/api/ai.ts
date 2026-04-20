import { api } from './client'

export interface ChatMessage {
  role: 'user' | 'model'
  text: string
}

export async function sendChatMessage(
  message: string,
  history: ChatMessage[] = []
): Promise<string> {
  const data = await api.post<{ reply: string }>('/ai/chat', { message, history })
  return data.reply
}

export async function getAlerts(): Promise<
  { type: string; message: string; severity: string }[]
> {
  return api.get('/ai/alerts')
}
