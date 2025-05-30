import axios from 'axios';

// Set the base URL for all axios requests
axios.defaults.baseURL = 'https://threadtwin.vercel.app';

// Add request interceptor for error handling
axios.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
); 