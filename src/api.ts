import { API_BASE } from './constants';

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('empathy-circle.session');
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) throw new Error(`API ${response.status}`);
  return response.json() as Promise<T>;
}
