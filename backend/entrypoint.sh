#!/bin/bash
# Script de entrada que inicializa o banco e inicia o servidor

set -e

echo "=========================================="
echo "Plataforma de Cursos - Inicialização"
echo "=========================================="

# Executar script de inicialização do banco
python init_db.py

echo ""
echo "Iniciando servidor..."
echo "=========================================="

# Iniciar Gunicorn
exec gunicorn --bind 0.0.0.0:9823 --workers 2 --timeout 120 --access-logfile - --error-logfile - app:app
