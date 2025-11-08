# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [Não Lançado] - 2025-11-08

### Adicionado
- **Sistema de Categorias/Tags**: Adicione categorias aos cursos para melhor organização
  - Campo de categorias nos formulários de adicionar/editar curso
  - Exibição de badges com categorias nos cards dos cursos
  - Suporte a múltiplas categorias separadas por vírgula

- **Busca e Filtro**: Sistema de busca em tempo real
  - Barra de busca na lista de cursos
  - Filtragem por nome do curso ou categoria
  - Ícone de lupa para melhor UX

- **Navegação Hierárquica de Módulos**: Suporte completo a pastas/subpastas
  - Estrutura recursiva para organização de módulos
  - Ícones de pasta para identificação visual
  - Barra de progresso calculada incluindo todas as aulas das subpastas
  - Suporte ilimitado de níveis de hierarquia

- **Sistema de Migração Automática**:
  - Migrações de banco de dados executadas automaticamente ao iniciar
  - Suporte a usuários novos e existentes
  - Logs informativos sobre o status das migrações

### Corrigido
- **Botão Fechar no Edit Course**: Adicionado `onOpenChange` ao Dialog para o botão X funcionar corretamente

### Técnico
- Adicionada coluna `categories` ao modelo `Course` (backend)
- Função `run_migrations()` para aplicar migrações automaticamente
- Componente recursivo `HierarchyItem` para renderizar estrutura de pastas
- Refatoração da função `onOrganize()` para criar hierarquia completa
- Atualização de rotas do backend para incluir categorias
- Importação do componente `Badge` e ícone `Folder` do lucide-react

## Versões Anteriores

### Funcionalidades Existentes
- Player de vídeo com controles completos
- Suporte a múltiplos formatos de vídeo
- Sistema de progresso por aula e por curso
- Sistema de notas por curso e por aula
- Retomada automática do último ponto assistido
- Interface responsiva
- Tema claro e escuro
- Suporte a ZimaOS, CasaOS, Docker Desktop e Portainer
