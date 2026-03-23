# Biblioteca

Sistema web de gerenciamento de biblioteca desenvolvido com Laravel 13, Inertia.js v2 e React 19.

## Sobre o Projeto

O **Biblioteca** e uma aplicacao web completa para gerenciamento de acervo e emprestimos de livros. O sistema permite que visitantes naveguem pelo catalogo de livros publicamente, enquanto usuarios autenticados podem cadastrar livros, realizar emprestimos e acompanhar prazos de devolucao.

A aplicacao funciona como uma SPA (Single Page Application) renderizada no servidor atraves do Inertia.js, combinando com Laravel no backend com a fluidez do React no frontend.

### Principais modulos

- **Catalogo de Livros** — CRUD completo com busca por titulo e autor, paginacao, upload de imagem de capa e filtro por propriedade (Todos / Livros de Outros / Meus Livros). A listagem e os detalhes dos livros sao publicos; o cadastro requer autenticacao; edicao e exclusao sao restritas ao usuario que cadastrou o livro (via Policy).
- **Sistema de Emprestimos** — Dois fluxos de emprestimo: o usuario pode pegar emprestado um livro de outro usuario, ou o dono pode emprestar seu livro selecionando um usuario da lista de elegiveis. Limite de ate 3 emprestimos simultaneos por usuario e prazo maximo de 2 dias para devolucao. Protecao contra race conditions com lock pessimista. Livros emprestados ficam indisponiveis ate a devolucao ser registrada.
- **Dashboard** — Painel com estatisticas do acervo (total de livros, emprestimos ativos, livros disponiveis), lista de emprestimos pessoais com status visual (no prazo, vence em breve, atrasado) e livros adicionados recentemente. O sistema avisa quando o usuario atinge o limite de 3 emprestimos.
- **Notificacoes por E-mail** — Alerta automatizado que verifica os prazos de devolucao a cada hora. Quando faltam 12 horas ou menos para o vencimento, o sistema envia um e-mail ao usuario via fila (queue), sem envios duplicados.
- **Autenticacao** — Login, registro, redefinicao de senha e autenticacao de dois fatores (2FA) via Laravel Fortify.

### Stack tecnologica

| Camada | Tecnologias |
|--------|-------------|
| Backend | Laravel 13, PHP 8.4, Eloquent ORM, Laravel Fortify |
| Frontend | React 19, Inertia.js v2, TypeScript, Tailwind CSS v4, Shadcn/Radix UI |
| Testes | Pest v4 (80 testes, 313 assertions) |
| Ferramentas | Laravel Pint, ESLint, Prettier, Vite |

## Requisitos

- PHP >= 8.4
- Composer
- Node.js >= 22
- NPM >= 11
- SQLite (padrão) ou outro banco de dados suportado pelo Laravel

## Instalação

### 1. Clonar o repositório

```bash
git clone <url-do-repositorio> biblioteca
cd biblioteca
```

### 2. Instalar dependências PHP

```bash
composer install
```

### 3. Instalar dependências JavaScript

```bash
npm install
```

### 4. Configurar ambiente

```bash
cp .env.example .env
php artisan key:generate
```

### 5. Criar banco de dados

O projeto usa SQLite por padrão. Crie o arquivo do banco:

```bash
touch database/database.sqlite
```

### 6. Executar migrations

```bash
php artisan migrate
```

### 7. Criar link do storage (imagens de capa)

Para que as imagens de capa dos livros fiquem acessíveis publicamente:

```bash
php artisan storage:link
```

Isso cria um link simbólico `public/storage` → `storage/app/public`. As capas ficam em `storage/app/public/covers/`.

### 8. Popular banco com dados de exemplo (opcional)

```bash
php artisan db:seed
```

Cria um usuário de teste (`test@example.com` / `password`), 20 livros e empréstimos variados.

### 9. Compilar assets e iniciar servidor

```bash
# Desenvolvimento (com hot reload)
composer run dev

# Ou separadamente:
php artisan serve   # Backend na porta 8000
npm run dev         # Vite com hot reload
```

Para produção:

```bash
npm run build
```

## Testes

```bash
# Todos os testes
php artisan test

# Testes específicos
php artisan test --filter=NomeDoTeste

# Arquivo específico
php artisan test tests/Feature/BookTest.php
```

## Arquitetura

### Visao geral

