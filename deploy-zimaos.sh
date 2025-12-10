#!/bin/bash
# Script de deploy para ZimaOS
# Este script recria o container com volumes persistentes

set -e

echo "=========================================="
echo "Deploy da Plataforma de Cursos no ZimaOS"
echo "=========================================="

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configurações
CONTAINER_NAME="plataforma-cursos"
IMAGE_NAME="ghcr.io/alanisoliveira/plataform-course2:latest"
PORT=9823
COURSES_PATH="/media/Novo volume-2/Cursos"

echo ""
echo "${YELLOW}1. Parando e removendo container antigo...${NC}"
sudo docker stop reverent_pete-main_app-1 2>/dev/null || echo "Container não estava rodando"
sudo docker rm reverent_pete-main_app-1 2>/dev/null || echo "Container não existia"

echo ""
echo "${YELLOW}2. Criando volumes Docker persistentes...${NC}"
sudo docker volume create plataforma-cursos-data
sudo docker volume create plataforma-cursos-uploads
sudo docker volume create plataforma-cursos-backups
echo "${GREEN}✓ Volumes criados${NC}"

echo ""
echo "${YELLOW}3. Baixando imagem mais recente...${NC}"
sudo docker pull $IMAGE_NAME

echo ""
echo "${YELLOW}4. Criando container com volumes persistentes...${NC}"
sudo docker run -d \
  --name $CONTAINER_NAME \
  --restart unless-stopped \
  -p $PORT:9823 \
  -v plataforma-cursos-data:/app/data \
  -v plataforma-cursos-uploads:/app/uploads \
  -v plataforma-cursos-backups:/app/backups \
  -v "$COURSES_PATH:/Cursos:ro" \
  -e DATABASE_URL=sqlite:////app/data/platform_course.sqlite \
  -e FLASK_ENV=production \
  -e PYTHONUNBUFFERED=1 \
  $IMAGE_NAME

echo ""
echo "${GREEN}✓ Container criado com sucesso!${NC}"

echo ""
echo "${YELLOW}5. Aguardando inicialização...${NC}"
sleep 5

echo ""
echo "${YELLOW}6. Verificando status...${NC}"
sudo docker ps | grep $CONTAINER_NAME

echo ""
echo "${YELLOW}7. Verificando volumes montados...${NC}"
sudo docker inspect $CONTAINER_NAME | grep -A20 "Mounts"

echo ""
echo "${GREEN}=========================================="
echo "✓ Deploy concluído com sucesso!"
echo "=========================================="${NC}
echo ""
echo "Acesse: http://192.168.3.23:$PORT"
echo ""
echo "Ver logs: sudo docker logs -f $CONTAINER_NAME"
echo "Parar: sudo docker stop $CONTAINER_NAME"
echo "Iniciar: sudo docker start $CONTAINER_NAME"
echo ""
echo "${YELLOW}Volumes persistentes criados:${NC}"
echo "  - plataforma-cursos-data (banco de dados)"
echo "  - plataforma-cursos-uploads (uploads)"
echo "  - plataforma-cursos-backups (backups)"
echo ""
echo "${GREEN}Os dados NÃO serão perdidos ao recriar o container!${NC}"
