import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://Alishba-1342-lumina-backend.hf.space';

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

  async processYoutube(url: string, generationType: string = 'all', videoTitle?: string, channelName?: string) {
    const formData = new FormData();
    formData.append('type', 'youtube');
    formData.append('url', url);
    formData.append('generation_type', generationType);
    if (videoTitle) formData.append('video_title', videoTitle);
    if (channelName) formData.append('channel_name', channelName);
    
    const response = await fetch(`${API_BASE_URL}/process`, {
      method: 'POST',
      body: formData,
      headers: {
        ...(typeof window !== 'undefined' && localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
      }
    });
    return response.json();
  },

  processText: (text: string, generationType: string = 'all') => {
    const formData = new FormData();
    formData.append('type', 'text');
    formData.append('content', text);
    formData.append('generation_type', generationType);
    return api.post('/process', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  processFile: (file: File, generationType: string = 'all') => {
    const formData = new FormData();
    formData.append('type', 'file');
    formData.append('file', file);
    formData.append('generation_type', generationType);
    return api.post('/process', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  getLibrary: (userId: string) => api.get(`/library/${userId}`),

  // NOTE: Server is stateless; notes are stored in Firebase or localStorage
  // This is a fallback only - should not be needed
  getNote: (noteId: string) => api.get(`/notes/${noteId}`),

  // FIX: Server expects Form data, not JSON
  chat: (prompt: string, context: string, history: any[] = []) => {
    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('context', context);
    formData.append('history', JSON.stringify(history));
    return api.post('/chat', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  generateMoreQuiz: (sourceText: string, existingQuestions: any[] = []) => {
    const formData = new FormData();
    formData.append('source_text', sourceText);
    formData.append('existing_questions', JSON.stringify(existingQuestions));
    return api.post('/generate-more-quiz', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  generateMoreFlashcards: (sourceText: string, existingCards: any[] = []) => {
    const formData = new FormData();
    formData.append('source_text', sourceText);
    formData.append('existing_cards', JSON.stringify(existingCards));
    return api.post('/generate-more-flashcards', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
};
