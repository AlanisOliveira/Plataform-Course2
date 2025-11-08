#!/bin/bash

# Script de configuração automática da Plataforma de Cursos
# Para Linux, Mac e ZimaOS/CasaOS

set -e

echo "================================================"
echo "  Plataforma de Cursos - Configuração Automática"
echo "================================================"
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar se o arquivo .env já existe
if [ -f ".env" ]; then
    echo -e "${YELLOW}⚠️  Arquivo .env já existe!${NC}"
    read -p "Deseja sobrescrever? (s/N): " overwrite
    if [[ ! $overwrite =~ ^[Ss]$ ]]; then
        echo "Configuração cancelada."
        exit 0
    fi
fi

# Detectar sistema operacional
OS_TYPE="unknown"
if [ -d "/DATA" ] && [ -d "/etc/casaos" ]; then
    OS_TYPE="zimaos"
    echo -e "${GREEN}✓ Detectado: ZimaOS/CasaOS${NC}"
elif [ "$(uname)" == "Darwin" ]; then
    OS_TYPE="mac"
    echo -e "${GREEN}✓ Detectado: macOS${NC}"
elif [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
    OS_TYPE="linux"
    echo -e "${GREEN}✓ Detectado: Linux${NC}"
fi

echo ""
echo "Configurando caminhos..."
echo ""

# Solicitar caminho dos cursos
if [ "$OS_TYPE" == "zimaos" ]; then
    DEFAULT_PATH="/DATA/Cursos"
    echo -e "${YELLOW}Caminho padrão sugerido para ZimaOS: $DEFAULT_PATH${NC}"
else
    DEFAULT_PATH="$HOME/Cursos"
    echo -e "${YELLOW}Caminho padrão sugerido: $DEFAULT_PATH${NC}"
fi

read -p "Digite o caminho completo onde estão seus cursos [$DEFAULT_PATH]: " COURSES_PATH
COURSES_PATH=${COURSES_PATH:-$DEFAULT_PATH}

# Verificar se o caminho existe
if [ ! -d "$COURSES_PATH" ]; then
    echo -e "${RED}✗ Atenção: O caminho '$COURSES_PATH' não existe!${NC}"
    read -p "Deseja criar este diretório? (s/N): " create_dir
    if [[ $create_dir =~ ^[Ss]$ ]]; then
        mkdir -p "$COURSES_PATH"
        echo -e "${GREEN}✓ Diretório criado: $COURSES_PATH${NC}"
    else
        echo -e "${YELLOW}⚠️  Continuando sem criar o diretório. Você precisará criar manualmente.${NC}"
    fi
fi

# Solicitar porta
read -p "Digite a porta para a aplicação [9823]: " PORT
PORT=${PORT:-9823}

# Criar arquivo .env
cat > .env << EOF
# Configuração da Plataforma de Cursos
# Gerado automaticamente em $(date)

# Porta em que a aplicação vai rodar
PORT=$PORT

# Caminho para os cursos
COURSES_PATH=$COURSES_PATH

# Caminho INTERNO no container (não altere)
COURSES_INTERNAL_PATH=/cursos

# Banco de dados
DATABASE_URL=sqlite:////app/data/platform_course.sqlite
FLASK_ENV=production
EOF

echo ""
echo -e "${GREEN}✓ Arquivo .env criado com sucesso!${NC}"
echo ""
echo "Configurações:"
echo "  - Porta: $PORT"
echo "  - Caminho dos cursos: $COURSES_PATH"
echo ""
echo -e "${YELLOW}IMPORTANTE:${NC}"
echo "  Ao cadastrar cursos na plataforma, use o caminho:"
echo -e "  ${GREEN}/cursos/[nome-da-pasta-do-curso]${NC}"
echo ""
echo "Para iniciar a aplicação, execute:"
echo -e "  ${GREEN}docker-compose up -d${NC}"
echo ""
echo "================================================"
