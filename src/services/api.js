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

// El login usa el 401 para "contraseña incorrecta": no debe expulsar.
const NO_REDIRECT_401 = ["/auth/login", "/auth/forgot-password", "/auth/reset-password"];

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || "";
    if (status === 401 && !NO_REDIRECT_401.some((path) => url.startsWith(path))) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    // Licencia de la empresa bloqueada: la app muestra el aviso en cualquier pantalla.
    if (status === 402) {
      window.dispatchEvent(new CustomEvent("license:blocked", { detail: error.response.data?.license }));
    }
    return Promise.reject(error);
  },
);

export const apiError = (error, fallback = "Ocurrió un error inesperado") =>
  error?.response?.data?.error ||
  (error?.code === "ECONNABORTED" ? "El servidor tardó demasiado en responder" : fallback);

export const authService = {
  login: (username, password, tenantEmail) =>
    api.post("/auth/login", { username, password, tenantEmail: tenantEmail || undefined }),
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

export const productService = {
  getActive: () => api.get("/products", { params: { active: 1 } }),
};

// Cuentas de consumo de un evento (por mesa o por reserva)
export const tabService = {
  getByEvent: (eventId, status) => api.get(`/events/${eventId}/tabs`, { params: { status } }),
  getById: (eventId, tabId) => api.get(`/events/${eventId}/tabs/${tabId}`),
  // Si ahora se pueden cargar consumos (evento activo, hoy, entre inicio y fin)
  getLive: (eventId) => api.get(`/events/${eventId}/tabs/live`),
  open: (eventId, tableId, reservationId = null) =>
    api.post(`/events/${eventId}/tabs`, { tableId, reservationId }),
  addItem: (eventId, tabId, productId, quantity, notes) =>
    api.post(`/events/${eventId}/tabs/${tabId}/items`, { productId, quantity, notes }),
  voidItem: (eventId, tabId, itemId, reason) =>
    api.post(`/events/${eventId}/tabs/${tabId}/items/${itemId}/void`, { reason }),
  close: (eventId, tabId, data) => api.post(`/events/${eventId}/tabs/${tabId}/close`, data),
};

// Control de acceso en la puerta: entradas generales y QR de reservas de mesa
export const ticketService = {
  getSummary: (eventId) => api.get(`/events/${eventId}/tickets/summary`),
  getOrders: (eventId, search) => api.get(`/events/${eventId}/tickets/orders`, { params: { search } }),
  checkIn: (eventId, code) => api.post(`/events/${eventId}/tickets/check-in`, { code }),
  // Ventas de entradas y reservas de mesa que coinciden con el nombre, CI, teléfono o código
  doorSearch: (eventId, search) => api.get(`/events/${eventId}/tickets/door-search`, { params: { search } }),
};

export const licenseService = {
  getState: () => api.get("/license/state"),
};

export default api;
