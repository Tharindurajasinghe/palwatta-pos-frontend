import axios from 'axios';


const API_URL = import.meta.env.VITE_BACKEND_URL;


// Create axios instance with interceptor
const axiosInstance = axios.create({
  baseURL: API_URL
});

// Add token to every request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401/403 errors (token expired)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('jagathStoreLoggedIn');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);


const api = {
  // Auth
  login: (credentials) => axiosInstance.post(`${API_URL}/auth/login`, credentials),
  verifyPassword: (data) => axiosInstance.post(`${API_URL}/auth/verify-password`, data),
  
  // Products
  getProducts: () => axiosInstance.get(`${API_URL}/products`),
  getProduct: (id) => axiosInstance.get(`${API_URL}/products/${id}`),
  searchProducts: (query) => axiosInstance.get(`${API_URL}/products/search?query=${query}`),
  getNextProductId: () => axiosInstance.get(`${API_URL}/products/next-id`),
  addProduct: (product) => axiosInstance.post(`${API_URL}/products`, product),
  updateProduct: (id, product) => axiosInstance.put(`${API_URL}/products/${id}`, product),
  deleteProduct: (id) => axiosInstance.delete(`${API_URL}/products/${id}`),
  
  // Bills
  createBill: (billData) => axiosInstance.post(`${API_URL}/bills`, billData),
  getTodayBills: () => axiosInstance.get(`${API_URL}/bills/today`),
  getBillsByDate: (date) => axiosInstance.get(`${API_URL}/bills/date/${date}`),
  getBill: (billId) => axiosInstance.get(`${API_URL}/bills/${billId}`),
  getPast30DaysBills: () => axiosInstance.get(`${API_URL}/bills/history/past30days`),
  deleteBill: (billId) => axiosInstance.delete(`${API_URL}/bills/${billId}`),
  
  // Day
  getCurrentDaySummary: () => axiosInstance.get(`${API_URL}/day/current`),
  endDay: () => axiosInstance.post(`${API_URL}/day/end`),
  
  // Summary
  getDailySummary: (date) => axiosInstance.get(`${API_URL}/summary/daily/${date}`),
  createMonthlySummary: () => axiosInstance.post(`${API_URL}/summary/monthly/create`),
  getMonthlySummary: (month) => axiosInstance.get(`${API_URL}/summary/monthly/${month}`),
  getAllMonthlySummaries: () => axiosInstance.get(`${API_URL}/summary/monthly`),
  getAvailableDates: () => axiosInstance.get(`${API_URL}/summary/available-dates`)
};

export default api;