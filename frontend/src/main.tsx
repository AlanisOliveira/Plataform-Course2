import React from "react";
import ReactDOM from "react-dom/client";
import axios from "axios";
import "./index.css";

import Router from "./routes";

// Configurar axios para enviar cookies em todas as requisições
axios.defaults.withCredentials = true;

// Interceptor para redirecionar em caso de 401
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || "";
      if (!url.includes("/api/auth/")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <Router />
  </React.StrictMode>
);
