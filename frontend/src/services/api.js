import axios from "axios";

const isLocalhost = window.location.hostname === "localhost";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || (isLocalhost ? "http://localhost:5000/api" : "/api"),
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
