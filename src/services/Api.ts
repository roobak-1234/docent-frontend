const DEFAULT_API_BASE_URL = 'https://docent-backend-b4bsayc0dpedc7bf.centralindia-01.azurewebsites.net/api';

function normalizeApiBaseUrl(rawUrl: string): string {
  return rawUrl.replace(/\/+$/, '').replace(/\/api$/i, '');
}

function normalizeApiPath(path: string): string {
  const trimmed = path.replace(/^\/+/, '');
  const withPrefix = trimmed.startsWith('api/') ? trimmed : `api/${trimmed}`;
  return `/${withPrefix}`;
}

function buildApiUrl(path: string): string {
  const baseUrl = normalizeApiBaseUrl(process.env.REACT_APP_API_BASE_URL || DEFAULT_API_BASE_URL);
  const normalizedPath = normalizeApiPath(path);
  return `${baseUrl}${normalizedPath}`.replace(/\/api\/api(?=\/|$)/i, '/api');
}

export async function get<T>(path: string) {
  const url = buildApiUrl(path);
  console.log(`[API] GET ${url}`);
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    console.error(`[API] GET failed with status ${response.status}`);
    throw new Error(`Request failed: ${response.status}`);
  }
  const data = await response.json();
  console.log(`[API] GET success:`, data);
  return data as T;
}

export async function post<T>(path: string, body: any) {
  const url = buildApiUrl(path);
  console.log(`[API] POST ${url}`, body);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const text = await response.text();
    console.error(`[API] POST failed: ${response.status} ${text}`);
    throw new Error(`Request failed: ${response.status} ${text}`);
  }
  const data = await response.json();
  console.log(`[API] POST success:`, data);
  return data as T;
}

export async function put<T>(path: string, body: any) {
  const url = buildApiUrl(path);
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Request failed: ${response.status} ${text}`);
  }
  return response.json() as Promise<T>;
}
