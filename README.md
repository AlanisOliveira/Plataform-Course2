# Plataforma de Cursos Completa

Sistema integrado e otimizado para homelab, voltado ao gerenciamento e visualização de cursos em vídeo, com suporte estruturado a múltiplos formatos, navegação hierárquica, notas, filtros e migração automatizada. Este projeto é uma evolução do frontend-plataforma-de-receitas [https://github.com/dragaoinvisivel/frontend-plataforma-de-receitas?tab=readme-ov-file], trazendo maior robustez, flexibilidade e integração com ambientes modernos como ZimaOS e CasaOS.

## Instalação

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd plataforma-cursos-completa
```

### 2. Configuração automática
**Windows:**
```powershell
.\setup.ps1
```

**Linux/Mac/ZimaOS:**
```bash
chmod +x setup.sh
./setup.sh
```

O script detecta o sistema operacional, solicita o caminho dos cursos e gera o arquivo `.env` com as configurações adequadas.

### 3. Inicialização via Docker
```bash
docker-compose up -d
```
Acesse no navegador: http://localhost:9823

## Organização dos cursos
```
Cursos/
├── Nome do Curso/
│   ├── Módulo 01/
│   │   ├── 1 - Introdução.mp4
│   └── capa.jpg
└── Outro Curso/
    ├── Módulo 1/
    └── Módulo 2/
```
O caminho de cadastro segue o formato: `/cursos/Nome-do-Curso`.

## Cadastro e gestão
Na interface de administração (“Gestão de Receitas”), adicione cursos informando nome, categorias (separadas por vírgula), caminho e imagem de capa.

Exemplos de caminho:
- Windows: `C:\Users\Usuario\Cursos\Curso`
- Linux: `/home/usuario/cursos/Curso`
- ZimaOS: `/DATA/Cursos/Curso`

Registre sempre como `/cursos/Curso`.

## Categorias e busca
- Suporte a múltiplas categorias e filtragem avançada.  
- Busca instantânea por nome ou categoria.

## Navegação hierárquica
- Suporte a múltiplos níveis de pastas.  
- Barra de progresso por módulo.  
- Navegação recursiva.

## Anotações
- Notas por curso ou aula.  
- Armazenamento automático e consulta futura.

## Configuração manual
```bash
cp .env.example .env
```

Variáveis principais:
```
PORT=9823
COURSES_PATH=/DATA/Cursos
COURSES_INTERNAL_PATH=/cursos
DATABASE_URL=postgresql+psycopg://platform_course:SENHA@postgres:5432/platform_course
POSTGRES_DB=platform_course
POSTGRES_USER=platform_course
POSTGRES_PASSWORD=SENHA_FORTE
PGADMIN_DEFAULT_EMAIL=admin@plataforma.local
PGADMIN_DEFAULT_PASSWORD=SENHA_FORTE
SECRET_KEY=UMA_CHAVE_FORTE
FLASK_ENV=production
```

## Banco de dados e administração
- O backend continua obrigatório para autenticação, sessão, leitura de arquivos e regras de negócio.
- O banco recomendado para CasaOS é PostgreSQL.
- O `pgAdmin` é incluído no `docker-compose` apenas para administrar o PostgreSQL.
- O frontend não deve acessar o banco diretamente.

## Formatos suportados
- Vídeos: MP4, WebM, OGG  
- Externos: TS, MKV, AVI, MOV, WMV, FLV  
- Outros: PDF, TXT, HTML  

Conversão de vídeos:
```bash
ffmpeg -i "video.ts" -c copy "video.mp4"
```

## Comandos úteis
| Ação | Comando |
|------|----------|
| Parar aplicação | `docker-compose down` |
| Reiniciar | `docker-compose restart` |
| Ver logs | `docker-compose logs -f` |
| Reconstruir | `docker-compose up -d --build` |
| Backup do banco | `cp data/platform_course.sqlite data/platform_course.sqlite.backup` |

## Estrutura do projeto
```
plataforma-cursos-completa/
├── backend/
├── frontend/
├── data/
├── uploads/
├── docker-compose.yml
├── Dockerfile
├── setup.sh
├── setup.ps1
└── README.md
```

## Compatibilidade
Windows 10/11  
Linux (Ubuntu, Debian, Fedora)  
macOS  
ZimaOS / CasaOS  
Docker Desktop / Portainer

## CasaOS
- Rode `./setup.sh` para gerar o `.env`.
- Suba os serviços com `docker-compose up -d`.
- A aplicação ficará em `http://IP-DO-SERVIDOR:9823`.
- O `pgAdmin` ficará em `http://IP-DO-SERVIDOR:8080` por padrão.
- No `pgAdmin`, o host do banco dentro da stack é `postgres`.

## Requisitos
- Docker  
- Docker Compose  
- 2 GB de RAM (mínimo)  
- 500 MB de espaço em disco (mínimo)

## Segurança
- Banco SQLite local  
- Volumes Docker com acesso somente leitura  
- API interna, sem exposição externa  
- CORS restrito

## Atualizações e migrações
```bash
cp data/platform_course.sqlite data/platform_course.sqlite.backup
git pull
docker-compose down
docker-compose up -d --build
```
Migrações são automáticas na inicialização.

## Solução de problemas
| Problema | Solução |
|-----------|----------|
| Arquivo não encontrado | Verifique paths e permissões |
| Porta em uso | Altere no `.env` |
| Vídeos não carregam | Verifique permissões ou converta para MP4 |
| Alterações não aparecem | `docker-compose down && docker-compose up -d --build` |
| Erro de categorias | Use a migração ou recrie o banco |

## Licença
Projeto de código aberto.

## Contribuição
Contribuições são bem-vindas via issues e pull requests.
