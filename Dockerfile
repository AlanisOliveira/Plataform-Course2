# ==================================
# Stage 1: Build do React/Vite
# ==================================
FROM node:20-alpine AS frontend-builder

WORKDIR /frontend

# Copiar package.json e instalar dependências
COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps

# Copiar código fonte e fazer build
COPY frontend/ ./
RUN npm run build

# ==================================
# Stage 2: Backend Flask + Frontend Build
# ==================================
FROM python:3.11-slim

# Instalar ffmpeg e curl (para healthcheck)
RUN apt-get update && \
    apt-get install -y ffmpeg curl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar requirements e instalar dependências Python
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código do backend
COPY backend/ .

# Copiar build do React do stage anterior
COPY --from=frontend-builder /frontend/dist ./frontend/dist

# Criar diretórios necessários
RUN mkdir -p uploads data

# Expor porta
EXPOSE 9823

# Variáveis de ambiente padrão
ENV FLASK_ENV=production \
    PYTHONUNBUFFERED=1 \
    DATABASE_URL=sqlite:////app/data/platform_course.sqlite

# Usar Gunicorn em produção
CMD ["gunicorn", "--bind", "0.0.0.0:9823", "--workers", "2", "--timeout", "120", "--access-logfile", "-", "--error-logfile", "-", "app:app"]
