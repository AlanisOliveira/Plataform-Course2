# Script de configuração automática da Plataforma de Cursos
# Para Windows

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Plataforma de Cursos - Configuração Automática" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se o arquivo .env já existe
if (Test-Path ".env") {
    Write-Host "⚠️  Arquivo .env já existe!" -ForegroundColor Yellow
    $overwrite = Read-Host "Deseja sobrescrever? (s/N)"
    if ($overwrite -notmatch "^[Ss]$") {
        Write-Host "Configuração cancelada." -ForegroundColor Red
        exit
    }
}

Write-Host "✓ Detectado: Windows" -ForegroundColor Green
Write-Host ""
Write-Host "Configurando caminhos..." -ForegroundColor Cyan
Write-Host ""

function New-RandomSecret {
    return [guid]::NewGuid().ToString("N") + [guid]::NewGuid().ToString("N")
}

# Solicitar caminho dos cursos
$DEFAULT_PATH = "$env:USERPROFILE\Cursos"
Write-Host "Caminho padrão sugerido: $DEFAULT_PATH" -ForegroundColor Yellow
$COURSES_PATH = Read-Host "Digite o caminho completo onde estão seus cursos [$DEFAULT_PATH]"
if ([string]::IsNullOrWhiteSpace($COURSES_PATH)) {
    $COURSES_PATH = $DEFAULT_PATH
}

# Converter para formato Docker (barras normais)
$COURSES_PATH_DOCKER = $COURSES_PATH -replace '\\', '/'
# Ajustar letra do drive (C:\ -> C:/)
$COURSES_PATH_DOCKER = $COURSES_PATH_DOCKER -replace ':', ''
if ($COURSES_PATH_DOCKER -notmatch '^/') {
    $drive = $COURSES_PATH_DOCKER.Substring(0,1)
    $path = $COURSES_PATH_DOCKER.Substring(1)
    $COURSES_PATH_DOCKER = "/$drive$path"
}

# Verificar se o caminho existe
if (-not (Test-Path $COURSES_PATH)) {
    Write-Host "✗ Atenção: O caminho '$COURSES_PATH' não existe!" -ForegroundColor Red
    $create_dir = Read-Host "Deseja criar este diretório? (s/N)"
    if ($create_dir -match "^[Ss]$") {
        New-Item -ItemType Directory -Path $COURSES_PATH -Force | Out-Null
        Write-Host "✓ Diretório criado: $COURSES_PATH" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Continuando sem criar o diretório. Você precisará criar manualmente." -ForegroundColor Yellow
    }
}

# Solicitar porta
$PORT = Read-Host "Digite a porta para a aplicação [9823]"
if ([string]::IsNullOrWhiteSpace($PORT)) {
    $PORT = "9823"
}

# Configurar PostgreSQL
$POSTGRES_HOST = Read-Host "Host/IP do PostgreSQL [192.168.100.28]"
if ([string]::IsNullOrWhiteSpace($POSTGRES_HOST)) {
    $POSTGRES_HOST = "192.168.100.28"
}

$POSTGRES_PORT = Read-Host "Porta do PostgreSQL [5432]"
if ([string]::IsNullOrWhiteSpace($POSTGRES_PORT)) {
    $POSTGRES_PORT = "5432"
}

$POSTGRES_DB = Read-Host "Nome do banco [Plataform-Course]"
if ([string]::IsNullOrWhiteSpace($POSTGRES_DB)) {
    $POSTGRES_DB = "Plataform-Course"
}

$POSTGRES_USER = Read-Host "Usuário do banco [casaos]"
if ([string]::IsNullOrWhiteSpace($POSTGRES_USER)) {
    $POSTGRES_USER = "casaos"
}

$defaultDbPassword = New-RandomSecret
$POSTGRES_PASSWORD = Read-Host "Senha do banco [$defaultDbPassword]"
if ([string]::IsNullOrWhiteSpace($POSTGRES_PASSWORD)) {
    $POSTGRES_PASSWORD = $defaultDbPassword
}

$defaultSecret = New-RandomSecret
$SECRET_KEY = Read-Host "SECRET_KEY da aplicação [$defaultSecret]"
if ([string]::IsNullOrWhiteSpace($SECRET_KEY)) {
    $SECRET_KEY = $defaultSecret
}

$ADMIN_DEFAULT_PASSWORD = Read-Host "Senha inicial do admin da aplicação [admin123!]"
if ([string]::IsNullOrWhiteSpace($ADMIN_DEFAULT_PASSWORD)) {
    $ADMIN_DEFAULT_PASSWORD = "admin123!"
}

$APP_IMAGE = Read-Host "Imagem Docker da aplicação [ghcr.io/alanisoliveira/plataform-course2:latest]"
if ([string]::IsNullOrWhiteSpace($APP_IMAGE)) {
    $APP_IMAGE = "ghcr.io/alanisoliveira/plataform-course2:latest"
}

$DATABASE_URL = "postgresql+psycopg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}"

# Criar arquivo .env
$envContent = @"
# Configuração da Plataforma de Cursos
# Gerado automaticamente em $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

# Porta em que a aplicação vai rodar
PORT=$PORT
APP_IMAGE=$APP_IMAGE

# Caminho para os cursos
COURSES_PATH=$COURSES_PATH_DOCKER

# Caminho INTERNO no container (não altere)
COURSES_INTERNAL_PATH=/cursos

# Segurança
SECRET_KEY=$SECRET_KEY
ADMIN_DEFAULT_NAME=Admin
ADMIN_DEFAULT_PASSWORD=$ADMIN_DEFAULT_PASSWORD
SESSION_COOKIE_SECURE=false

# PostgreSQL
POSTGRES_HOST=$POSTGRES_HOST
POSTGRES_PORT=$POSTGRES_PORT
POSTGRES_DB=$POSTGRES_DB
POSTGRES_USER=$POSTGRES_USER
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
DATABASE_URL=$DATABASE_URL

# Ambiente
FLASK_ENV=production
"@

Set-Content -Path ".env" -Value $envContent

Write-Host ""
Write-Host "✓ Arquivo .env criado com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "Configurações:" -ForegroundColor Cyan
Write-Host "  - Porta: $PORT"
Write-Host "  - Caminho dos cursos (Windows): $COURSES_PATH"
Write-Host "  - Caminho dos cursos (Docker): $COURSES_PATH_DOCKER"
Write-Host "  - Imagem Docker: $APP_IMAGE"
Write-Host "  - Host PostgreSQL: ${POSTGRES_HOST}:$POSTGRES_PORT"
Write-Host "  - Banco PostgreSQL: $POSTGRES_DB"
Write-Host "  - Usuário PostgreSQL: $POSTGRES_USER"
Write-Host ""
Write-Host "IMPORTANTE:" -ForegroundColor Yellow
Write-Host "  Ao cadastrar cursos na plataforma, use o caminho:"
Write-Host "  /cursos/[nome-da-pasta-do-curso]" -ForegroundColor Green
Write-Host ""
Write-Host "Para iniciar a aplicação, execute:" -ForegroundColor Cyan
Write-Host "  docker-compose up -d" -ForegroundColor Green
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
