export async function apiPost<T = unknown>(endpoint: string, body: object): Promise<T> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest', // CSRF signal
    },
    body: JSON.stringify(body),
    credentials: 'include', // Ensures cookies are sent (important for NextAuth)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ 
      error: `Request failed with status ${response.status}` 
    }));
    
    const errorMessage = errorData.error || errorData.message || 'An unexpected error occurred';
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Enhanced GET wrapper (optional, for consistency)
 */
export async function apiGet<T = unknown>(endpoint: string): Promise<T> {
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Fetch failed' }));
    throw new Error(errorData.error || 'Request failed');
  }

  return response.json();
}

/**
 * Secured streaming wrapper for frontend AI calls.
 * Returns a ReadableStream for partial updates.
 */
export async function apiStream(endpoint: string, body: object): Promise<ReadableStream<Uint8Array>> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: JSON.stringify(body),
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ 
      error: `Stream request failed with status ${response.status}` 
    }));
    throw new Error(errorData.error || 'An unexpected error occurred during streaming');
  }

  if (!response.body) {
    throw new Error('Response body is empty');
  }

  return response.body;
}
