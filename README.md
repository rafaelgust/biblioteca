# Biblioteca

Sistema web de gerenciamento de biblioteca desenvolvido com Laravel 13, Inertia.js v2 e React 19.

## Sobre o Projeto

O **Biblioteca** é uma aplicação web completa para gerenciamento de acervo e empréstimos de livros. O sistema permite que visitantes naveguem pelo catálogo de livros publicamente, enquanto usuários autenticados podem cadastrar livros, realizar empréstimos e acompanhar prazos de devolução.

A aplicação funciona como uma SPA (Single Page Application) renderizada no servidor através do Inertia.js, combinando com Laravel no backend com React no frontend.

### Principais módulos

- **Catálogo de Livros** — CRUD completo com busca por título e autor, paginação, upload de imagem de capa e filtro por propriedade (Todos / Livros de Outros / Meus Livros). A listagem e os detalhes dos livros são públicos; o cadastro requer autenticação; edição e exclusão são restritas ao usuário que cadastrou o livro (via Policy).
- **Sistema de Empréstimos** — Dois fluxos de empréstimo: o usuário pode pegar emprestado um livro de outro usuário, ou o dono pode emprestar seu livro selecionando um usuário da lista de elegíveis. Limite de até 3 empréstimos simultâneos por usuário e prazo máximo de 2 dias para devolução. Proteção contra race conditions com lock pessimista. Livros emprestados ficam indisponíveis até a devolução ser registrada.
- **Dashboard** — Painel com estatísticas do acervo (total de livros, empréstimos ativos, livros disponíveis), lista de empréstimos pessoais com status visual (no prazo, vence em breve, atrasado) e livros adicionados recentemente. O sistema avisa quando o usuário atinge o limite de 3 empréstimos.
- **Notificações por E-mail** — Alerta automatizado que verifica os prazos de devolução a cada hora. Quando faltam 12 horas ou menos para o vencimento, o sistema envia um e-mail ao usuário via fila (queue), sem envios duplicados.
- **Autenticação** — Login, registro, redefinição de senha e autenticação de dois fatores (2FA) via Laravel Fortify.

### Stack tecnológica

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

### Extensões PHP necessárias

No `php.ini`, descomente (remova o `;`) as seguintes extensões:

**Obrigatórias:**
```ini
extension=curl
extension=fileinfo
extension=mbstring
extension=openssl
extension=pdo_sqlite
extension=sqlite3
```

**Recomendadas:**
```ini
extension=zip
extension=gd
extension=intl
extension=sodium
```

**Se usar MySQL em vez de SQLite:**
```ini
extension=mysqli
extension=pdo_mysql
```

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

**Linux/macOS:**
```bash
cp .env.example .env
php artisan key:generate
```

**Windows (CMD):**
```cmd
copy .env.example .env
php artisan key:generate
```

### 5. Criar banco de dados
O projeto usa SQLite por padrão. Crie o arquivo do banco:

**Linux/macOS:**
```bash
touch database/database.sqlite
```

**Windows (CMD):**
```cmd
type nul > database\database.sqlite
```
### 6. Executar migrations
```bash
php artisan migrate
```
> Funciona igual em Windows, Linux e macOS.

### 7. Criar link do storage (imagens de capa)
Para que as imagens de capa dos livros fiquem acessíveis publicamente:
```bash
php artisan storage:link
```
Isso cria um link simbólico `public/storage` → `storage/app/public`. As capas ficam em `storage/app/public/covers/`.

> **Windows:** Execute o terminal (CMD ou PowerShell) **como Administrador** — a criação de links simbólicos exige privilégios elevados no Windows.

### 8. Popular banco com dados de exemplo (opcional)
```bash
php artisan db:seed
```
Cria um usuário de teste (`test@example.com` / `password`), 20 livros e empréstimos variados.

### 9. Compilar assets e iniciar servidor

**Linux/macOS** — tudo em um comando:
```bash
composer run dev
```

**Windows** — abra 3 terminais separados (o `composer run dev` usa `php artisan pail`, que requer a extensão `pcntl`, indisponível no Windows):
```cmd
# Terminal 1
php artisan serve

# Terminal 2
php artisan queue:listen --tries=1 --timeout=0

# Terminal 3
npm run dev
```

