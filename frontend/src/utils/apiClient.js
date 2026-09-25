/**
 * Centralized API client for Silent Witness
 *
 * Ensures:
 * 1. Consistent baseUrl handling (works with proxy or direct connection)
 * 2. Safe Content-Type checking before JSON parsing (prevents "Unexpected token '<'")
 * 3. Graceful fallback on non-JSON, HTML, or offline responses
 * 4. Normalized error objects: { success: false, error: { code, message } }
 */

const BASE_URL = ''; // Uses Vite proxy in development or relative path

export class ApiError extends Error {
  constructor(message, code = 'API_ERROR', status = 0, details = null) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export async function apiRequest(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  
  const defaultHeaders = {
    'Accept': 'application/json',
  };

  if (options.body && !(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    if (!response.ok) {
      let errorMessage = `Server returned HTTP ${response.status}`;
      let errorDetails = null;

      if (isJson) {
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
          errorDetails = errorData;
        } catch {
          // Fallback if parsing fails
        }
      } else {
        // Read text if HTML error page to avoid json syntax error
        try {
          const text = await response.text();
          if (response.status === 404) {
            errorMessage = 'Requested security resource not found (404).';
          } else if (response.status >= 500) {
            errorMessage = 'Security analysis service temporarily unavailable (500).';
          }
        } catch {}
      }

      throw new ApiError(errorMessage, `HTTP_${response.status}`, response.status, errorDetails);
    }

    if (!isJson) {
      // If server returned 200 OK but content is HTML (e.g. index.html fallback)
      const text = await response.text();
      if (text.trim().startsWith('<!doctype') || text.trim().startsWith('<html')) {
        throw new ApiError(
          'Security endpoint returned HTML instead of expected JSON payload. Please ensure backend service is running on port 8000.',
          'INVALID_CONTENT_TYPE',
          response.status
        );
      }
      return text;
    }

    return await response.json();
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    // Network errors (e.g. offline, refused)
    throw new ApiError(
      err.message || 'Unable to connect to Silent Witness backend service.',
      'NETWORK_ERROR',
      0,
      err
    );
  }
}

export const apiClient = {
  get: (endpoint, options = {}) => apiRequest(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) => apiRequest(endpoint, {
    ...options,
    method: 'POST',
    body: body instanceof FormData ? body : JSON.stringify(body),
  }),
  put: (endpoint, body, options = {}) => apiRequest(endpoint, {
    ...options,
    method: 'PUT',
    body: body instanceof FormData ? body : JSON.stringify(body),
  }),
  delete: (endpoint, options = {}) => apiRequest(endpoint, { ...options, method: 'DELETE' }),
};

export default apiClient;
