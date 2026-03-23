/**
 * Formata uma data ISO para exibição no padrão brasileiro.
 */
export function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Verifica se o empréstimo está atrasado (prazo já venceu).
 */
export function isOverdue(dueAt: string): boolean {
    return new Date(dueAt) < new Date();
}

/**
 * Verifica se faltam menos de 12h para o vencimento.
 */
export function isDueSoon(dueAt: string): boolean {
    const due = new Date(dueAt);
    const now = new Date();
    const hoursLeft = (due.getTime() - now.getTime()) / (1000 * 60 * 60);

    return hoursLeft > 0 && hoursLeft <= 12;
}
