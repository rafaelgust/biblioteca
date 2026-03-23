<?php

use App\Models\Book;
use App\Models\Loan;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('listagem de livros é acessível publicamente', function () {
    $this->get('/books')->assertSuccessful();
});

test('listagem exibe livros cadastrados', function () {
    Book::factory()->count(3)->create();

    $this->get('/books')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('books/index')
            ->has('books.data', 3)
        );
});

test('listagem pagina com 10 livros por página', function () {
    Book::factory()->count(15)->create();

    $this->get('/books')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('books.data', 10)
            ->where('books.total', 15)
        );
});

test('busca filtra livros pelo título', function () {
    Book::factory()->create(['title' => 'Dom Casmurro']);
    Book::factory()->create(['title' => 'Memórias Póstumas']);

    $this->get('/books?search=Dom')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('books.data', 1)
            ->where('books.data.0.title', 'Dom Casmurro')
        );
});

test('busca filtra livros pelo autor', function () {
    Book::factory()->create(['author' => 'Machado de Assis']);
    Book::factory()->create(['author' => 'Jorge Amado']);

    $this->get('/books?search=Machado')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('books.data', 1)
            ->where('books.data.0.author', 'Machado de Assis')
        );
});

test('detalhes do livro são acessíveis publicamente', function () {
    $book = Book::factory()->create();

    $this->get("/books/{$book->id}")
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('books/show')
            ->has('book')
        );
});

test('usuário autenticado pode acessar formulário de criação', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/books/create')
        ->assertSuccessful();
});

test('usuário não autenticado não pode acessar formulário de criação', function () {
    $this->get('/books/create')->assertRedirect('/login');
});

test('usuário autenticado pode cadastrar um livro', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post('/books', [
            'title' => 'Dom Casmurro',
            'author' => 'Machado de Assis',
            'isbn' => '978-85-359-0277-1',
            'year' => 1899,
            'description' => 'Um clássico da literatura brasileira.',
        ])
        ->assertRedirect('/books');

    expect(Book::query()->where('title', 'Dom Casmurro')->exists())->toBeTrue();
    expect(Book::query()->first()->user_id)->toBe($user->id);
});

test('validação rejeita livro sem campos obrigatórios', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post('/books', [])
        ->assertSessionHasErrors(['title', 'author', 'isbn', 'year']);
});

test('validação rejeita ISBN duplicado', function () {
    $user = User::factory()->create();
    Book::factory()->create(['isbn' => '978-85-359-0277-1']);

    $this->actingAs($user)
        ->post('/books', [
            'title' => 'Outro Livro',
            'author' => 'Autor',
            'isbn' => '978-85-359-0277-1',
            'year' => 2020,
        ])
        ->assertSessionHasErrors('isbn');
});

test('dono pode editar seu livro', function () {
    $user = User::factory()->create();
    $book = Book::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->get("/books/{$book->id}/edit")
        ->assertSuccessful();

    $this->actingAs($user)
        ->put("/books/{$book->id}", [
            'title' => 'Título Atualizado',
            'author' => $book->author,
            'isbn' => $book->isbn,
            'year' => $book->year,
        ])
        ->assertRedirect("/books/{$book->id}");

    expect($book->fresh()->title)->toBe('Título Atualizado');
});

test('outro usuário não pode editar livro alheio', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();
    $book = Book::factory()->create(['user_id' => $owner->id]);

    $this->actingAs($other)
        ->get("/books/{$book->id}/edit")
        ->assertForbidden();

    $this->actingAs($other)
        ->put("/books/{$book->id}", [
            'title' => 'Hackeado',
            'author' => $book->author,
            'isbn' => $book->isbn,
            'year' => $book->year,
        ])
        ->assertForbidden();
});

test('dono pode excluir seu livro', function () {
    $user = User::factory()->create();
    $book = Book::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->delete("/books/{$book->id}")
        ->assertRedirect('/books');

    expect(Book::query()->find($book->id))->toBeNull();
});

test('dono não pode excluir livro que está emprestado', function () {
    $user = User::factory()->create();
    $book = Book::factory()->create(['user_id' => $user->id]);
    Loan::factory()->create(['book_id' => $book->id]);

    $this->actingAs($user)
        ->delete("/books/{$book->id}")
        ->assertRedirect();

    expect(Book::query()->find($book->id))->not->toBeNull();
});

test('outro usuário não pode excluir livro alheio', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();
    $book = Book::factory()->create(['user_id' => $owner->id]);

    $this->actingAs($other)
        ->delete("/books/{$book->id}")
        ->assertForbidden();

    expect(Book::query()->find($book->id))->not->toBeNull();
});

test('usuário pode cadastrar livro com imagem de capa', function () {
    Storage::fake('public');
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post('/books', [
            'title' => 'Dom Casmurro',
            'author' => 'Machado de Assis',
            'isbn' => '978-85-359-0277-1',
            'year' => 1899,
            'cover_image' => UploadedFile::fake()->image('capa.jpg', 400, 600),
        ])
        ->assertRedirect('/books');

    $book = Book::query()->first();
    expect($book->cover_image)->not->toBeNull();
    Storage::disk('public')->assertExists($book->cover_image);
});

test('validação rejeita arquivo que não é imagem', function () {
    Storage::fake('public');
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post('/books', [
            'title' => 'Livro',
            'author' => 'Autor',
            'isbn' => '978-85-359-0277-1',
            'year' => 2020,
            'cover_image' => UploadedFile::fake()->create('documento.pdf', 100),
        ])
        ->assertSessionHasErrors('cover_image');
});

test('imagem antiga é removida ao atualizar capa', function () {
    Storage::fake('public');
    $user = User::factory()->create();
    $oldPath = UploadedFile::fake()->image('old.jpg')->store('covers', 'public');
    $book = Book::factory()->create(['user_id' => $user->id, 'cover_image' => $oldPath]);

    $this->actingAs($user)
        ->put("/books/{$book->id}", [
            'title' => $book->title,
            'author' => $book->author,
            'isbn' => $book->isbn,
            'year' => $book->year,
            'cover_image' => UploadedFile::fake()->image('new.jpg', 400, 600),
        ])
        ->assertRedirect("/books/{$book->id}");

    Storage::disk('public')->assertMissing($oldPath);
    Storage::disk('public')->assertExists($book->fresh()->cover_image);
});

test('imagem é removida ao excluir livro', function () {
    Storage::fake('public');
    $user = User::factory()->create();
    $path = UploadedFile::fake()->image('capa.jpg')->store('covers', 'public');
    $book = Book::factory()->create(['user_id' => $user->id, 'cover_image' => $path]);

    $this->actingAs($user)
        ->delete("/books/{$book->id}")
        ->assertRedirect('/books');

    Storage::disk('public')->assertMissing($path);
});
