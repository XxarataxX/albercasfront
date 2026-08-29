import axios from 'axios';
import { API_BASE_URL } from '../config';
import { withBranchParams, withBranchPayload } from '../branchScope';


export const extractList = (payload, key) => {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload[key])) return payload[key];
  return [];
};

export const extractPagination = (payload, fallbackLength = 0) => {
  if (!payload || Array.isArray(payload)) {
    return { total: fallbackLength, page: 1, limit: fallbackLength || 1, pages: 1, hasMore: false };
  }

  return {
    total: Number(payload.total ?? fallbackLength),
    page: Number(payload.page ?? 1),
    limit: Number(payload.limit ?? payload.pageSize ?? fallbackLength ?? 1),
    pages: Number(payload.pages ?? 1),
    hasMore: Boolean(payload.hasMore ?? payload.has_more ?? false),
  };
};
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const recurringSlotService = {
  createRecurring: (data) => api.post('/slots/recurring', withBranchPayload(data)),
  getAll: (params = {}) => api.get('/slots', { params: withBranchParams(params) }),
  getById: (id) => api.get(`/slots/${id}`),
  create: (data) => api.post('/slots', withBranchPayload(data)),
  update: (id, data) => api.put(`/slots/${id}`, withBranchPayload(data)),
  delete: (id) => api.delete(`/slots/${id}`),
  getByInstructor: (instructorId, params = {}) =>
    api.get(`/instructors/${instructorId}/slots`, { params: withBranchParams(params) }),
};

export const poolService = {
  getAll: (params = {}) => api.get('/pools', { params: withBranchParams(params) }),
  getById: (id) => api.get(`/pools/${id}`),
  create: (data) => api.post('/pools', withBranchPayload(data)),
  update: (id, data) => api.put(`/pools/${id}`, withBranchPayload(data)),
  delete: (id) => api.delete(`/pools/${id}`),
};

export const instructorService = {
  getAll: (params = {}) => api.get('/instructors', { params: withBranchParams(params) }),
  getById: (id) => api.get(`/instructors/${id}`),
  create: (data) => api.post('/instructors', withBranchPayload(data)),
  update: (id, data) => api.put(`/instructors/${id}`, withBranchPayload(data)),
  delete: (id) => api.delete(`/instructors/${id}`),
};

export const studentService = {
  getAll: (params = {}) => api.get('/students', { params: withBranchParams(params) }),
  getById: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', withBranchPayload(data)),
  update: (id, data) => api.put(`/students/${id}`, withBranchPayload(data)),
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
  getAll: (params = {}) => api.get('/slots', { params: withBranchParams(params) }),
  getById: (id) => api.get(`/slots/${id}`),
  create: (data) => api.post('/slots', withBranchPayload(data)),
  update: (id, data) => api.put(`/slots/${id}`, withBranchPayload(data)),
  delete: (id) => api.delete(`/slots/${id}`),
  getByInstructor: (instructorId, params = {}) =>
    api.get(`/instructors/${instructorId}/slots`, { params: withBranchParams(params) }),
};

export default api;

