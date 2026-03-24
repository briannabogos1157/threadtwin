import axios from 'axios';

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://api.threadtwin.com';

const api = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  /** Analyze/compare/scrape can exceed a few seconds; Manus-backed calls need much longer. */
  timeout: Number(process.env.NEXT_PUBLIC_AXIOS_TIMEOUT_MS) || 420_000,
});

// Add request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log('[API Request]', {
      url: config.url,
      method: config.method,
      headers: config.headers,
    });
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for logging
api.interceptors.response.use(
  (response) => {
    console.log('[API Response]', {
      status: response.status,
      data: response.data,
      headers: response.headers,
    });
    return response;
  },
  (error) => {
    const ax = error as { message?: string; code?: string; response?: { status?: number; data?: unknown } };
    console.error('[API Response Error]', ax.message, ax.code, ax.response?.status, ax.response?.data);
    return Promise.reject(error);
  }
);

export default api; 