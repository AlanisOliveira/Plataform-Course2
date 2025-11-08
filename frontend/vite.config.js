import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  plugins: [
    react({
      include: [/\.js$/, /\.jsx$/, /\.tsx$/, /\.md$/],
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "https://plataform-course2-1.onrender.com",
        changeOrigin: true,
        secure: false,
      },
      "/serve-video": {
        target: "https://plataform-course2-1.onrender.com",
        changeOrigin: true,
        secure: false,
      },
      "/serve-txt": {
        target: "https://plataform-course2-1.onrender.com",
        changeOrigin: true,
        secure: false,
      },
      "/serve-files": {
        target: "https://plataform-course2-1.onrender.com",
        changeOrigin: true,
        secure: false,
      },
      "/uploads": {
        target: "https://plataform-course2-1.onrender.com",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
