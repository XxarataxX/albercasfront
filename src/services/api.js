import axios from 'axios';
import { API_BASE_URL } from '../config';

// const API_BASE_URL = 'http://192.168.80.130:3000/api';

// Crear instancia de axios con configuración base
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const recurringSlotService = {
  // Endpoint especial para crear slots recurrentes
  createRecurring: (data) => api.post('/slots/recurring', data),
  
  // También necesitamos endpoints normales para slots
  getAll: (params = {}) => api.get('/slots', { params }),
  getById: (id) => api.get(`/slots/${id}`),
  create: (data) => api.post('/slots', data),
  update: (id, data) => api.put(`/slots/${id}`, data),
  delete: (id) => api.delete(`/slots/${id}`),
  getByInstructor: (instructorId, params = {}) => 
    api.get(`/instructors/${instructorId}/slots`, { params }),
};

// Servicios para cada entidad
export const poolService = {
  getAll: () => api.get('/pools'),
  getById: (id) => api.get(`/pools/${id}`),
  create: (data) => api.post('/pools', data),
  update: (id, data) => api.put(`/pools/${id}`, data),
  delete: (id) => api.delete(`/pools/${id}`),
};

export const instructorService = {
  getAll: (params = {}) => api.get('/instructors', { params }),
  getById: (id) => api.get(`/instructors/${id}`),
  create: (data) => api.post('/instructors', data),
  update: (id, data) => api.put(`/instructors/${id}`, data),
  delete: (id) => api.delete(`/instructors/${id}`),
};

export const studentService = {
  getAll: () => api.get('/students'),
  getById: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`),
};

export const timeBlockService = {
  getAll: () => api.get('/timeblocks'),
  getById: (id) => api.get(`/timeblocks/${id}`),
  create: (data) => api.post('/timeblocks', data),
  update: (id, data) => api.put(`/timeblocks/${id}`, data),
  delete: (id) => api.delete(`/timeblocks/${id}`),
};

export const slotService = {
  getAll: (params = {}) => api.get('/slots', { params }),
  getById: (id) => api.get(`/slots/${id}`),
  create: (data) => api.post('/slots', data),
  update: (id, data) => api.put(`/slots/${id}`, data),
  delete: (id) => api.delete(`/slots/${id}`),
  getByInstructor: (instructorId, params = {}) => 
    api.get(`/instructors/${instructorId}/slots`, { params }),
};

export default api;