import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export const authService = {
  login: (username, password) =>
    api.post("/auth/login", { username, password }),
  getProfile: () => api.get("/auth/profile"),
  changePassword: (currentPassword, newPassword) =>
    api.post("/auth/change-password", { currentPassword, newPassword }),
  forgotPassword: (username, email) =>
    api.post("/auth/forgot-password", { username, email }),
  resetPassword: (token, newPassword) =>
    api.post("/auth/reset-password", { token, newPassword }),
};

export const eventService = {
  getAll: (params) => api.get("/events", { params }),
  getById: (id) => api.get(`/events/${id}`),
  getEventWithMap: (id) => api.get(`/events/${id}/map`),
  getStats: (id) => api.get(`/events/${id}/stats`),
};

export const tableService = {
  getByEventId: (eventId) => api.get(`/tables/event/${eventId}`),
  getWithReservations: (id) => api.get(`/tables/${id}/reservations`),
};

export const reservationService = {
  getByEventId: (eventId) => api.get(`/reservations/event/${eventId}`),
  getStats: (eventId) => api.get(`/reservations/event/${eventId}/stats`),
  create: (reservationData) => {
    if (reservationData instanceof FormData) {
      return api.post("/reservations", reservationData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    return api.post("/reservations", reservationData);
  },
};

export const categoryService = {
  getAll: () => api.get("/categories"),
};

export default api;
