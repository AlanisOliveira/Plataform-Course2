# Plataforma de Cursos

Sistema completo para gerenciamento e visualização de cursos em vídeo com suporte a múltiplos formatos.

## 🎯 Funcionalidades

- ✅ Player de vídeo com controles completos
- ✅ Suporte a múltiplos formatos: MP4, AVI, MOV, WMV, FLV, MKV, WebM, TS, PDF, TXT, HTML
- ✅ Sistema de progresso por aula e por curso
- ✅ Organização por módulos
- ✅ Notas por curso e por aula
- ✅ Retomada automática do último ponto assistido
- ✅ Interface responsiva (desktop e mobile)
- ✅ Tema claro e escuro

## 🚀 Instalação Rápida

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd plataforma-cursos-completa
```

### 2. Configure o ambiente

#### No Windows:
```powershell
.\setup.ps1
```

#### No Linux/Mac/ZimaOS:
```bash
chmod +x setup.sh
./setup.sh
```

O script irá:
- Detectar automaticamente seu sistema operacional
- Solicitar o caminho onde seus cursos estão armazenados
- Criar o arquivo `.env` com as configurações corretas

### 3. Inicie a aplicação

```bash
docker-compose up -d
```

### 4. Acesse a plataforma

Abra seu navegador em: `http://localhost:9823`

## 📁 Estrutura de Pastas dos Cursos

Organize seus cursos assim:

```
Cursos/
├── Curso de Python/
│   ├── 01 - Introdução/
│   │   ├── 1 - Bem-vindo.mp4
│   │   └── 2 - Instalação.mp4
│   ├── 02 - Variáveis/
│   │   └── 1 - Tipos de dados.mp4
│   └── capa.jpg
└── Curso de JavaScript/
    ├── Módulo 1/
    └── Módulo 2/
```

## 📝 Como Cadastrar um Curso

1. Acesse "Gestão de Receitas"
2. Clique em "Adicionar"
3. Preencha:
   - **Nome do curso**: Nome que aparecerá na plataforma
   - **PATH do curso**: Use o formato `/cursos/Nome-do-Curso`
   - **Capa** (opcional): URL da imagem ou faça upload
4. Clique em "Confirmar"

### Exemplo de PATH:

Se seus cursos estão em:
- Windows: `C:\Users\Seu Nome\Cursos\Python Avançado`
- Linux: `/home/usuario/cursos/Python Avançado`
- ZimaOS: `/DATA/Cursos/Python Avançado`

**Use sempre**: `/cursos/Python Avançado`

## 🎓 Sistema de Notas

Você pode adicionar anotações:
- **Por curso**: Na barra lateral direita, clique em "Notas"
- **Por aula**: Abaixo do player, clique em "Notas"

As notas são salvas automaticamente e ficam disponíveis para consulta.

## 🔧 Configuração Manual (Avançado)

Se preferir configurar manualmente, copie o arquivo `.env.example` para `.env` e edite:

```bash
cp .env.example .env
```

Edite o arquivo `.env`:

```bash
# Porta da aplicação
PORT=9823

# Caminho dos cursos no seu sistema
# Windows: C:/Users/SeuUsuario/Cursos
# Linux/Mac: /home/usuario/cursos
# ZimaOS: /DATA/Cursos
COURSES_PATH=C:/Users/SeuUsuario/Cursos

# Não altere estas linhas
COURSES_INTERNAL_PATH=/cursos
DATABASE_URL=sqlite:////app/data/platform_course.sqlite
FLASK_ENV=production
```

## 🎬 Formatos de Vídeo Suportados

### Nativamente suportados pelo navegador:
- MP4 (recomendado)
- WebM
- OGG

### Com reprodução externa:
- TS (MPEG Transport Stream)
- MKV (Matroska)
- AVI
- MOV
- WMV
- FLV

> **Nota**: Arquivos .TS e .MKV serão abertos no player padrão do sistema. Para melhor compatibilidade, recomendamos converter para MP4.

### Conversão de vídeos:

Para converter vídeos .TS para MP4 (mantém qualidade):

```bash
ffmpeg -i "video.ts" -c copy "video.mp4"
```

## 📦 Outros Formatos

- **PDF**: Visualização inline
- **TXT/HTML**: Visualização inline

## 🛠️ Comandos Úteis

### Parar a aplicação:
```bash
docker-compose down
```

### Reiniciar:
```bash
docker-compose restart
```

### Ver logs:
```bash
docker-compose logs -f
```

### Reconstruir (após alterações):
```bash
docker-compose up -d --build
```

### Backup do banco de dados:
```bash
cp data/platform_course.sqlite data/platform_course.sqlite.backup
```

## 🗂️ Estrutura do Projeto

```
plataforma-cursos-completa/
├── backend/           # API Flask
│   ├── app.py
│   ├── routes.py
│   └── ...
├── frontend/          # Interface React
│   └── src/
├── data/              # Banco de dados SQLite
├── uploads/           # Capas dos cursos
├── docker-compose.yml
├── Dockerfile
├── setup.sh           # Setup Linux/Mac
├── setup.ps1          # Setup Windows
└── README.md
```

## 🐳 Compatibilidade

- ✅ Windows 10/11
- ✅ Linux (Ubuntu, Debian, Fedora, etc.)
- ✅ macOS
- ✅ ZimaOS
- ✅ CasaOS
- ✅ Docker Desktop
- ✅ Portainer

## ⚙️ Requisitos

- Docker
- Docker Compose
- 2GB de RAM (mínimo)
- 500MB de espaço em disco (sem contar os cursos)

## 🔒 Segurança

- Banco de dados SQLite local
- Volumes Docker com permissão de somente leitura para cursos
- Sem exposição de APIs externas
- CORS configurado para mesma origem

## 🆘 Solução de Problemas

### Erro: "No such file or directory"
- Verifique se o caminho em `.env` está correto
- Certifique-se de que o diretório existe
- Use `/cursos/` ao cadastrar cursos

### Porta já em uso
- Altere a porta no arquivo `.env`
- Execute: `docker-compose down && docker-compose up -d`

### Vídeos não carregam
- Verifique se os arquivos têm permissão de leitura
- Para .TS/.MKV, considere converter para MP4
- Confira os logs: `docker-compose logs -f`

### Alterações no código não aparecem
```bash
docker-compose down
docker-compose up -d --build
```

## 📄 Licença

Este projeto é de código aberto.

## 👨‍💻 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests.

---

**Desenvolvido com ❤️ usando Flask, React e Docker**
