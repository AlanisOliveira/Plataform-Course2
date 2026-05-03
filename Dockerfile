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
RUN mkdir -p uploads data backups

# Tornar scripts executáveis
RUN chmod +x init_db.py entrypoint.sh

# Expor porta
EXPOSE 9823

# Variáveis de ambiente padrão
ENV FLASK_ENV=production \
    PYTHONUNBUFFERED=1

# Usar entrypoint script que inicializa o banco e inicia o servidor
CMD ["./entrypoint.sh"]
