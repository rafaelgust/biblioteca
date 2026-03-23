<?php

namespace App\Models;

use Database\Factories\LoanFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Representa um empréstimo físico de um livro.
 *
 * Regras de negócio:
 * - Cada empréstimo tem prazo máximo de 2 dias.
 * - Um usuário pode ter no máximo 3 empréstimos ativos simultaneamente.
 * - Um livro só pode ter um empréstimo ativo por vez.
 */
#[Fillable(['user_id', 'book_id', 'borrowed_at', 'due_at', 'returned_at', 'notified'])]
class Loan extends Model
{
    /** @use HasFactory<LoanFactory> */
    use HasFactory;

    /**
     * Usuário que realizou o empréstimo.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Livro emprestado.
     */
    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class);
    }

    /**
     * Verifica se o empréstimo está atrasado.
     */
    public function isOverdue(): bool
    {
        return ! $this->returned_at && $this->due_at->isPast();
    }

    /**
     * Verifica se o empréstimo já foi devolvido.
     */
    public function isReturned(): bool
    {
        return $this->returned_at !== null;
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'borrowed_at' => 'datetime',
            'due_at' => 'datetime',
            'returned_at' => 'datetime',
            'notified' => 'boolean',
        ];
    }
}
