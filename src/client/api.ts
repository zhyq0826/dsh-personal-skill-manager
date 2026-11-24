const ENDPOINT = '/api/skill-hub';

export function messageOf(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export async function request(path: string, options: { method?: 'GET' | 'POST'; body?: unknown } = {}) {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) {
    headers['content-type'] = 'application/json';
    headers['x-skill-hub'] = '1';
  }
  const response = await fetch(`${ENDPOINT}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    credentials: 'same-origin',
    cache: 'no-store',
  });
  let body;
  try {
    body = await response.json();
  } catch {
    body = undefined;
  }
  if (!response.ok) {
    const error = new Error(
      body !== null && typeof body === 'object' && typeof body.error === 'string'
        ? body.error
        : `HTTP ${response.status}`,
    );
    throw Object.assign(error, { status: response.status });
  }
  return body;
}
