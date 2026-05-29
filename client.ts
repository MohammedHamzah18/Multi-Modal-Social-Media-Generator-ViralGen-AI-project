import axios, { type AxiosError } from "axios";

// In dev, default uses Vite proxy (/api/v1 -> localhost:8000)
const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "/api/v1" : "http://localhost:8000/api/v1");

export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (!config.headers["Content-Type"] && config.data && !(config.data instanceof FormData)) {
    config.headers["Content-Type"] = "application/json";
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const url = error.config?.url || "";
    const isAuthRoute =
      url.includes("/auth/login") ||
      url.includes("/auth/register") ||
      url.includes("/auth/refresh");

    if (error.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return "Backend not running. Double-click START.bat in the project folder, or run start-backend.ps1 first.";
    }
    const detail = error.response.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail.map((d: { msg?: string }) => d.msg || "").join(", ");
    }
    return `Request failed (${error.response.status})`;
  }
  return "Something went wrong";
}

export default api;
