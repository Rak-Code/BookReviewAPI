import axios from "axios"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token")
      window.location.href = "/login"
    }
    return Promise.reject(error)
  },
)

// Auth endpoints
export const auth = {
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
  signup: (data: { name: string; email: string; password: string }) =>
    api.post("/auth/signup", data),
  logout: () => api.post("/auth/logout"),
}

// Books endpoints
export const books = {
  getAll: (params?: {
    page?: number
    limit?: number
    search?: string
    genre?: string
  }) => api.get("/books", { params }),
  getById: (id: string) => api.get(`/books/${id}`),
  create: (data: FormData) =>
    api.post("/books", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  update: (id: string, data: FormData) =>
    api.put(`/books/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  delete: (id: string) => api.delete(`/books/${id}`),
}

// Reviews endpoints
export const reviews = {
  getBookReviews: (
    bookId: string,
    params?: { page?: number; limit?: number },
  ) => api.get(`/books/${bookId}/reviews`, { params }),
  getUserReviews: (userId: string) => api.get(`/reviews/user/${userId}`),
  create: (bookId: string, data: { rating: number; reviewText: string }) =>
    api.post(`/books/${bookId}/reviews`, data),
  update: (id: string, data: { rating: number; reviewText: string }) =>
    api.put(`/reviews/${id}`, data),
  delete: (id: string) => api.delete(`/reviews/${id}`),
  like: (id: string) => api.post(`/reviews/${id}/like`),
  getStats: (bookId: string) => api.get(`/books/${bookId}/reviews/stats`),
}

export default api
