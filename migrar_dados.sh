#!/bin/bash
# Script para migrar dados antigos para os novos volumes fixos

set -e

echo "=========================================="
echo "Migração de Dados para Volumes Fixos"
echo "=========================================="

# Verificar se há dados antigos para migrar
if [ -f "./data/platform_course.sqlite" ]; then
    echo "✓ Banco de dados antigo encontrado em ./data/"

    # Copiar para o volume Docker
    echo "Copiando banco de dados para volume fixo..."
    docker run --rm \
      -v plataforma-cursos-data:/dest \
      -v "$(pwd)/data":/source:ro \
      alpine cp /source/platform_course.sqlite /dest/platform_course.sqlite

    echo "✓ Banco de dados migrado!"
else
    echo "ℹ Nenhum banco antigo encontrado em ./data/"
fi

# Migrar uploads se existirem
if [ -d "./uploads" ] && [ "$(ls -A ./uploads)" ]; then
    echo "✓ Uploads encontrados em ./uploads/"

    echo "Copiando uploads para volume fixo..."
    docker run --rm \
      -v plataforma-cursos-uploads:/dest \
      -v "$(pwd)/uploads":/source:ro \
      alpine sh -c "cp -r /source/* /dest/"

    echo "✓ Uploads migrados!"
else
    echo "ℹ Nenhum upload encontrado em ./uploads/"
fi

echo "=========================================="
echo "✓ Migração concluída!"
echo "=========================================="
echo ""
echo "Agora você pode fazer deploy normalmente:"
echo "  docker-compose up -d --build"
