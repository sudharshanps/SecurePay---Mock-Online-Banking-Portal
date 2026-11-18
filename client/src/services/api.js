let cachedCsrfToken = null;

export const setCachedCsrfToken = (token) => {
  cachedCsrfToken = token;
};

export const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

export const getCsrfToken = () => {
  return cachedCsrfToken || getCookie('XSRF-TOKEN');
};

const request = async (endpoint, options = {}) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const url = cleanEndpoint.startsWith('api/') ? `/${cleanEndpoint}` : `/api/${cleanEndpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  // Attach CSRF token on mutating requests
  const method = (options.method || 'GET').toUpperCase();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      headers['x-csrf-token'] = csrfToken;
    }
  }

  const config = {
    ...options,
    headers,
    credentials: 'include', // sends HTTP-only auth cookies
  };

  try {
    const response = await fetch(url, config);
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const errorMessage = data?.message || `HTTP ${response.status}: ${response.statusText}`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    // If server sent back a new CSRF token in body, cache it
    if (data?.csrfToken) {
      setCachedCsrfToken(data.csrfToken);
    }

    return data;
  } catch (error) {
    console.error(`[API Error] ${method} ${url}:`, error.message);
    throw error;
  }
};

export const api = {
  get: (url, options = {}) => request(url, { ...options, method: 'GET' }),
  post: (url, body, options = {}) => request(url, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: (url, body, options = {}) => request(url, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  patch: (url, body, options = {}) => request(url, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  delete: (url, options = {}) => request(url, { ...options, method: 'DELETE' }),
};

export default api;