Para produção (todas as plataformas):
```bash
npm run build
php artisan serve
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

### Visão geral

A aplicação segue o padrão **monólito moderno** com Inertia.js como ponte entre Laravel (backend) e React (frontend). Não existe API REST separada — o Inertia conecta controllers Laravel diretamente a componentes React, mantendo o roteamento e a autorização no servidor.

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
│  │              Serviços Assíncronos                     │  │
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

### Camadas de autorização

| Camada | Responsabilidade | Exemplo |
|--------|-----------------|---------|
| **Middleware** (`auth`) | Exige autenticação | Criar, editar, excluir livros; emprestar |
| **Policy** (`BookPolicy`) | Verifica se o usuário é o dono do recurso | Editar/excluir apenas o próprio livro |
| **Controller** (regras de negócio) | Valida regras específicas do domínio | Limite de 3 empréstimos, não emprestar próprio livro |
| **Form Request** | Valida dados de entrada | Campos obrigatórios, ISBN único, formato da imagem |
| **DB Transaction + Lock** | Garante consistência em concorrência | Dois usuários emprestando o mesmo livro |

## Fluxos da Aplicação

### Cadastro de livro

```
Usuário logado
  │
  ├─ GET /books/create ──► Formulário React (books/create.tsx)
  │                           │
  │                    Preenche dados + upload de capa (opcional)
  │                           │
  └─ POST /books ────────► StoreBookRequest (validação)
                              │
                         ┌────▼────┐
                         │ Válido? │
                         └────┬────┘
                          Não │ Sim
                           │  │
              Retorna erros│  ├─ Salva imagem em storage/covers/
              na sessão    │  ├─ Cria Book com user_id do logado
                           │  └─ Redireciona para /books
                           │     com mensagem de sucesso
                           ▼
                    Formulário com erros
```

### Pegar emprestado (usuário pega livro de outro)

```
Usuário logado (não-dono)
  │
  ├─ Visualiza GET /books/{id}
  │    │
  │    ├─ Livro disponível + menos de 3 empréstimos → Botão "Pegar Emprestado"
  │    ├─ Livro disponível + 3 empréstimos          → Alerta de limite atingido
  │    └─ Livro emprestado                          → Sem botão
  │
  └─ POST /loans/{book} ──────────────────────────────────────►
                                                                │
                          ┌─────────────────────────────────────▼──┐
                          │ 1. É o próprio livro?     → Erro       │
                          │ 2. Já tem 3 empréstimos?  → Erro       │
                          │ 3. Livro disponível?      → Lock + TX  │
                          │    └─ Sim: Cria Loan (prazo = 2 dias)  │
                          │    └─ Não: Erro (race condition)       │
                          └──────────────────────┬────────────────┘
                                                 │
                                    Redireciona para /loans
                                    com mensagem de sucesso
```

### Dono empresta para outro usuário

```
Usuário logado (dono do livro)
  │
  ├─ Visualiza GET /books/{id} → Botão "Emprestar Livro"
  │
  ├─ Clica "Emprestar Livro"
  │    │
  │    └─ GET /loans/{book}/eligible-borrowers (JSON)
  │         │
  │         └─ Retorna usuários com < 3 empréstimos ativos
  │            (exclui o dono)
  │
  ├─ Seleciona usuário no Dialog
  │
  └─ POST /loans/{book} { user_id: X }
       │
       ├─ Valida: é o dono? usuário existe? usuário < 3 empréstimos?
       ├─ Lock pessimista + transação
       ├─ Cria Loan para o usuário selecionado
       └─ Redireciona para /books/{id} com sucesso
```

### Devolução

```
Usuário logado (que fez o empréstimo)
  │
  ├─ GET /loans ──► Painel com empréstimos ativos
  │                   │
  │                   └─ Botão "Devolver" (apenas nos próprios)
  │
  └─ PATCH /loans/{loan}/return
       │
       ├─ É o dono do empréstimo? → Senão, erro
       ├─ Já devolvido?           → Senão, erro
       ├─ Seta returned_at = now()
       └─ Livro fica disponível novamente
```

### Notificação de vencimento

```
Scheduler (a cada hora)
  │
  └─ php artisan loans:check-due-dates
       │
       ├─ Busca empréstimos:
       │    returned_at = null
       │    notified = false
       │    due_at <= agora + 12h
       │
       ├─ Para cada empréstimo:
       │    ├─ Envia LoanDueNotification via Queue
       │    └─ Marca notified = true
       │
       └─ Worker da fila processa e envia e-mail
