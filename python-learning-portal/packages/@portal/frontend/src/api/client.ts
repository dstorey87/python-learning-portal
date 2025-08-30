import axios from 'axios'
import { APIResponse } from '@portal/types'

// Create axios instance with base configuration
const getApiBaseUrl = () => {
  // In production/Docker, use relative URLs since frontend and backend are served from same origin
  if (typeof window !== 'undefined') {
    return '/api'
  }
  
  // Fallback for development
  return 'http://localhost:3050/api'
}

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Unauthorized - clear auth token
      localStorage.removeItem('auth_token')
      localStorage.removeItem('username')
      window.location.href = '/login'
    }
    
    // Return formatted error
    const errorMessage = error.response?.data?.error?.message || 
                        error.message || 
                        'An unexpected error occurred'
    
    return Promise.reject({
      message: errorMessage,
      status: error.response?.status,
      code: error.response?.data?.error?.code
    })
  }
)

// Type helper for API responses
export const handleApiResponse = <T>(response: APIResponse<T>): T => {
  if (!response.success) {
    throw new Error(response.error || 'API request failed')
  }
  return response.data as T
}