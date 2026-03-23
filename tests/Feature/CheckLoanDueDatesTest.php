<?php

use App\Models\Loan;
use App\Notifications\LoanDueNotification;
use Illuminate\Support\Facades\Notification;

test('comando notifica empréstimos próximos do vencimento', function () {
    Notification::fake();

    // Empréstimo que vence em 6h — deve ser notificado
    $dueSoon = Loan::factory()->dueSoon()->create();

    // Empréstimo que vence em 2 dias — não deve ser notificado
    Loan::factory()->create();

    $this->artisan('loans:check-due-dates')
        ->assertSuccessful();

    Notification::assertSentTo($dueSoon->user, LoanDueNotification::class);
    expect($dueSoon->fresh()->notified)->toBeTrue();
});

test('comando não reenvia notificação para empréstimo já notificado', function () {
    Notification::fake();

    Loan::factory()->dueSoon()->create(['notified' => true]);

    $this->artisan('loans:check-due-dates')
        ->assertSuccessful();

    Notification::assertNothingSent();
});

test('comando não notifica empréstimos já devolvidos', function () {
    Notification::fake();

    Loan::factory()->returned()->create();

    $this->artisan('loans:check-due-dates')
        ->assertSuccessful();

    Notification::assertNothingSent();
});

test('comando não notifica empréstimos já vencidos', function () {
    Notification::fake();

    // Empréstimo atrasado (venceu ontem) — não deve receber notificação de lembrete
    Loan::factory()->overdue()->create();

    $this->artisan('loans:check-due-dates')
        ->assertSuccessful();

    Notification::assertNothingSent();
});

test('comando exibe mensagem quando não há empréstimos próximos do vencimento', function () {
    Notification::fake();

    $this->artisan('loans:check-due-dates')
        ->expectsOutputToContain('Nenhum empréstimo próximo do vencimento encontrado')
        ->assertSuccessful();
});
