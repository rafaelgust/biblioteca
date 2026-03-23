<?php

namespace App\Console\Commands;

use App\Models\Loan;
use App\Notifications\LoanDueNotification;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

/**
 * Comando que verifica empréstimos próximos do vencimento.
 *
 * Busca empréstimos ativos cujo prazo de devolução vence em até 12 horas
 * e que ainda não foram notificados. Envia e-mail de alerta ao usuário.
 *
 * Deve ser agendado para execução periódica (ex: a cada hora) via scheduler.
 */
#[Signature('loans:check-due-dates')]
#[Description('Verifica empréstimos próximos do vencimento e envia notificações por e-mail')]
class CheckLoanDueDates extends Command
{
    public function handle(): int
    {
        // Busca empréstimos ativos que vencem em até 12h e ainda não foram notificados
        $loans = Loan::query()
            ->with(['user', 'book'])
            ->whereNull('returned_at')
            ->where('notified', false)
            ->where('due_at', '<=', now()->addHours(12))
            ->where('due_at', '>', now())
            ->get();

        if ($loans->isEmpty()) {
            $this->info('Nenhum empréstimo próximo do vencimento encontrado.');

            return self::SUCCESS;
        }

        $count = 0;

        foreach ($loans as $loan) {
            $loan->user->notify(new LoanDueNotification($loan));

            // Marca como notificado para evitar envio duplicado
            $loan->update(['notified' => true]);

            $count++;
        }

        $this->info("Notificações enviadas: {$count}");

        return self::SUCCESS;
    }
}
