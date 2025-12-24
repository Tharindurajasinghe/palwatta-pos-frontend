import axios from 'axios';


const API_URL = 'http://localhost:5000/api';

const api = {
  // Auth
  login: (credentials) => axios.post(`${API_URL}/auth/login`, credentials),
  verifyPassword: (data) => axios.post(`${API_URL}/auth/verify-password`, data),
  
  // Products
  getProducts: () => axios.get(`${API_URL}/products`),
  getProduct: (id) => axios.get(`${API_URL}/products/${id}`),
  searchProducts: (query) => axios.get(`${API_URL}/products/search?query=${query}`),
  getNextProductId: () => axios.get(`${API_URL}/products/next-id`),
  addProduct: (product) => axios.post(`${API_URL}/products`, product),
  updateProduct: (id, product) => axios.put(`${API_URL}/products/${id}`, product),
  deleteProduct: (id) => axios.delete(`${API_URL}/products/${id}`),
  
  // Bills
  createBill: (billData) => axios.post(`${API_URL}/bills`, billData),
  getTodayBills: () => axios.get(`${API_URL}/bills/today`),
  getBillsByDate: (date) => axios.get(`${API_URL}/bills/date/${date}`),
  getBill: (billId) => axios.get(`${API_URL}/bills/${billId}`),
  getPast30DaysBills: () => axios.get(`${API_URL}/bills/history/past30days`),
  deleteBill: (billId) => axios.delete(`${API_URL}/bills/${billId}`),
  
  // Day
  getCurrentDaySummary: () => axios.get(`${API_URL}/day/current`),
  endDay: () => axios.post(`${API_URL}/day/end`),
  
  // Summary
  getDailySummary: (date) => axios.get(`${API_URL}/summary/daily/${date}`),
  createMonthlySummary: () => axios.post(`${API_URL}/summary/monthly/create`),
  getMonthlySummary: (month) => axios.get(`${API_URL}/summary/monthly/${month}`),
  getAllMonthlySummaries: () => axios.get(`${API_URL}/summary/monthly`),
  getAvailableDates: () => axios.get(`${API_URL}/summary/available-dates`)
};

export default api;