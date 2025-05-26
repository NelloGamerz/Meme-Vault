import axios, { AxiosError, AxiosRequestConfig } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // ✅ use cookies
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;

type FailedRequest = {
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
};

let failedQueue: FailedRequest[] = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      isRefreshing = true;

      try {
        const refreshResponse = await api.get("/token/refresh");
        const newAccessToken = (refreshResponse.data as { accessToken?: string })?.accessToken;

        processQueue(null, newAccessToken ?? null);

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null);
        localStorage.setItem("sessionExpired", "true");
        localStorage.removeItem("user");
        window.location.href = "/auth";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

