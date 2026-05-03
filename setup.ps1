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
$POSTGRES_DB = Read-Host "Nome do banco [platform_course]"
if ([string]::IsNullOrWhiteSpace($POSTGRES_DB)) {
    $POSTGRES_DB = "platform_course"
}

$POSTGRES_USER = Read-Host "Usuário do banco [platform_course]"
if ([string]::IsNullOrWhiteSpace($POSTGRES_USER)) {
    $POSTGRES_USER = "platform_course"
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

$PGADMIN_DEFAULT_EMAIL = Read-Host "Email do pgAdmin [admin@plataforma.local]"
if ([string]::IsNullOrWhiteSpace($PGADMIN_DEFAULT_EMAIL)) {
    $PGADMIN_DEFAULT_EMAIL = "admin@plataforma.local"
}

$defaultPgAdminPassword = New-RandomSecret
$PGADMIN_DEFAULT_PASSWORD = Read-Host "Senha do pgAdmin [$defaultPgAdminPassword]"
if ([string]::IsNullOrWhiteSpace($PGADMIN_DEFAULT_PASSWORD)) {
    $PGADMIN_DEFAULT_PASSWORD = $defaultPgAdminPassword
}

$PGADMIN_PORT = Read-Host "Porta do pgAdmin [8080]"
if ([string]::IsNullOrWhiteSpace($PGADMIN_PORT)) {
    $PGADMIN_PORT = "8080"
}

$DATABASE_URL = "postgresql+psycopg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}"

# Criar arquivo .env
$envContent = @"
# Configuração da Plataforma de Cursos
# Gerado automaticamente em $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

# Porta em que a aplicação vai rodar
PORT=$PORT

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
"@

Set-Content -Path ".env" -Value $envContent

Write-Host ""
Write-Host "✓ Arquivo .env criado com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "Configurações:" -ForegroundColor Cyan
Write-Host "  - Porta: $PORT"
Write-Host "  - Caminho dos cursos (Windows): $COURSES_PATH"
Write-Host "  - Caminho dos cursos (Docker): $COURSES_PATH_DOCKER"
Write-Host "  - Banco PostgreSQL: $POSTGRES_DB"
Write-Host "  - Usuário PostgreSQL: $POSTGRES_USER"
Write-Host "  - pgAdmin: http://localhost:$PGADMIN_PORT"
Write-Host ""
Write-Host "IMPORTANTE:" -ForegroundColor Yellow
Write-Host "  Ao cadastrar cursos na plataforma, use o caminho:"
Write-Host "  /cursos/[nome-da-pasta-do-curso]" -ForegroundColor Green
Write-Host ""
Write-Host "Para iniciar a aplicação, execute:" -ForegroundColor Cyan
Write-Host "  docker-compose up -d" -ForegroundColor Green
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