```

## Estrutura do Projeto

### Backend

| Caminho | Descrição |
|---------|-----------|
| `app/Models/` | Modelos Eloquent (Book, Loan, User) |
| `app/Http/Controllers/` | Controllers (BookController, LoanController, DashboardController) |
| `app/Http/Requests/` | Form Requests para validação (StoreBookRequest, UpdateBookRequest) |
| `app/Policies/` | Policies de autorização (BookPolicy) |
| `app/Notifications/` | Notificações por e-mail (LoanDueNotification) |
| `app/Console/Commands/` | Comandos Artisan (CheckDueDatesCommand) |
| `routes/web.php` | Definição de rotas |
| `routes/console.php` | Agendamento de tarefas (Scheduler) |
| `database/migrations/` | Migrations do banco de dados |
| `database/factories/` | Factories para testes |
| `database/seeders/` | Seeders com dados de exemplo |

### Frontend

| Caminho | Descrição |
|---------|-----------|
| `resources/js/pages/` | Páginas React/Inertia (welcome, dashboard, books/*, loans/*) |
| `resources/js/components/` | Componentes reutilizáveis (BookCover, Heading, ui/*) |
| `resources/js/layouts/` | Layouts da aplicação (AppLayout, AuthLayout) |
| `resources/js/types/` | Tipos TypeScript (Book, Loan, User, PaginatedData) |
| `resources/js/lib/` | Utilitários (loan-helpers, utils) |

## Alerta de Vencimento de Empréstimos

O sistema envia automaticamente um e-mail ao usuário quando faltam **12 horas ou menos** para o prazo de devolução de um livro emprestado.

### Como funciona

1. O comando `php artisan loans:check-due-dates` busca empréstimos que:
   - Ainda não foram devolvidos (`returned_at = null`)
   - Ainda não foram notificados (`notified = false`)
   - Vencem em até 12 horas (`due_at <= agora + 12h`)
2. Para cada empréstimo encontrado, dispara uma `LoanDueNotification` via fila (queue)
3. Após o envio, marca o campo `notified = true` no empréstimo para evitar envios duplicados

### Agendamento (Scheduler)

O comando está registrado em `routes/console.php` para execução **a cada hora**:

```php
Schedule::command('loans:check-due-dates')->hourly();
```

### Configuração em produção

Para o scheduler funcionar, adicione o seguinte cron no servidor:

```bash
* * * * * cd /caminho-do-projeto && php artisan schedule:run >> /dev/null 2>&1
```

E mantenha o worker da fila em execução:

```bash
php artisan queue:work
```

### Configuração de e-mail

Configure as variáveis de e-mail no `.env`:

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.seuservidor.com
MAIL_PORT=587
MAIL_USERNAME=seu@email.com
MAIL_PASSWORD=sua-senha
MAIL_FROM_ADDRESS=biblioteca@seudominio.com
MAIL_FROM_NAME="Biblioteca"
```

Em desenvolvimento, o mailer padrão é `log` (`MAIL_MAILER=log` no `.env`). Com essa configuração, os e-mails não são enviados de fato — o corpo completo da mensagem (incluindo destinatário, assunto e conteúdo HTML) é gravado em `storage/logs/laravel.log`, permitindo verificar o funcionamento das notificações sem precisar de um servidor SMTP.

### Teste manual

Para verificar manualmente se há empréstimos a notificar:

```bash
php artisan loans:check-due-dates
```

Após a execução, confira o log para ver os e-mails gerados:

```bash
tail -n 100 storage/logs/laravel.log
```

## Comandos Úteis

| Comando | Descrição |
|---------|-----------|
| `composer run dev` | Inicia servidor de desenvolvimento |
| `php artisan test --compact` | Executa todos os testes |
| `vendor/bin/pint` | Formata código PHP (PSR-12) |
| `npm run lint` | Lint do código TypeScript/React |
| `npm run format` | Formata código frontend com Prettier |
| `npm run types:check` | Verificação de tipos TypeScript |
| `php artisan storage:link` | Cria link simbólico para arquivos públicos |

## Desenvolvimento

Este projeto foi desenvolvido com o auxílio do [Claude Code](https://claude.ai/code) integrado ao [Laravel Boost MCP](https://github.com/laravel/boost), que fornece acesso contextual ao schema do banco, documentação das dependências, logs e rotas da aplicação diretamente ao agente durante o desenvolvimento.

## Capturas de Tela

### Página Inicial

![Página inicial](img-readme/Captura%20de%20Tela%202026-03-22%20%C3%A0s%2018.53.11.png)

### Acervo de Livros (visitante)

![Acervo de livros - visitante](img-readme/Captura%20de%20Tela%202026-03-22%20%C3%A0s%2018.53.37.png)

### Detalhes do Livro (visitante)

![Detalhes do livro](img-readme/Captura%20de%20Tela%202026-03-22%20%C3%A0s%2018.53.44.png)

### Tela de Login

![Tela de login](img-readme/Captura%20de%20Tela%202026-03-22%20%C3%A0s%2018.54.28.png)

### Dashboard

![Dashboard](img-readme/Captura%20de%20Tela%202026-03-22%20%C3%A0s%2018.58.36.png)

### Painel de Empréstimos

![Painel de empréstimos](img-readme/Captura%20de%20Tela%202026-03-22%20%C3%A0s%2019.02.37.png)

### Configurações de Perfil

![Configurações de perfil](img-readme/Captura%20de%20Tela%202026-03-22%20%C3%A0s%2019.02.55.png)

### Tema Escuro (Aparência)

![Tema escuro](img-readme/Captura%20de%20Tela%202026-03-22%20%C3%A0s%2019.03.03.png)

### Acervo de Livros (autenticado)

![Acervo de livros - autenticado](img-readme/Captura%20de%20Tela%202026-03-22%20%C3%A0s%2019.03.18.png)

### Cadastrar Novo Livro (formulário vazio)

![Cadastrar novo livro](img-readme/Captura%20de%20Tela%202026-03-22%20%C3%A0s%2019.03.25.png)

### Cadastrar Novo Livro (formulário preenchido)

![Cadastrar novo livro preenchido](img-readme/Captura%20de%20Tela%202026-03-22%20%C3%A0s%2023.59.43.png)

### Detalhes do Livro (dono do livro)

![Detalhes do livro - dono](img-readme/Captura%20de%20Tela%202026-03-23%20%C3%A0s%2000.01.53.png)

## Licença

MIT
