import axios from 'axios'

// Base URL points at the Django backend's /api root.
// Set VITE_API_URL in a .env file to override (see .env.example).
export const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'
export const SERVER_ORIGIN = API_URL.replace(/\/api\/?$/, '')

const api = axios.create({
  baseURL: API_URL,
})

// Attach the access token to every outgoing request, if we have one.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// If a request comes back 401 (expired access token), try refreshing
// once using the refresh token, then replay the original request.
let isRefreshing = false
let queue = []

function resolveQueue(error, token = null) {
  queue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token)
  })
  queue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const isAuthEndpoint =
      originalRequest?.url?.includes('/users/login/') ||
      originalRequest?.url?.includes('/users/token/refresh/')

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint &&
      localStorage.getItem('refresh_token')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refresh = localStorage.getItem('refresh_token')
        const { data } = await axios.post(`${API_URL}/users/token/refresh/`, {
          refresh,
        })

        localStorage.setItem('access_token', data.access)
        resolveQueue(null, data.access)

        originalRequest.headers.Authorization = `Bearer ${data.access}`
        return api(originalRequest)
      } catch (refreshError) {
        resolveQueue(refreshError, null)
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api
