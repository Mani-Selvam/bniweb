import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.error || err.message || 'Request failed'
    const status = err.response?.status
    const url = err.config?.url || ''
    // Auto-logout on session invalidation (e.g., login from another device)
    const onAuthPage = ['/auth/check-identifier', '/auth/request-otp', '/auth/verify-otp', '/auth/login-password', '/auth/set-password'].some((p) => url.includes(p))
    if (status === 401 && !onAuthPage && localStorage.getItem('token')) {
      localStorage.removeItem('token')
      sessionStorage.setItem('logout_reason', message)
      if (!window.location.pathname.startsWith('/login')) {
        window.location.replace('/login')
      }
    }
    return Promise.reject(new Error(message))
  }
)

export default api