A aplicacao segue o padrao **monolito moderno** com Inertia.js como ponte entre Laravel (backend) e React (frontend). Nao existe API REST separada — o Inertia conecta controllers Laravel diretamente a componentes React, mantendo o roteamento e a autorizacao no servidor.

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              React 19 + Inertia.js v2                 │  │
│  │  ┌──────────┐  ┌──────────┐  ┌────────────────────┐  │  │
│  │  │  Pages   │  │Components│  │  Layouts / Types    │  │  │
│  │  └────┬─────┘  └──────────┘  └────────────────────┘  │  │
│  └───────┼───────────────────────────────────────────────┘  │
│          │ Inertia Protocol (XHR com JSON)                  │
└──────────┼──────────────────────────────────────────────────┘
           │
┌──────────┼──────────────────────────────────────────────────┐
│          ▼          Laravel 13 (PHP 8.4)                    │
│  ┌──────────────┐  ┌────────────┐  ┌─────────────────────┐ │
│  │   Routes     │→ │ Middleware │→ │    Controllers       │ │
│  │  (web.php)   │  │ auth/csrf  │  │  Book/Loan/Dashboard │ │
│  └──────────────┘  └────────────┘  └──────┬──────────────┘ │
│                                           │                │
│          ┌────────────────────────────────┼───────────┐     │
│          ▼                    ▼           ▼           │     │
│  ┌──────────────┐  ┌────────────────┐  ┌──────────┐  │     │
│  │ Form Request │  │    Policies    │  │  Models   │  │     │
│  │  Validation  │  │ Authorization  │  │ Eloquent  │  │     │
│  └──────────────┘  └────────────────┘  └────┬─────┘  │     │
│                                             │        │     │
│                                        ┌────▼─────┐  │     │
│                                        │ Database │  │     │
│                                        │  SQLite  │  │     │
│                                        └──────────┘  │     │
│          ┌───────────────────────────────────────────┘     │
│          ▼                                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Servicos Assincronos                     │  │
│  │  Scheduler (hourly) → CheckDueDates → Queue → Email  │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

### Modelos e relacionamentos

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│     User     │       │     Book     │       │     Loan     │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id           │       │ id           │       │ id           │
│ name         │◄──┐   │ user_id (FK) │──►    │ user_id (FK) │──► User
│ email        │   │   │ title        │       │ book_id (FK) │──► Book
│ password     │   │   │ author       │       │ borrowed_at  │
│              │   │   │ isbn (unique)│       │ due_at       │
│              │   │   │ year         │       │ returned_at  │
│              │   │   │ description  │       │ notified     │
│              │   │   │ cover_image  │       │              │
└──────────────┘   │   └──────────────┘       └──────────────┘
  │                │          │
  │ books()        │          │ activeLoan() → Loan (returned_at = null)
  │ loans()        │          │ loans()       → Loan (todos)
  │ activeLoans()  │          │
  └────────────────┘          │
    user_id ◄─────────────────┘
```

### Camadas de autorizacao

| Camada | Responsabilidade | Exemplo |
|--------|-----------------|---------|
| **Middleware** (`auth`) | Exige autenticacao | Criar, editar, excluir livros; emprestar |
| **Policy** (`BookPolicy`) | Verifica se o usuario e o dono do recurso | Editar/excluir apenas o proprio livro |
| **Controller** (regras de negocio) | Valida regras especificas do dominio | Limite de 3 emprestimos, nao emprestar proprio livro |
| **Form Request** | Valida dados de entrada | Campos obrigatorios, ISBN unico, formato da imagem |
| **DB Transaction + Lock** | Garante consistencia em concorrencia | Dois usuarios emprestando o mesmo livro |

## Fluxos da Aplicacao

### Cadastro de livro

```
Usuario logado
  │
  ├─ GET /books/create ──► Formulario React (books/create.tsx)
  │                           │
  │                    Preenche dados + upload de capa (opcional)
  │                           │
  └─ POST /books ────────► StoreBookRequest (validacao)
                              │
                         ┌────▼────┐
                         │ Valido? │
                         └────┬────┘
                          Nao │ Sim
                           │  │
              Retorna erros│  ├─ Salva imagem em storage/covers/
              na sessao    │  ├─ Cria Book com user_id do logado
                           │  └─ Redireciona para /books
                           │     com mensagem de sucesso
                           ▼
                    Formulario com erros
