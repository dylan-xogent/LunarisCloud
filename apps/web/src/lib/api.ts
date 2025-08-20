import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token if available
api.interceptors.request.use((config) => {
  // Token is handled via httpOnly cookies, so no need to manually add it
  return config
})

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login if unauthorized
      window.location.href = '/auth/login'
    }
    return Promise.reject(error)
  }
)

// API endpoints
export const endpoints = {
  // Auth
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    verifyEmail: '/auth/verify-email',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
  },
  
  // User
  user: {
    profile: '/users/profile',
    quota: '/users/quota',
    updateProfile: '/users/profile',
  },
  
  // Files
  files: {
    list: '/files',
    upload: {
      initiate: '/files/upload/initiate',
      complete: '/files/upload/complete',
    },
    get: (id: string) => `/files/${id}`,
    update: (id: string) => `/files/${id}`,
    delete: (id: string) => `/files/${id}`,
    download: (id: string) => `/files/${id}/download`,
    trash: '/files/trash',
    emptyTrash: '/files/trash/empty',
    restore: (id: string) => `/files/trash/${id}/restore`,
    reconcile: '/files/reconcile',
  },
  
  // Folders
  folders: {
    create: '/folders',
    get: (id: string) => `/folders/${id}`,
    update: (id: string) => `/folders/${id}`,
    delete: (id: string) => `/folders/${id}`,
    children: (id: string) => `/folders/${id}/children`,
    breadcrumbs: (id: string) => `/folders/${id}/breadcrumbs`,
  },
  
  // Shares
  shares: {
    create: '/shares',
    list: '/shares',
    delete: (id: string) => `/shares/${id}`,
    public: (id: string) => `/shares/s/${id}`,
    validatePassword: (id: string) => `/shares/s/${id}/validate`,
    download: (id: string) => `/shares/s/${id}/download`,
  },
  
  // Health
  health: {
    status: '/health',
    detailed: '/health/detailed',
    metrics: '/health/metrics',
  },
} as const
