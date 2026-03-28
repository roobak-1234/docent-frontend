const API_URL = process.env.REACT_APP_API_BASE_URL || 'https://docent-backend-b4bsayc0dpedc7bf.centralindia-01.azurewebsites.net';

export async function get<T>(path: string) {
  console.log(`[API] GET ${API_URL}${path}`);
  const response = await fetch(`${API_URL}${path}`, {
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
  console.log(`[API] POST ${API_URL}${path}`, body);
  const response = await fetch(`${API_URL}${path}`, {
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
  const response = await fetch(`${API_URL}${path}`, {
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
