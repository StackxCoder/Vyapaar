const BASE_URL = import.meta.env.VITE_API_URL || '/api'

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      signal: controller.signal,
      ...options,
    })
    clearTimeout(timeout)
    if (!res.ok) {
      let errMessage = `HTTP ${res.status}`;
      try {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
           const errData = await res.json();
           errMessage = errData.error || errMessage;
        } else {
           errMessage = 'Server api is offline or returned HTML.';
        }
      } catch(e) {}
      throw new Error(errMessage)
    }
    const data = await res.json()
    return data.data
  } catch (e: any) {
    clearTimeout(timeout)
    if (e.name === 'AbortError') throw new Error('Request timed out — server se response nahi aaya')
    throw e
  }
}
export const api = {
  get: <T>(p: string) => request<T>(p),
  post: <T>(p: string, b: unknown) => request<T>(p, {method:'POST',body:JSON.stringify(b)}),
  put: <T>(p: string, b: unknown) => request<T>(p, {method:'PUT',body:JSON.stringify(b)}),
  delete: <T>(p: string) => request<T>(p, {method:'DELETE'})
}