```

### Pegar emprestado (usuario pega livro de outro)

```
Usuario logado (nao-dono)
  │
  ├─ Visualiza GET /books/{id}
  │    │
  │    ├─ Livro disponivel + menos de 3 emprestimos → Botao "Pegar Emprestado"
  │    ├─ Livro disponivel + 3 emprestimos          → Alerta de limite atingido
  │    └─ Livro emprestado                          → Sem botao
  │
  └─ POST /loans/{book} ──────────────────────────────────────►
                                                                │
                          ┌─────────────────────────────────────▼──┐
                          │ 1. E o proprio livro?     → Erro       │
                          │ 2. Ja tem 3 emprestimos?  → Erro       │
                          │ 3. Livro disponivel?      → Lock + TX  │
                          │    └─ Sim: Cria Loan (prazo = 2 dias)  │
                          │    └─ Nao: Erro (race condition)       │
                          └──────────────────────┬────────────────┘
                                                 │
                                    Redireciona para /loans
                                    com mensagem de sucesso
```

### Dono empresta para outro usuario

```
Usuario logado (dono do livro)
  │
  ├─ Visualiza GET /books/{id} → Botao "Emprestar Livro"
  │
  ├─ Clica "Emprestar Livro"
  │    │
  │    └─ GET /loans/{book}/eligible-borrowers (JSON)
  │         │
  │         └─ Retorna usuarios com < 3 emprestimos ativos
  │            (exclui o dono)
  │
  ├─ Seleciona usuario no Dialog
  │
  └─ POST /loans/{book} { user_id: X }
       │
       ├─ Valida: e o dono? usuario existe? usuario < 3 emprestimos?
       ├─ Lock pessimista + transacao
       ├─ Cria Loan para o usuario selecionado
       └─ Redireciona para /books/{id} com sucesso
```

### Devolucao

```
Usuario logado (que fez o emprestimo)
  │
  ├─ GET /loans ──► Painel com emprestimos ativos
  │                   │
  │                   └─ Botao "Devolver" (apenas nos proprios)
  │
  └─ PATCH /loans/{loan}/return
       │
       ├─ E o dono do emprestimo? → Senao, erro
       ├─ Ja devolvido?           → Senao, erro
       ├─ Seta returned_at = now()
       └─ Livro fica disponivel novamente
```

### Notificacao de vencimento

```
Scheduler (a cada hora)
  │
  └─ php artisan loans:check-due-dates
       │
       ├─ Busca emprestimos:
       │    returned_at = null
       │    notified = false
       │    due_at <= agora + 12h
       │
       ├─ Para cada emprestimo:
       │    ├─ Envia LoanDueNotification via Queue
       │    └─ Marca notified = true
       │
       └─ Worker da fila processa e envia e-mail
```

## Estrutura do Projeto

### Backend

| Caminho | Descricao |
|---------|-----------|
| `app/Models/` | Modelos Eloquent (Book, Loan, User) |
| `app/Http/Controllers/` | Controllers (BookController, LoanController, DashboardController) |
| `app/Http/Requests/` | Form Requests para validacao (StoreBookRequest, UpdateBookRequest) |
| `app/Policies/` | Policies de autorizacao (BookPolicy) |
| `app/Notifications/` | Notificacoes por e-mail (LoanDueNotification) |
| `app/Console/Commands/` | Comandos Artisan (CheckDueDatesCommand) |
| `routes/web.php` | Definicao de rotas |
| `routes/console.php` | Agendamento de tarefas (Scheduler) |
| `database/migrations/` | Migrations do banco de dados |
| `database/factories/` | Factories para testes |
| `database/seeders/` | Seeders com dados de exemplo |

### Frontend

| Caminho | Descricao |
|---------|-----------|
| `resources/js/pages/` | Paginas React/Inertia (welcome, dashboard, books/*, loans/*) |
| `resources/js/components/` | Componentes reutilizaveis (BookCover, Heading, ui/*) |
| `resources/js/layouts/` | Layouts da aplicacao (AppLayout, AuthLayout) |
| `resources/js/types/` | Tipos TypeScript (Book, Loan, User, PaginatedData) |
| `resources/js/lib/` | Utilitarios (loan-helpers, utils) |

## Alerta de Vencimento de Emprestimos

O sistema envia automaticamente um e-mail ao usuario quando faltam **12 horas ou menos** para o prazo de devolucao de um livro emprestado.

### Como funciona

1. O comando `php artisan loans:check-due-dates` busca emprestimos que:
   - Ainda nao foram devolvidos (`returned_at = null`)
   - Ainda nao foram notificados (`notified = false`)
   - Vencem em ate 12 horas (`due_at <= agora + 12h`)
2. Para cada emprestimo encontrado, dispara uma `LoanDueNotification` via fila (queue)
3. Apos o envio, marca o campo `notified = true` no emprestimo para evitar envios duplicados

### Agendamento (Scheduler)

O comando esta registrado em `routes/console.php` para execucao **a cada hora**:

```php
Schedule::command('loans:check-due-dates')->hourly();
```

### Configuracao em producao

Para o scheduler funcionar, adicione o seguinte cron no servidor:

```bash
* * * * * cd /caminho-do-projeto && php artisan schedule:run >> /dev/null 2>&1
```

E mantenha o worker da fila em execucao:

```bash
php artisan queue:work
```

### Configuracao de e-mail

Configure as variaveis de e-mail no `.env`:

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.seuservidor.com
MAIL_PORT=587
MAIL_USERNAME=seu@email.com
MAIL_PASSWORD=sua-senha
MAIL_FROM_ADDRESS=biblioteca@seudominio.com
MAIL_FROM_NAME="Biblioteca"
```

