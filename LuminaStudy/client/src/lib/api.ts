import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;

export const authApi = {
  signup: (data: any) => api.post('/auth/signup', data),
  login: (data: any) => api.post('/auth/login', data),
};

export const studyApi = {
  process: (formData: FormData) => api.post('/process', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  processYoutube: (url: string) => {
    const formData = new FormData();
    formData.append('type', 'youtube');
    formData.append('url', url);
    return api.post('/process', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  processText: (text: string) => {
    const formData = new FormData();
    formData.append('type', 'text');
    formData.append('content', text);
    return api.post('/process', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  processFile: (file: File) => {
    const formData = new FormData();
    formData.append('type', 'file');
    formData.append('file', file);
    return api.post('/process', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  getLibrary: (userId: string) => api.get(`/library/${userId}`),

  // NOTE: Server is stateless; notes are stored in Firebase or localStorage
  // This is a fallback only - should not be needed
  getNote: (noteId: string) => api.get(`/notes/${noteId}`),

  // FIX: Server expects Form data, not JSON
  chat: (prompt: string, context: string) => {
    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('context', context);
    return api.post('/chat', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
};
