<?php

namespace App\Policies;

use App\Models\Book;
use App\Models\User;

/**
 * Política de autorização para livros.
 *
 * Apenas o usuário que cadastrou um livro pode editá-lo ou excluí-lo.
 * Qualquer usuário autenticado pode cadastrar novos livros.
 */
class BookPolicy
{
    /**
     * Qualquer usuário autenticado pode cadastrar livros.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Apenas o dono do livro pode editá-lo.
     */
    public function update(User $user, Book $book): bool
    {
        return $user->id === $book->user_id;
    }

    /**
     * Apenas o dono do livro pode excluí-lo.
     */
    public function delete(User $user, Book $book): bool
    {
        return $user->id === $book->user_id;
    }
}
