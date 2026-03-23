<?php

namespace App\Notifications;

use App\Models\Loan;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Notificação enviada ao usuário quando faltam 12h ou menos
 * para o vencimento do prazo de devolução de um empréstimo.
 */
class LoanDueNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Loan $loan) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $dueAt = $this->loan->due_at->format('d/m/Y H:i');
        $bookTitle = $this->loan->book->title;

        return (new MailMessage)
            ->subject('Lembrete: Devolução de Livro Próxima do Vencimento')
            ->greeting("Olá, {$notifiable->name}!")
            ->line("O prazo de devolução do livro **\"{$bookTitle}\"** está se encerrando.")
            ->line("**Data limite para devolução:** {$dueAt}")
            ->action('Ver Meus Empréstimos', url('/loans'))
            ->line('Por favor, devolva o livro até a data limite para evitar pendências.');
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'loan_id' => $this->loan->id,
            'book_title' => $this->loan->book->title,
            'due_at' => $this->loan->due_at->toISOString(),
        ];
    }
}
