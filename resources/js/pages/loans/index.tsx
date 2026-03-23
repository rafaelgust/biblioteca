import { Head, router, usePage } from '@inertiajs/react';
import { BookCheck, BookOpen, Clock, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { formatDate, isDueSoon, isOverdue } from '@/lib/loan-helpers';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, Loan, PaginatedData } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Empréstimos', href: '/loans' },
];

function LoanCard({
    loan,
    showReturnButton,
    isReturning,
    onReturn,
}: {
    loan: Loan;
    showReturnButton: boolean;
    isReturning: boolean;
    onReturn: (loan: Loan) => void;
}) {
    const overdue = isOverdue(loan.due_at);
    const dueSoon = isDueSoon(loan.due_at);

    return (
        <Card
            className={
                overdue
                    ? 'border-red-300 dark:border-red-800'
                    : dueSoon
                      ? 'border-yellow-300 dark:border-yellow-800'
                      : ''
            }
        >
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                        {loan.book?.title}
                    </CardTitle>
                    {overdue && (
                        <Badge variant="destructive">
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            Atrasado
                        </Badge>
                    )}
                    {dueSoon && !overdue && (
                        <Badge
                            variant="secondary"
                            className="border-yellow-500 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        >
                            <Clock className="mr-1 h-3 w-3" />
                            Vence em breve
                        </Badge>
                    )}
                    {!overdue && !dueSoon && (
                        <Badge variant="outline">No prazo</Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-end justify-between gap-4">
                    <div className="grid grid-cols-1 gap-x-8 gap-y-1 text-sm sm:grid-cols-3">
                        <div>
                            <span className="text-muted-foreground">
                                Autor:{' '}
                            </span>
                            <span>{loan.book?.author}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">
                                Usuário:{' '}
                            </span>
                            <span>{loan.user?.name}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">
                                E-mail:{' '}
                            </span>
                            <span>{loan.user?.email}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">
                                Empréstimo:{' '}
                            </span>
                            <span>{formatDate(loan.borrowed_at)}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">
                                Devolução até:{' '}
                            </span>
                            <span
                                className={
                                    overdue
                                        ? 'font-semibold text-red-600'
                                        : ''
                                }
                            >
                                {formatDate(loan.due_at)}
                            </span>
                        </div>
                    </div>

                    {showReturnButton && (
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={isReturning}
                            onClick={() => onReturn(loan)}
                        >
                            <BookCheck className="mr-1 h-4 w-4" />
                            {isReturning ? 'Devolvendo...' : 'Devolver'}
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function Pagination({ data, preserveParam }: { data: PaginatedData<Loan>; preserveParam?: string }) {
    if (data.last_page <= 1) return null;

    return (
        <nav className="flex items-center justify-center gap-1">
            {data.links.map((link, index) => (
                <Button
                    key={index}
                    variant={link.active ? 'default' : 'ghost'}
                    size="sm"
                    disabled={!link.url}
                    onClick={() =>
                        link.url &&
                        router.get(
                            link.url,
                            {},
                            { preserveState: true },
                        )
                    }
                >
                    <span
                        dangerouslySetInnerHTML={{
                            __html: link.label,
                        }}
                    />
                </Button>
            ))}
        </nav>
    );
}

export default function LoansIndex({
    borrowedLoans,
    lentLoans,
    activeLoansCount,
}: {
    borrowedLoans: PaginatedData<Loan>;
    lentLoans: PaginatedData<Loan>;
    activeLoansCount: number;
}) {
    const { auth } = usePage().props;
    const flash = usePage().props as { success?: string; error?: string };
    const [returningId, setReturningId] = useState<number | null>(null);
    const [confirmLoan, setConfirmLoan] = useState<Loan | null>(null);

    function handleReturn() {
        if (!confirmLoan) return;

        setReturningId(confirmLoan.id);
        setConfirmLoan(null);

        router.patch(`/loans/${confirmLoan.id}/return`, {}, {
            onFinish: () => setReturningId(null),
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Empréstimos" />

            <div className="mx-auto w-full max-w-5xl space-y-6 p-4 lg:p-8">
                <div className="flex items-center justify-between">
                    <Heading
                        title="Painel de Empréstimos"
                        description="Gerencie os empréstimos ativos da biblioteca."
                    />
                    <Badge variant="outline" className="text-sm">
                        Seus empréstimos ativos: {activeLoansCount}/3
                    </Badge>
                </div>

                {flash.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
                        {flash.success}
                    </div>
                )}
                {flash.error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
                        {flash.error}
                    </div>
                )}

                {/* Seção: Livros que eu peguei emprestado */}
                <div className="space-y-3">
                    <h2 className="flex items-center gap-2 text-lg font-semibold">
                        <BookCheck className="h-5 w-5 text-primary" />
                        Livros que peguei emprestado
                    </h2>

                    {borrowedLoans.data.length === 0 ? (
                        <div className="rounded-lg border border-dashed p-8 text-center">
                            <BookCheck className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                            <p className="text-muted-foreground">
                                Você não possui nenhum empréstimo ativo.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {borrowedLoans.data.map((loan) => (
                                <LoanCard
                                    key={loan.id}
                                    loan={loan}
                                    showReturnButton={auth.user?.id === loan.user_id}
                                    isReturning={returningId === loan.id}
                                    onReturn={setConfirmLoan}
                                />
                            ))}
                            <Pagination data={borrowedLoans} />
                        </div>
                    )}
                </div>

                {/* Seção: Livros que eu emprestei para outros */}
                <div className="space-y-3">
                    <h2 className="flex items-center gap-2 text-lg font-semibold">
                        <BookOpen className="h-5 w-5 text-primary" />
                        Livros que emprestei
                    </h2>

                    {lentLoans.data.length === 0 ? (
                        <div className="rounded-lg border border-dashed p-8 text-center">
                            <BookOpen className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                            <p className="text-muted-foreground">
                                Você não emprestou nenhum livro no momento.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {lentLoans.data.map((loan) => (
                                <LoanCard
                                    key={loan.id}
                                    loan={loan}
                                    showReturnButton={false}
                                    isReturning={false}
                                    onReturn={setConfirmLoan}
                                />
                            ))}
                            <Pagination data={lentLoans} />
                        </div>
                    )}
                </div>
            </div>

            {/* Dialog de confirmação de devolução */}
            <Dialog
                open={!!confirmLoan}
                onOpenChange={(v) => !v && setConfirmLoan(null)}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Confirmar Devolução</DialogTitle>
                        <DialogDescription>
                            Deseja registrar a devolução do livro{' '}
                            <span className="font-medium text-foreground">
                                {confirmLoan?.book?.title}
                            </span>
                            ?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setConfirmLoan(null)}
                        >
                            Cancelar
                        </Button>
                        <Button onClick={handleReturn}>
                            Confirmar Devolução
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
