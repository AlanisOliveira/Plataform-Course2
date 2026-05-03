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

generate_secret() {
    if command -v openssl >/dev/null 2>&1; then
        openssl rand -hex 32
    else
        tr -dc 'A-Za-z0-9' </dev/urandom | head -c 64
    fi
}

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

# PostgreSQL
echo ""
echo "Configurando PostgreSQL..."
read -p "Nome do banco [platform_course]: " POSTGRES_DB
POSTGRES_DB=${POSTGRES_DB:-platform_course}

read -p "Usuário do banco [platform_course]: " POSTGRES_USER
POSTGRES_USER=${POSTGRES_USER:-platform_course}

DEFAULT_DB_PASSWORD=$(generate_secret)
read -p "Senha do banco [$DEFAULT_DB_PASSWORD]: " POSTGRES_PASSWORD
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-$DEFAULT_DB_PASSWORD}

DEFAULT_SECRET=$(generate_secret)
read -p "SECRET_KEY da aplicação [$DEFAULT_SECRET]: " SECRET_KEY
SECRET_KEY=${SECRET_KEY:-$DEFAULT_SECRET}

read -p "Senha inicial do admin da aplicação [admin123!]: " ADMIN_DEFAULT_PASSWORD
ADMIN_DEFAULT_PASSWORD=${ADMIN_DEFAULT_PASSWORD:-admin123!}

read -p "Email do pgAdmin [admin@plataforma.local]: " PGADMIN_DEFAULT_EMAIL
PGADMIN_DEFAULT_EMAIL=${PGADMIN_DEFAULT_EMAIL:-admin@plataforma.local}

DEFAULT_PGADMIN_PASSWORD=$(generate_secret)
read -p "Senha do pgAdmin [$DEFAULT_PGADMIN_PASSWORD]: " PGADMIN_DEFAULT_PASSWORD
PGADMIN_DEFAULT_PASSWORD=${PGADMIN_DEFAULT_PASSWORD:-$DEFAULT_PGADMIN_PASSWORD}

read -p "Porta do pgAdmin [8080]: " PGADMIN_PORT
PGADMIN_PORT=${PGADMIN_PORT:-8080}

DATABASE_URL="postgresql+psycopg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}"

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

# Segurança
SECRET_KEY=$SECRET_KEY
ADMIN_DEFAULT_NAME=Admin
ADMIN_DEFAULT_PASSWORD=$ADMIN_DEFAULT_PASSWORD
SESSION_COOKIE_SECURE=false

# PostgreSQL
POSTGRES_DB=$POSTGRES_DB
POSTGRES_USER=$POSTGRES_USER
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
DATABASE_URL=$DATABASE_URL

# pgAdmin
PGADMIN_PORT=$PGADMIN_PORT
PGADMIN_DEFAULT_EMAIL=$PGADMIN_DEFAULT_EMAIL
PGADMIN_DEFAULT_PASSWORD=$PGADMIN_DEFAULT_PASSWORD

# Ambiente
FLASK_ENV=production
EOF

echo ""
echo -e "${GREEN}✓ Arquivo .env criado com sucesso!${NC}"
echo ""
echo "Configurações:"
echo "  - Porta: $PORT"
echo "  - Caminho dos cursos: $COURSES_PATH"
echo "  - Banco PostgreSQL: $POSTGRES_DB"
echo "  - Usuário PostgreSQL: $POSTGRES_USER"
echo "  - pgAdmin: http://localhost:$PGADMIN_PORT"
echo ""
echo -e "${YELLOW}IMPORTANTE:${NC}"
echo "  Ao cadastrar cursos na plataforma, use o caminho:"
echo -e "  ${GREEN}/cursos/[nome-da-pasta-do-curso]${NC}"
echo ""
echo "Para iniciar a aplicação, execute:"
echo -e "  ${GREEN}docker-compose up -d${NC}"
echo ""
echo "================================================"
