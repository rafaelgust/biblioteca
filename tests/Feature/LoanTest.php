<?php

use App\Models\Book;
use App\Models\Loan;
use App\Models\User;

test('painel de empréstimos requer autenticação', function () {
    $this->get('/loans')->assertRedirect('/login');
});

test('painel de empréstimos exibe empréstimos separados por seção', function () {
    $user = User::factory()->create();
    $bookFromOther = Book::factory()->create();

    // Empréstimo que o usuário pegou (borrowed)
    Loan::factory()->create(['user_id' => $user->id, 'book_id' => $bookFromOther->id]);

    // Empréstimo que o usuário fez para outro (lent)
    $myBook = Book::factory()->create(['user_id' => $user->id]);
    $otherUser = User::factory()->create();
    Loan::factory()->create(['user_id' => $otherUser->id, 'book_id' => $myBook->id]);

    $this->actingAs($user)
        ->get('/loans')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('loans/index')
            ->has('borrowedLoans.data', 1)
            ->has('lentLoans.data', 1)
        );
});

test('usuário pode emprestar um livro disponível', function () {
    $user = User::factory()->create();
    $book = Book::factory()->create();

    $this->actingAs($user)
        ->post("/loans/{$book->id}")
        ->assertRedirect('/loans');

    expect(Loan::query()->where('user_id', $user->id)->where('book_id', $book->id)->exists())->toBeTrue();

    $loan = Loan::query()->first();
    expect($loan->returned_at)->toBeNull();
    expect((int) $loan->borrowed_at->diffInDays($loan->due_at))->toBe(2);
});

test('usuário não pode emprestar livro já emprestado', function () {
    $user = User::factory()->create();
    $book = Book::factory()->create();

    // Outro usuário já emprestou este livro
    Loan::factory()->create(['book_id' => $book->id]);

    $this->actingAs($user)
        ->post("/loans/{$book->id}")
        ->assertRedirect();

    // Deve ter apenas o empréstimo original
    expect(Loan::query()->where('book_id', $book->id)->count())->toBe(1);
});

test('usuário não pode ter mais de 3 empréstimos simultâneos', function () {
    $user = User::factory()->create();

    // Cria 3 empréstimos ativos
    Loan::factory()->count(3)->create(['user_id' => $user->id]);

    $newBook = Book::factory()->create();

    $this->actingAs($user)
        ->post("/loans/{$newBook->id}")
        ->assertRedirect();

    expect(Loan::query()->where('user_id', $user->id)->count())->toBe(3);
});

test('usuário pode devolver um livro emprestado', function () {
    $user = User::factory()->create();
    $loan = Loan::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->patch("/loans/{$loan->id}/return")
        ->assertRedirect('/loans');

    expect($loan->fresh()->returned_at)->not->toBeNull();
});

test('usuário não pode devolver empréstimo de outro usuário', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();
    $loan = Loan::factory()->create(['user_id' => $owner->id]);

    $this->actingAs($other)
        ->patch("/loans/{$loan->id}/return")
        ->assertRedirect();

    expect($loan->fresh()->returned_at)->toBeNull();
});

test('usuário não pode emprestar o próprio livro', function () {
    $user = User::factory()->create();
    $book = Book::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->post("/loans/{$book->id}")
        ->assertRedirect();

    expect(Loan::query()->where('book_id', $book->id)->exists())->toBeFalse();
});

test('não é possível devolver livro já devolvido', function () {
    $user = User::factory()->create();
    $loan = Loan::factory()->returned()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->patch("/loans/{$loan->id}/return")
        ->assertRedirect();
});

test('dono pode emprestar seu livro para outro usuário', function () {
    $owner = User::factory()->create();
    $borrower = User::factory()->create();
    $book = Book::factory()->create(['user_id' => $owner->id]);

    $this->actingAs($owner)
        ->post("/loans/{$book->id}", ['user_id' => $borrower->id])
        ->assertRedirect("/books/{$book->id}");

    expect(Loan::query()->where('user_id', $borrower->id)->where('book_id', $book->id)->exists())->toBeTrue();
});

test('não-dono não pode emprestar livro para outro usuário', function () {
    $other = User::factory()->create();
    $borrower = User::factory()->create();
    $book = Book::factory()->create();

    $this->actingAs($other)
        ->post("/loans/{$book->id}", ['user_id' => $borrower->id])
        ->assertRedirect();

    expect(Loan::query()->where('book_id', $book->id)->exists())->toBeFalse();
});

test('dono não pode emprestar para usuário com 3 empréstimos ativos', function () {
    $owner = User::factory()->create();
    $borrower = User::factory()->create();
    Loan::factory()->count(3)->create(['user_id' => $borrower->id]);

    $book = Book::factory()->create(['user_id' => $owner->id]);

    $this->actingAs($owner)
        ->post("/loans/{$book->id}", ['user_id' => $borrower->id])
        ->assertRedirect();

    expect(Loan::query()->where('book_id', $book->id)->exists())->toBeFalse();
});

test('endpoint de usuários elegíveis retorna apenas usuários com menos de 3 empréstimos', function () {
    $owner = User::factory()->create();
    $eligible = User::factory()->create();
    $ineligible = User::factory()->create();
    Loan::factory()->count(3)->create(['user_id' => $ineligible->id]);

    $book = Book::factory()->create(['user_id' => $owner->id]);

    $response = $this->actingAs($owner)
        ->getJson("/loans/{$book->id}/eligible-borrowers")
        ->assertSuccessful();

    $ids = collect($response->json())->pluck('id');
    expect($ids)->toContain($eligible->id);
    expect($ids)->not->toContain($ineligible->id);
    expect($ids)->not->toContain($owner->id);
});

test('apenas dono pode acessar endpoint de usuários elegíveis', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();
    $book = Book::factory()->create(['user_id' => $owner->id]);

    $this->actingAs($other)
        ->getJson("/loans/{$book->id}/eligible-borrowers")
        ->assertForbidden();
});

test('livro fica disponível após devolução', function () {
    $user = User::factory()->create();
    $book = Book::factory()->create();
    $loan = Loan::factory()->create(['user_id' => $user->id, 'book_id' => $book->id]);

    expect($book->isAvailable())->toBeFalse();

    $loan->update(['returned_at' => now()]);

    expect($book->fresh()->isAvailable())->toBeTrue();
});

test('empréstimos devolvidos não aparecem no painel', function () {
    $user = User::factory()->create();
    $book = Book::factory()->create();

    // Empréstimo devolvido do usuário — não deve aparecer
    Loan::factory()->returned()->create(['user_id' => $user->id, 'book_id' => $book->id]);

    // Empréstimo ativo do usuário
    $activeBook = Book::factory()->create();
    Loan::factory()->create(['user_id' => $user->id, 'book_id' => $activeBook->id]);

    $this->actingAs($user)
        ->get('/loans')
        ->assertInertia(fn ($page) => $page
            ->has('borrowedLoans.data', 1)
        );
});
