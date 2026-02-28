import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000',
  headers: {
    'Content-Type': 'application/json'
  }
})

const AUTH_EXEMPT_PATHS = ['/api/users/login/', '/api/users/register/']

api.interceptors.request.use(cfg=>{
  const requestPath = cfg?.url || ''
  if (AUTH_EXEMPT_PATHS.some((path) => requestPath.includes(path))) {
    return cfg
  }
  const token = localStorage.getItem('token')
  if(token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('lexora_current_user')
    }
    return Promise.reject(error)
  }
)

export default api

export const setBaseURL = (url) => {
  api.defaults.baseURL = url
}

export const hasBaseURL = () => {
  return Boolean(api.defaults.baseURL && api.defaults.baseURL.length)
}
