<?php

namespace Database\Factories;

use App\Models\Book;
use App\Models\Loan;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Loan>
 */
class LoanFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $borrowedAt = now();

        return [
            'user_id' => User::factory(),
            'book_id' => Book::factory(),
            'borrowed_at' => $borrowedAt,
            'due_at' => $borrowedAt->copy()->addDays(2),
            'returned_at' => null,
            'notified' => false,
        ];
    }

    /**
     * Empréstimo já devolvido.
     */
    public function returned(): static
    {
        return $this->state(fn (array $attributes) => [
            'returned_at' => now(),
        ]);
    }

    /**
     * Empréstimo com prazo vencido (atrasado).
     */
    public function overdue(): static
    {
        return $this->state(fn (array $attributes) => [
            'borrowed_at' => now()->subDays(3),
            'due_at' => now()->subDay(),
            'returned_at' => null,
        ]);
    }

    /**
     * Empréstimo próximo do vencimento (dentro de 12h).
     */
    public function dueSoon(): static
    {
        return $this->state(fn (array $attributes) => [
            'borrowed_at' => now()->subHours(42),
            'due_at' => now()->addHours(6),
            'returned_at' => null,
            'notified' => false,
        ]);
    }
}
