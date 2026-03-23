<?php

namespace App\Models;

use Database\Factories\BookFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Facades\Storage;

/**
 * Representa um livro no acervo da biblioteca.
 *
 * Cada livro pertence ao usuário que o cadastrou e pode ter
 * múltiplos empréstimos ao longo do tempo (apenas um ativo por vez).
 */
#[Fillable(['title', 'author', 'isbn', 'year', 'description', 'cover_image'])]
class Book extends Model
{
    /** @use HasFactory<BookFactory> */
    use HasFactory;

    /** @var list<string> */
    protected $appends = ['cover_image_url'];

    /**
     * URL pública da imagem de capa armazenada no storage.
     */
    protected function coverImageUrl(): Attribute
    {
        return Attribute::get(fn () => $this->cover_image
            ? Storage::disk('public')->url($this->cover_image)
            : null
        );
    }

    /**
     * Usuário que cadastrou o livro.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Todos os empréstimos deste livro (histórico completo).
     */
    public function loans(): HasMany
    {
        return $this->hasMany(Loan::class);
    }

    /**
     * Empréstimo ativo (não devolvido) deste livro.
     * Retorna null se o livro está disponível.
     */
    public function activeLoan(): HasOne
    {
        return $this->hasOne(Loan::class)->whereNull('returned_at');
    }

    /**
     * Verifica se o livro está disponível para empréstimo.
     */
    public function isAvailable(): bool
    {
        return ! $this->activeLoan()->exists();
    }
}