Em desenvolvimento, o mailer padrao e `log`, entao os e-mails sao gravados em `storage/logs/laravel.log`.

### Teste manual

Para verificar manualmente se ha emprestimos a notificar:

```bash
php artisan loans:check-due-dates
```

## Comandos Uteis

| Comando | Descrição |
|---------|-----------|
| `composer run dev` | Inicia servidor de desenvolvimento |
| `php artisan test --compact` | Executa todos os testes |
| `vendor/bin/pint` | Formata codigo PHP (PSR-12) |
| `npm run lint` | Lint do codigo TypeScript/React |
| `npm run format` | Formata codigo frontend com Prettier |
| `npm run types:check` | Verificacao de tipos TypeScript |
| `php artisan storage:link` | Cria link simbolico para arquivos publicos |

## Desenvolvimento

Este projeto foi desenvolvido com o auxilio do [Claude Code](https://claude.ai/code) integrado ao [Laravel Boost MCP](https://github.com/laravel/boost), que fornece acesso contextual ao schema do banco, documentacao das dependencias, logs e rotas da aplicacao diretamente ao agente durante o desenvolvimento.

## Capturas de Tela

### Pagina Inicial

![Pagina inicial](img-readme/Captura%20de%20Tela%202026-03-22%20%C3%A0s%2018.53.11.png)

### Acervo de Livros (visitante)

![Acervo de livros - visitante](img-readme/Captura%20de%20Tela%202026-03-22%20%C3%A0s%2018.53.37.png)

### Detalhes do Livro (visitante)

![Detalhes do livro](img-readme/Captura%20de%20Tela%202026-03-22%20%C3%A0s%2018.53.44.png)

### Tela de Login

![Tela de login](img-readme/Captura%20de%20Tela%202026-03-22%20%C3%A0s%2018.54.28.png)

### Dashboard

![Dashboard](img-readme/Captura%20de%20Tela%202026-03-22%20%C3%A0s%2018.58.36.png)

### Painel de Emprestimos

![Painel de emprestimos](img-readme/Captura%20de%20Tela%202026-03-22%20%C3%A0s%2019.02.37.png)

### Configuracoes de Perfil

![Configuracoes de perfil](img-readme/Captura%20de%20Tela%202026-03-22%20%C3%A0s%2019.02.55.png)

### Tema Escuro (Aparencia)

![Tema escuro](img-readme/Captura%20de%20Tela%202026-03-22%20%C3%A0s%2019.03.03.png)

### Acervo de Livros (autenticado)

![Acervo de livros - autenticado](img-readme/Captura%20de%20Tela%202026-03-22%20%C3%A0s%2019.03.18.png)

### Cadastrar Novo Livro (formulario vazio)

![Cadastrar novo livro](img-readme/Captura%20de%20Tela%202026-03-22%20%C3%A0s%2019.03.25.png)

### Cadastrar Novo Livro (formulario preenchido)

![Cadastrar novo livro preenchido](img-readme/Captura%20de%20Tela%202026-03-22%20%C3%A0s%2023.59.43.png)

### Detalhes do Livro (dono do livro)

![Detalhes do livro - dono](img-readme/Captura%20de%20Tela%202026-03-23%20%C3%A0s%2000.01.53.png)

## Licenca

MIT
