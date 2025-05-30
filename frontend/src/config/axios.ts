import axios from 'axios';

// Set the base URL for all axios requests
const apiUrl = process.env.NODE_ENV === 'production' 
  ? 'https://threadtwin-backend.vercel.app'  // Production backend URL
  : 'http://localhost:3001';                 // Local development URL

console.log('Configuring axios with base URL:', apiUrl);
axios.defaults.baseURL = apiUrl;

// Add request interceptor for error handling
axios.interceptors.request.use(
  (config) => {
    console.log('Making request to:', config.url);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
axios.interceptors.response.use(
  (response) => {
    console.log('Received response:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('API Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url
    });
    return Promise.reject(error);
  }
); 