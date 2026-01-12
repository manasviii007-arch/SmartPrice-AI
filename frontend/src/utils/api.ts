export function getApiBase(): string {
  const qp = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const override = qp?.get('apiBaseUrl');
  const envBase = process.env.NEXT_PUBLIC_API_BASE_URL;
  return override || envBase || 'https://smartprice-ai.onrender.com';
}

export async function postJSON<T>(url: string, body: unknown): Promise<{ ok: boolean; data?: T; error?: string }> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: text || `HTTP ${res.status}` };
    }
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      const text = await res.text();
      return { ok: false, error: `Non-JSON response: ${text.slice(0, 120)}` };
    }
    const data = await res.json();
    return { ok: true, data };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Network error' };
  }
}

export async function getJSON<T>(url: string): Promise<{ ok: boolean; data?: T; error?: string }> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: text || `HTTP ${res.status}` };
    }
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      const text = await res.text();
      return { ok: false, error: `Non-JSON response: ${text.slice(0, 120)}` };
    }
    const data = await res.json();
    return { ok: true, data };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Network error' };
  }
}
